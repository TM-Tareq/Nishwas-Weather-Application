package com.nishwas.backend.repository;

import com.nishwas.backend.entity.CommunityPost;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CommunityPostRepository extends JpaRepository<CommunityPost, Long> {
    List<CommunityPost> findTop30ByOrderByCreatedAtDesc();
    void deleteByUserEmail(String email);
}
