package com.nishwas.backend.service;

import com.nishwas.backend.dto.CommunityEventRequest;
import com.nishwas.backend.dto.CommunityEventResponse;
import com.nishwas.backend.dto.CommunityPostRequest;
import com.nishwas.backend.dto.CommunityPostResponse;
import com.nishwas.backend.entity.CommunityEvent;
import com.nishwas.backend.entity.CommunityPost;
import com.nishwas.backend.entity.User;
import com.nishwas.backend.repository.CommunityEventRepository;
import com.nishwas.backend.repository.CommunityPostRepository;
import com.nishwas.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class CommunityPostService {

    private final CommunityPostRepository postRepo;
    private final CommunityEventRepository eventRepo;
    private final UserRepository userRepo;
    private final WebSocketBroadcastService wsBroadcast;

    //  Posts 

    public CommunityPostResponse createPost(String email, CommunityPostRequest req) {
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        CommunityPost post = new CommunityPost();
        post.setUser(user);
        post.setContent(req.content());
        post.setCityName(req.cityName());
        post.setAqiLevel(req.aqiLevel());
        CommunityPostResponse saved = toPostDto(postRepo.save(post));

        // Async WebSocket broadcast — pushes new post to all feed subscribers
        wsBroadcast.broadcastNewPost(saved);

        return saved;
    }

    public List<CommunityPostResponse> getFeed() {
        return postRepo.findTop30ByOrderByCreatedAtDesc()
                .stream().map(this::toPostDto).toList();
    }

    public CommunityPostResponse likePost(Long postId) {
        CommunityPost post = postRepo.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        post.setLikes(post.getLikes() + 1);
        return toPostDto(postRepo.save(post));
    }

    //  Events 

    public CommunityEventResponse createEvent(String email, CommunityEventRequest req) {
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        CommunityEvent event = new CommunityEvent();
        event.setOrganizer(user);
        event.setTitle(req.title());
        event.setDescription(req.description());
        event.setEventDate(LocalDate.parse(req.eventDate()));
        event.setCityName(req.cityName());
        event.setCategory(req.category());
        return toEventDto(eventRepo.save(event));
    }

    public List<CommunityEventResponse> getUpcomingEvents() {
        return eventRepo.findByEventDateGreaterThanEqualOrderByEventDateAsc(LocalDate.now())
                .stream().map(this::toEventDto).toList();
    }

    public CommunityEventResponse joinEvent(Long eventId) {
        CommunityEvent event = eventRepo.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));
        event.setParticipantCount(event.getParticipantCount() + 1);
        return toEventDto(eventRepo.save(event));
    }

    //  Mappers 

    private CommunityPostResponse toPostDto(CommunityPost p) {
        return new CommunityPostResponse(
                p.getId(), p.getUser().getName(), p.getContent(),
                p.getCityName(), p.getAqiLevel(), p.getLikes(),
                toIso(p.getCreatedAt())
        );
    }

    private CommunityEventResponse toEventDto(CommunityEvent e) {
        return new CommunityEventResponse(
                e.getId(), e.getOrganizer().getName(), e.getTitle(),
                e.getDescription(),
                e.getEventDate() != null ? e.getEventDate().toString() : null,
                e.getCityName(), e.getCategory(), e.getParticipantCount(),
                toIso(e.getCreatedAt())
        );
    }

    private String toIso(LocalDateTime dt) {
        return dt != null ? dt.toString() : null;
    }
}
