package com.ascendons.geo.filter;

import com.ascendons.geo.context.GeoContext;
import com.ascendons.geo.dto.GeoLocation;
import com.ascendons.geo.entity.Currency;
import com.ascendons.geo.service.CurrencyService;
import com.ascendons.geo.service.GeoLocationService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Slf4j
@Component
@RequiredArgsConstructor
public class GeoLocationFilter extends OncePerRequestFilter {

    private final GeoLocationService geoLocationService;
    private final CurrencyService currencyService;
    private final GeoContext geoContext;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String ip = extractIp(request);
        GeoLocation location = geoLocationService.resolve(ip);

        Currency currency;
        try {
            currency = currencyService.getCurrencyForCountry(location.getCountryCode());
        } catch (Exception e) {
            log.debug("Could not resolve currency for country {}: {}", location.getCountryCode(), e.getMessage());
            currency = null;
        }

        geoContext.setIpAddress(ip);
        geoContext.setCountryCode(location.getCountryCode());
        geoContext.setCountryName(location.getCountryName());
        if (currency != null) {
            geoContext.setCurrencyCode(currency.getCode());
        }

        filterChain.doFilter(request, response);
    }

    private String extractIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            // Take the first IP in the chain (client IP)
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
