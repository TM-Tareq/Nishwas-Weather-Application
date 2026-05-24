package com.nishwas.backend.dto;

import java.util.List;

public record HealthEntryRequest(
        String feeling,
        List<String> symptoms,
        String notes,
        Integer aqiAtTime
) {}
