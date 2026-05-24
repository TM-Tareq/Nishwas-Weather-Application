package com.nishwas.backend.controller;

import com.nishwas.backend.dto.HealthEntryRequest;
import com.nishwas.backend.dto.HealthEntryResponse;
import com.nishwas.backend.service.HealthEntryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/diary")
@RequiredArgsConstructor
public class HealthEntryController {

    private final HealthEntryService service;

    @PostMapping("/log")
    public ResponseEntity<HealthEntryResponse> logEntry(Authentication auth,
                                                        @RequestBody HealthEntryRequest req) {
        return ResponseEntity.ok(service.logEntry(auth.getName(), req));
    }

    @GetMapping("/history")
    public ResponseEntity<List<HealthEntryResponse>> getHistory(Authentication auth) {
        return ResponseEntity.ok(service.getMyHistory(auth.getName()));
    }

    @GetMapping("/today")
    public ResponseEntity<HealthEntryResponse> getToday(Authentication auth) {
        HealthEntryResponse entry = service.getTodayEntry(auth.getName());
        return entry != null ? ResponseEntity.ok(entry) : ResponseEntity.noContent().build();
    }
}
