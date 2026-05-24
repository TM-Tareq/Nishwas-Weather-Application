package com.nishwas.backend.service;

import com.nishwas.backend.dto.HealthEntryRequest;
import com.nishwas.backend.dto.HealthEntryResponse;
import com.nishwas.backend.entity.HealthEntry;
import com.nishwas.backend.entity.User;
import com.nishwas.backend.repository.HealthEntryRepository;
import com.nishwas.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class HealthEntryService {

    private final HealthEntryRepository entryRepo;
    private final UserRepository userRepo;

    public HealthEntryResponse logEntry(String email, HealthEntryRequest req) {
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        LocalDate today = LocalDate.now();
        HealthEntry entry = entryRepo.findByUser_EmailAndDate(email, today)
                .orElseGet(() -> {
                    HealthEntry e = new HealthEntry();
                    e.setUser(user);
                    e.setDate(today);
                    return e;
                });

        entry.setFeeling(req.feeling());
        entry.setSymptoms(req.symptoms() != null && !req.symptoms().isEmpty()
                ? String.join(",", req.symptoms()) : "");
        entry.setNotes(req.notes());
        entry.setAqiAtTime(req.aqiAtTime());

        return toDto(entryRepo.save(entry));
    }

    public List<HealthEntryResponse> getMyHistory(String email) {
        return entryRepo.findByUser_EmailOrderByDateDesc(email)
                .stream().map(this::toDto).toList();
    }

    public HealthEntryResponse getTodayEntry(String email) {
        return entryRepo.findByUser_EmailAndDate(email, LocalDate.now())
                .map(this::toDto)
                .orElse(null);
    }

    private HealthEntryResponse toDto(HealthEntry e) {
        List<String> symptoms = (e.getSymptoms() != null && !e.getSymptoms().isBlank())
                ? Arrays.asList(e.getSymptoms().split(","))
                : List.of();
        return new HealthEntryResponse(
                e.getId(),
                e.getDate().toString(),
                e.getFeeling(),
                symptoms,
                e.getNotes(),
                e.getAqiAtTime(),
                e.getCreatedAt() != null ? e.getCreatedAt().toString() : null
        );
    }
}
