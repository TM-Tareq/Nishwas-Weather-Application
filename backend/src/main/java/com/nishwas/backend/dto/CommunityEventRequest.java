package com.nishwas.backend.dto;

public record CommunityEventRequest(
        String title,
        String description,
        String eventDate,   // ISO date string "YYYY-MM-DD" — parsed manually to avoid Jackson LocalDate issues
        String cityName,
        String category
) {}
