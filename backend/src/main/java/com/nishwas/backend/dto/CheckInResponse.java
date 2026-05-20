package com.nishwas.backend.dto;

import java.util.List;

public record CheckInResponse(
        boolean alreadyCheckedIn,
        int pointsEarned,
        int totalPoints,
        int currentStreak,
        List<String> newBadges,
        List<String> badges
) {}
