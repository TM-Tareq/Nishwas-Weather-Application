package com.nishwas.backend.repository;

import com.nishwas.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);

    // Admin queries
    long countByCreatedAtAfter(LocalDateTime after);
    List<User> findAllByOrderByCreatedAtDesc();
    List<User> findTop5ByOrderByCreatedAtDesc();
}
