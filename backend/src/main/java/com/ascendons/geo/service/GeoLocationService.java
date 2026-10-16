package com.ascendons.geo.service;

import com.ascendons.geo.dto.GeoLocation;
import com.maxmind.geoip2.DatabaseReader;
import com.maxmind.geoip2.exception.GeoIp2Exception;
import com.maxmind.geoip2.model.CountryResponse;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.InetAddress;

@Slf4j
@Service
public class GeoLocationService {

    @Value("${app.geo.db-path}")
    private String dbPath;

    @Value("${app.geo.default-country}")
    private String defaultCountry;

    private final ResourceLoader resourceLoader;
    private DatabaseReader databaseReader;

    public GeoLocationService(ResourceLoader resourceLoader) {
        this.resourceLoader = resourceLoader;
    }

    @PostConstruct
    public void init() {
        try {
            Resource resource = resourceLoader.getResource(dbPath);
            databaseReader = new DatabaseReader.Builder(resource.getInputStream()).build();
            log.info("GeoIP2 database loaded successfully from {}", dbPath);
        } catch (IOException e) {
            log.warn("Could not load GeoIP2 database from {}. Geolocation will default to {}.", dbPath, defaultCountry);
        }
    }

    @PreDestroy
    public void close() {
        if (databaseReader != null) {
            try {
                databaseReader.close();
            } catch (IOException e) {
                log.warn("Error closing GeoIP2 database reader", e);
            }
        }
    }

    public GeoLocation resolve(String ipAddress) {
        if (databaseReader == null || isPrivateOrLoopback(ipAddress)) {
            return defaultLocation();
        }

        try {
            InetAddress inetAddress = InetAddress.getByName(ipAddress);
            CountryResponse response = databaseReader.country(inetAddress);
            return GeoLocation.builder()
                    .countryCode(response.getCountry().getIsoCode())
                    .countryName(response.getCountry().getName())
                    .build();
        } catch (IOException | GeoIp2Exception e) {
            log.debug("Could not resolve IP {}: {}", ipAddress, e.getMessage());
            return defaultLocation();
        }
    }

    private GeoLocation defaultLocation() {
        return GeoLocation.builder()
                .countryCode(defaultCountry)
                .countryName(getDefaultCountryName())
                .build();
    }

    private String getDefaultCountryName() {
        return switch (defaultCountry) {
            case "IN" -> "India";
            case "US" -> "United States";
            case "GB" -> "United Kingdom";
            default -> defaultCountry;
        };
    }

    private boolean isPrivateOrLoopback(String ip) {
        if (ip == null || ip.isBlank()) return true;
        try {
            InetAddress addr = InetAddress.getByName(ip);
            return addr.isLoopbackAddress() || addr.isSiteLocalAddress() || addr.isLinkLocalAddress();
        } catch (Exception e) {
            return true;
        }
    }
}
