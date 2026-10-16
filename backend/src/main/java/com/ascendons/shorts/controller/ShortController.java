package com.ascendons.shorts.controller;

import com.ascendons.shorts.dto.ShortResponse;
import com.ascendons.shorts.service.ShortService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/shorts")
@RequiredArgsConstructor
public class ShortController {

    private final ShortService shortService;

    @GetMapping
    public ResponseEntity<List<ShortResponse>> getActive() {
        return ResponseEntity.ok(shortService.getActive());
    }
}
