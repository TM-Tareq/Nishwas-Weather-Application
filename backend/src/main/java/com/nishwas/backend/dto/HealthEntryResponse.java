package com.nishwas.backend.dto;

import java.util.List;

public record HealthEntryResponse(
        Long id,
        String date,
        String feeling,
        List<String> symptoms,
        String notes,
        Integer aqiAtTime,
        String createdAt
) {}
