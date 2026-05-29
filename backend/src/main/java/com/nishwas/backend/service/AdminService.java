package com.nishwas.backend.service;

import com.nishwas.backend.dto.AdminOverviewResponse;
import com.nishwas.backend.dto.AdminPostResponse;
import com.nishwas.backend.dto.AdminUserResponse;
import com.nishwas.backend.entity.CommunityPost;
import com.nishwas.backend.entity.User;
import com.nishwas.backend.entity.UserStats;
import com.nishwas.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository               userRepository;
    private final UserStatsRepository          statsRepository;
    private final CommunityPostRepository      postRepository;
    private final HealthEntryRepository        healthEntryRepository;
    private final CommunityEventRepository     eventRepository;

    // ── Overview ──────────────────────────────────────────────────────────────

    public AdminOverviewResponse getOverview() {
        LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);

        long totalUsers        = userRepository.count();
        long newThisWeek       = userRepository.countByCreatedAtAfter(sevenDaysAgo);
        long totalPosts        = postRepository.count();
        long totalHealthEntries = healthEntryRepository.count();
        long totalCheckIns     = statsRepository.findAll().stream()
                .mapToLong(s -> s.getTotalCheckIns())
                .sum();

        List<AdminUserResponse> recentUsers = userRepository.findTop5ByOrderByCreatedAtDesc()
                .stream().map(this::toUserResponse).toList();

        List<AdminPostResponse> recentPosts = postRepository.findTop5ByOrderByCreatedAtDesc()
                .stream().map(this::toPostResponse).toList();

        return new AdminOverviewResponse(
                totalUsers, newThisWeek, totalPosts,
                totalHealthEntries, totalCheckIns,
                recentUsers, recentPosts
        );
    }

    // ── Users ─────────────────────────────────────────────────────────────────

    public List<AdminUserResponse> getAllUsers() {
        return userRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(this::toUserResponse).toList();
    }

    public AdminUserResponse updateUserRole(Long userId, String newRole) {
        if (!newRole.equals("ADMIN") && !newRole.equals("USER")) {
            throw new IllegalArgumentException("Role must be ADMIN or USER");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        user.setRole(newRole);
        return toUserResponse(userRepository.save(user));
    }

    public void deleteUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        postRepository.deleteByUserEmail(user.getEmail());
        eventRepository.deleteByOrganizerEmail(user.getEmail());
        healthEntryRepository.deleteByUser_Email(user.getEmail());
        statsRepository.deleteByUserEmail(user.getEmail());
        userRepository.delete(user);
    }

    // ── Posts ─────────────────────────────────────────────────────────────────

    public List<AdminPostResponse> getAllPosts() {
        return postRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(this::toPostResponse).toList();
    }

    public void deletePost(Long postId) {
        if (!postRepository.existsById(postId)) {
            throw new RuntimeException("Post not found: " + postId);
        }
        postRepository.deleteById(postId);
    }

    // ── Mappers ───────────────────────────────────────────────────────────────

    private AdminUserResponse toUserResponse(User user) {
        Optional<UserStats> stats = statsRepository.findByUserEmail(user.getEmail());
        long postCount = postRepository.countByUser_Id(user.getId());
        return new AdminUserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole() != null ? user.getRole() : "USER",
                user.getCreatedAt(),
                stats.map(UserStats::getTotalPoints).orElse(0),
                stats.map(UserStats::getTotalCheckIns).orElse(0),
                stats.map(UserStats::getCurrentStreak).orElse(0),
                postCount
        );
    }

    private AdminPostResponse toPostResponse(CommunityPost post) {
        User author = post.getUser();
        return new AdminPostResponse(
                post.getId(),
                author != null ? author.getName() : "Unknown",
                author != null ? author.getEmail() : "",
                post.getContent(),
                post.getCityName(),
                post.getAqiLevel(),
                post.getLikes(),
                post.getCreatedAt()
        );
    }
}
