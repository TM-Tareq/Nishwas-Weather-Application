package com.nishwas.backend.controller;

import com.nishwas.backend.dto.AuthResponse;
import com.nishwas.backend.entity.User;
import com.nishwas.backend.repository.UserRepository;
import com.nishwas.backend.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final AuthService authService;

    @GetMapping("/me")
    public ResponseEntity<AuthResponse> getMe(Authentication auth) {
        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(new AuthResponse(null, user.getId(), user.getEmail(), user.getName()));
    }

    @DeleteMapping("/me")
    public ResponseEntity<Void> deleteAccount(Authentication auth) {
        authService.deleteAccount(auth.getName());
        return ResponseEntity.noContent().build();
    }
}
