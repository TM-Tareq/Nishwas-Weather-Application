package com.nishwas.backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;

/**
 * Async WebSocket broadcast helpers.
 * Kept in a separate bean so @Async proxying works correctly
 * when called from other @Transactional services.
 */
@Service
@RequiredArgsConstructor
public class WebSocketBroadcastService {

    private final SimpMessagingTemplate messaging;

    // Signals all leaderboard subscribers to refetch
    @Async("taskExecutor")
    public void broadcastLeaderboardRefresh() {
        messaging.convertAndSend("/topic/leaderboard", Optional.of(Map.of("refresh", true)));
    }

    // Pushes a new community post to all feed subscribers
    @Async("taskExecutor")
    public void broadcastNewPost(Object post) {
        messaging.convertAndSend("/topic/feed", post);
    }
}
