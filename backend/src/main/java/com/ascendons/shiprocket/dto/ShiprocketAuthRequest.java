package com.ascendons.shiprocket.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ShiprocketAuthRequest {
    private String email;
    private String password;
}
