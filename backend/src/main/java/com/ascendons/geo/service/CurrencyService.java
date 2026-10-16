package com.ascendons.geo.service;

import com.ascendons.exception.ResourceNotFoundException;
import com.ascendons.geo.dto.CurrencyResponse;
import com.ascendons.geo.entity.CountryCurrencyMap;
import com.ascendons.geo.entity.Currency;
import com.ascendons.geo.repository.CountryCurrencyMapRepository;
import com.ascendons.geo.repository.CurrencyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CurrencyService {

    private final CurrencyRepository currencyRepository;
    private final CountryCurrencyMapRepository countryCurrencyMapRepository;

    public Currency getBaseCurrency() {
        return currencyRepository.findByIsBaseTrue()
                .orElseThrow(() -> new ResourceNotFoundException("Currency", "isBase", true));
    }

    public Currency getCurrencyByCode(String code) {
        return currencyRepository.findById(code)
                .orElseThrow(() -> new ResourceNotFoundException("Currency", "code", code));
    }

    public Currency getCurrencyForCountry(String countryCode) {
        return countryCurrencyMapRepository.findByCountryCode(countryCode)
                .map(mapping -> getCurrencyByCode(mapping.getCurrencyCode()))
                .orElseGet(this::getBaseCurrency);
    }

    public BigDecimal convert(BigDecimal amount, String fromCurrencyCode, String toCurrencyCode) {
        if (fromCurrencyCode.equals(toCurrencyCode)) {
            return amount;
        }

        Currency from = getCurrencyByCode(fromCurrencyCode);
        Currency to = getCurrencyByCode(toCurrencyCode);

        // Convert: amount / from_rate * to_rate
        // (normalize to base, then convert to target)
        return amount
                .divide(from.getExchangeRate(), 10, RoundingMode.HALF_UP)
                .multiply(to.getExchangeRate())
                .setScale(2, RoundingMode.HALF_UP);
    }

    public List<CurrencyResponse> getAllActiveCurrencies() {
        return currencyRepository.findByIsActiveTrue().stream()
                .map(this::toResponse)
                .toList();
    }

    public CurrencyResponse toResponse(Currency currency) {
        return CurrencyResponse.builder()
                .code(currency.getCode())
                .name(currency.getName())
                .symbol(currency.getSymbol())
                .exchangeRate(currency.getExchangeRate())
                .isBase(currency.getIsBase())
                .build();
    }
}
