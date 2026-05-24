package com.nishwas.backend.repository;

import com.nishwas.backend.entity.UserStats;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserStatsRepository extends JpaRepository<UserStats, Long> {
    Optional<UserStats> findByUserEmail(String email);
    List<UserStats> findTop10ByOrderByTotalPointsDesc();
    void deleteByUserEmail(String email);
}
