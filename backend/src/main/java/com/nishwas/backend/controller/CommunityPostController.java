package com.nishwas.backend.controller;

import com.nishwas.backend.dto.CommunityEventRequest;
import com.nishwas.backend.dto.CommunityEventResponse;
import com.nishwas.backend.dto.CommunityPostRequest;
import com.nishwas.backend.dto.CommunityPostResponse;
import com.nishwas.backend.service.CommunityPostService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/community")
@RequiredArgsConstructor
public class CommunityPostController {

    private final CommunityPostService service;

    //  Posts 

    @GetMapping("/posts")
    public ResponseEntity<List<CommunityPostResponse>> getFeed() {
        return ResponseEntity.ok(service.getFeed());
    }

    @PostMapping("/posts")
    public ResponseEntity<CommunityPostResponse> createPost(
            Authentication auth, @RequestBody CommunityPostRequest req) {
        return ResponseEntity.ok(service.createPost(auth.getName(), req));
    }

    @PostMapping("/posts/{id}/like")
    public ResponseEntity<CommunityPostResponse> likePost(@PathVariable Long id) {
        return ResponseEntity.ok(service.likePost(id));
    }

    //  Events 

    @GetMapping("/events")
    public ResponseEntity<List<CommunityEventResponse>> getEvents() {
        return ResponseEntity.ok(service.getUpcomingEvents());
    }

    @PostMapping("/events")
    public ResponseEntity<CommunityEventResponse> createEvent(
            Authentication auth, @RequestBody CommunityEventRequest req) {
        return ResponseEntity.ok(service.createEvent(auth.getName(), req));
    }

    @PostMapping("/events/{id}/join")
    public ResponseEntity<CommunityEventResponse> joinEvent(@PathVariable Long id) {
        return ResponseEntity.ok(service.joinEvent(id));
    }
}
