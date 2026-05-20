package com.nishwas.backend.dto;

import java.util.List;

public record LeaderboardEntryResponse(
        int rank,
        String name,
        int totalPoints,
        int currentStreak,
        List<String> badges
) {}
