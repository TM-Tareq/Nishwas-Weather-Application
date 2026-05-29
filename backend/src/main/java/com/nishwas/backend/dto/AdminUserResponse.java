package com.nishwas.backend.dto;

import java.time.LocalDateTime;

public record AdminUserResponse(
        Long id,
        String name,
        String email,
        String role,
        LocalDateTime createdAt,
        int points,
        int checkIns,
        int streak,
        long postCount
) {}
