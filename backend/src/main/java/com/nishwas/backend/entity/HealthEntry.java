package com.nishwas.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "health_entries",
       uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "date"}))
public class HealthEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private LocalDate date;

    @Column(nullable = false, length = 20)
    private String feeling; // GOOD, OKAY, UNWELL, SICK

    @Column(length = 500)
    private String symptoms; // comma-separated: COUGH,HEADACHE,...

    @Column(length = 1000)
    private String notes;

    private Integer aqiAtTime;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
