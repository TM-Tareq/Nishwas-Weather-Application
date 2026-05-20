package com.nishwas.backend.dto;

import java.util.List;

public record StatsResponse(
        String name,
        int totalPoints,
        int currentStreak,
        int longestStreak,
        int totalCheckIns,
        List<String> badges,
        boolean checkedInToday
) {}
