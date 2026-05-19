package com.nishwas.backend.dto;

public record AuthResponse(
        String token,
        Long userId,
        String email,
        String name
) {
}
