package com.nishwas.backend.service;

import com.nishwas.backend.dto.CheckInResponse;
import com.nishwas.backend.dto.LeaderboardEntryResponse;
import com.nishwas.backend.dto.StatsResponse;
import com.nishwas.backend.entity.User;
import com.nishwas.backend.entity.UserStats;
import com.nishwas.backend.repository.UserRepository;
import com.nishwas.backend.repository.UserStatsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserStatsService {

    private final UserStatsRepository statsRepo;
    private final UserRepository userRepo;

    // ── Check-in ─────────────────────────────────────────────────────────────

    public CheckInResponse checkIn(String email) {
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        UserStats stats = statsRepo.findByUserEmail(email)
                .orElseGet(() -> createStats(user));

        LocalDate today = LocalDate.now();

        // Already checked in today — return current state
        if (today.equals(stats.getLastCheckInDate())) {
            return new CheckInResponse(
                    true, 0,
                    stats.getTotalPoints(),
                    stats.getCurrentStreak(),
                    List.of(),
                    parseBadges(stats.getBadges())
            );
        }

        // Streak logic
        boolean streakContinues = stats.getLastCheckInDate() != null
                && stats.getLastCheckInDate().plusDays(1).equals(today);
        int newStreak = streakContinues ? stats.getCurrentStreak() + 1 : 1;

        // Points
        int pointsEarned = 10;
        if (newStreak == 7)  pointsEarned += 50;
        if (newStreak == 30) pointsEarned += 200;

        // Badges
        Set<String> currentBadges = new HashSet<>(parseBadges(stats.getBadges()));
        List<String> newBadges = new ArrayList<>();

        if (stats.getTotalCheckIns() == 0 && !currentBadges.contains("first_breath")) {
            currentBadges.add("first_breath");
            newBadges.add("first_breath");
        }
        if (newStreak >= 7 && !currentBadges.contains("week_warrior")) {
            currentBadges.add("week_warrior");
            newBadges.add("week_warrior");
        }
        if (newStreak >= 30 && !currentBadges.contains("month_master")) {
            currentBadges.add("month_master");
            newBadges.add("month_master");
        }

        // Save
        stats.setCurrentStreak(newStreak);
        stats.setLongestStreak(Math.max(stats.getLongestStreak(), newStreak));
        stats.setTotalPoints(stats.getTotalPoints() + pointsEarned);
        stats.setTotalCheckIns(stats.getTotalCheckIns() + 1);
        stats.setLastCheckInDate(today);
        stats.setBadges(String.join(",", currentBadges));
        statsRepo.save(stats);

        return new CheckInResponse(
                false, pointsEarned,
                stats.getTotalPoints(),
                newStreak,
                newBadges,
                new ArrayList<>(currentBadges)
        );
    }

    // ── My Stats ─────────────────────────────────────────────────────────────

    public StatsResponse getMyStats(String email) {
        return statsRepo.findByUserEmail(email)
                .map(stats -> new StatsResponse(
                        stats.getUser().getName(),
                        stats.getTotalPoints(),
                        stats.getCurrentStreak(),
                        stats.getLongestStreak(),
                        stats.getTotalCheckIns(),
                        parseBadges(stats.getBadges()),
                        LocalDate.now().equals(stats.getLastCheckInDate())
                ))
                .orElse(new StatsResponse("", 0, 0, 0, 0, List.of(), false));
    }

    // ── Leaderboard ───────────────────────────────────────────────────────────

    public List<LeaderboardEntryResponse> getLeaderboard() {
        List<UserStats> top = statsRepo.findTop10ByOrderByTotalPointsDesc()
                .stream()
                .filter(s -> s.getTotalPoints() > 0)
                .collect(Collectors.toList());

        AtomicInteger rank = new AtomicInteger(1);
        return top.stream()
                .map(s -> new LeaderboardEntryResponse(
                        rank.getAndIncrement(),
                        s.getUser().getName(),
                        s.getTotalPoints(),
                        s.getCurrentStreak(),
                        parseBadges(s.getBadges())
                ))
                .collect(Collectors.toList());
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private UserStats createStats(User user) {
        UserStats stats = new UserStats();
        stats.setUser(user);
        stats.setBadges("");
        return statsRepo.save(stats);
    }

    private List<String> parseBadges(String badges) {
        if (badges == null || badges.isBlank()) return List.of();
        return Arrays.asList(badges.split(","));
    }
}
