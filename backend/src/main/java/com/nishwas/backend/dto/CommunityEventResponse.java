package com.nishwas.backend.dto;

public record CommunityEventResponse(
        Long id,
        String organizerName,
        String title,
        String description,
        String eventDate,
        String cityName,
        String category,
        int participantCount,
        String createdAt
) {}
