package com.nishwas.backend.dto;

public record CommunityPostResponse(
    Long id,
    String authorName,
    String content,
    String cityName,
    Integer aqiLevel,
    int likes,
    String createdAt
) {}
