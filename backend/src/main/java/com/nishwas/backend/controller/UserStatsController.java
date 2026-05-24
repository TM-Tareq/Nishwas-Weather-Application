package com.nishwas.backend.controller;

import com.nishwas.backend.dto.CheckInResponse;
import com.nishwas.backend.dto.LeaderboardEntryResponse;
import com.nishwas.backend.dto.StatsResponse;
import com.nishwas.backend.service.UserStatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/stats")
@RequiredArgsConstructor
public class UserStatsController {

    private final UserStatsService statsService;

    // POST /api/stats/checkin — call once per day, idempotent
    @PostMapping("/checkin")
    public ResponseEntity<CheckInResponse> checkIn(Authentication auth) {
        return ResponseEntity.ok(statsService.checkIn(auth.getName()));
    }

    // GET /api/stats/me — current user's points, streak, badges
    @GetMapping("/me")
    public ResponseEntity<StatsResponse> getMyStats(Authentication auth) {
        return ResponseEntity.ok(statsService.getMyStats(auth.getName()));
    }

    // GET /api/stats/leaderboard — top 10 users by points
    @GetMapping("/leaderboard")
    public ResponseEntity<List<LeaderboardEntryResponse>> getLeaderboard(Authentication auth) {
        return ResponseEntity.ok(statsService.getLeaderboard(auth.getName()));
    }
}
