package com.ascendons.coupon.util;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;

import java.io.IOException;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeParseException;

public class FlexibleOffsetDateTimeDeserializer extends JsonDeserializer<OffsetDateTime> {

    @Override
    public OffsetDateTime deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        String dateString = p.getText().trim();
        if (dateString.isEmpty()) {
            return null;
        }

        // Handle YYYY-MM-DD
        if (dateString.length() == 10) {
            try {
                return LocalDate.parse(dateString).atTime(23, 59, 59).atOffset(ZoneOffset.UTC);
            } catch (DateTimeParseException e) {
                // Fall through to standard parsing
            }
        }

        try {
            return OffsetDateTime.parse(dateString);
        } catch (DateTimeParseException e) {
            // Try to parse as ISO_LOCAL_DATE_TIME and assume UTC
            try {
                return LocalDate.parse(dateString.split("T")[0]).atTime(23, 59, 59).atOffset(ZoneOffset.UTC);
            } catch (Exception ex) {
                throw new IOException("Unable to parse date: " + dateString, ex);
            }
        }
    }
}
