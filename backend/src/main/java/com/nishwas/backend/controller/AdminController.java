package com.nishwas.backend.controller;

import com.nishwas.backend.dto.AdminOverviewResponse;
import com.nishwas.backend.dto.AdminPostResponse;
import com.nishwas.backend.dto.AdminUserResponse;
import com.nishwas.backend.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Admin-only REST endpoints — protected by ROLE_ADMIN in SecurityConfig.
 * All paths are under /api/admin/** (context-path = /api).
 */
@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    // GET /api/admin/overview
    @GetMapping("/overview")
    public ResponseEntity<AdminOverviewResponse> getOverview() {
        return ResponseEntity.ok(adminService.getOverview());
    }

    // GET /api/admin/users
    @GetMapping("/users")
    public ResponseEntity<List<AdminUserResponse>> getUsers() {
        return ResponseEntity.ok(adminService.getAllUsers());
    }

    // PUT /api/admin/users/{id}/role   body: { "role": "ADMIN" }
    @PutMapping("/users/{id}/role")
    public ResponseEntity<AdminUserResponse> updateRole(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String newRole = body.get("role");
        return ResponseEntity.ok(adminService.updateUserRole(id, newRole));
    }

    // DELETE /api/admin/users/{id}
    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        adminService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    // GET /api/admin/posts
    @GetMapping("/posts")
    public ResponseEntity<List<AdminPostResponse>> getPosts() {
        return ResponseEntity.ok(adminService.getAllPosts());
    }

    // DELETE /api/admin/posts/{id}
    @DeleteMapping("/posts/{id}")
    public ResponseEntity<Void> deletePost(@PathVariable Long id) {
        adminService.deletePost(id);
        return ResponseEntity.noContent().build();
    }
}
