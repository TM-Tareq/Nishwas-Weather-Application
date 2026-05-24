package com.nishwas.backend.repository;

import com.nishwas.backend.entity.HealthEntry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface HealthEntryRepository extends JpaRepository<HealthEntry, Long> {
    Optional<HealthEntry> findByUser_EmailAndDate(String email, LocalDate date);
    List<HealthEntry> findByUser_EmailOrderByDateDesc(String email);
    void deleteByUser_Email(String email);
}
