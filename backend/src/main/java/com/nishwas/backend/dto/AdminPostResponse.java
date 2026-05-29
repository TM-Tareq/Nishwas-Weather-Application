package com.nishwas.backend.dto;

import java.time.LocalDateTime;

public record AdminPostResponse(
        Long id,
        String authorName,
        String authorEmail,
        String content,
        String cityName,
        Integer aqiLevel,
        int likes,
        LocalDateTime createdAt
) {}
