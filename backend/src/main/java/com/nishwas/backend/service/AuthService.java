package com.nishwas.backend.service;

import com.nishwas.backend.dto.AuthResponse;
import com.nishwas.backend.dto.LoginRequest;
import com.nishwas.backend.dto.RegisterRequest;
import com.nishwas.backend.entity.User;
import com.nishwas.backend.repository.CommunityEventRepository;
import com.nishwas.backend.repository.CommunityPostRepository;
import com.nishwas.backend.repository.HealthEntryRepository;
import com.nishwas.backend.repository.UserRepository;
import com.nishwas.backend.repository.UserStatsRepository;
import com.nishwas.backend.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@Transactional
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final CommunityPostRepository communityPostRepository;
    private final CommunityEventRepository communityEventRepository;
    private final HealthEntryRepository healthEntryRepository;
    private final UserStatsRepository userStatsRepository;

    public AuthResponse register(RegisterRequest request) {
        if(userRepository.existsByEmail(request.email())) {
            throw new RuntimeException("Email already registered: " + request.email());
        }

        User user = new User();
        user.setEmail(request.email());
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setName(request.name());
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());

        User savedUser = userRepository.save(user);

        String token = jwtUtil.generateToken(savedUser.getEmail());

        return new AuthResponse(
                token,
                savedUser.getId(),
                savedUser.getEmail(),
                savedUser.getName()
        );
    }

    public void deleteAccount(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        communityPostRepository.deleteByUserEmail(email);
        communityEventRepository.deleteByOrganizerEmail(email);
        healthEntryRepository.deleteByUser_Email(email);
        userStatsRepository.deleteByUserEmail(email);
        userRepository.delete(user);
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email()).orElseThrow(()-> new RuntimeException("Invalid email or password"));

        if(!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new RuntimeException("Invalid email or password");
        }

        String token = jwtUtil.generateToken(user.getEmail());

        return new AuthResponse(
                token,
                user.getId(),
                user.getEmail(),
                user.getName()
        );
    }
}
