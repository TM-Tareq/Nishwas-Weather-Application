package com.nishwas.backend.repository;

import com.nishwas.backend.entity.CommunityEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface CommunityEventRepository extends JpaRepository<CommunityEvent, Long> {
    List<CommunityEvent> findByEventDateGreaterThanEqualOrderByEventDateAsc(LocalDate date);
    void deleteByOrganizerEmail(String email);
}
