package com.nishwas.backend.dto;

import java.util.List;

public record AdminOverviewResponse(
        long totalUsers,
        long newThisWeek,
        long totalPosts,
        long totalHealthEntries,
        long totalCheckIns,
        List<AdminUserResponse> recentUsers,
        List<AdminPostResponse> recentPosts
) {}
