package com.nishwas.backend.controller;

import com.nishwas.backend.service.AqiCacheService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/aqi")
@RequiredArgsConstructor
public class AqiController {

    private final AqiCacheService aqiCacheService;

    // Returns current cached AQI for all 10 BD cities
    @GetMapping("/cities")
    public Map<String, Integer> getCitiesAqi() {
        return aqiCacheService.getCache();
    }
}
