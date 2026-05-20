package com.nishwas.backend.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;

@Data
@Entity
@Table(name = "user_stats")
public class UserStats {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", unique = true, nullable = false)
    private User user;

    @Column(name = "total_points")
    private int totalPoints = 0;

    @Column(name = "current_streak")
    private int currentStreak = 0;

    @Column(name = "longest_streak")
    private int longestStreak = 0;

    @Column(name = "total_checkins")
    private int totalCheckIns = 0;

    @Column(name = "last_checkin_date")
    private LocalDate lastCheckInDate;

    // Comma-separated badge IDs, e.g. "first_breath,week_warrior"
    @Column(name = "badges", length = 500)
    private String badges = "";

    @PrePersist
    protected void onCreate() {
        if (badges == null) badges = "";
    }
}
