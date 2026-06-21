package com.dorra.bibliotheque.controller;

import com.dorra.bibliotheque.dto.AuthResponse;
import com.dorra.bibliotheque.dto.LoginRequest;
import com.dorra.bibliotheque.dto.RegisterRequest;
import com.dorra.bibliotheque.entity.User;
import com.dorra.bibliotheque.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public User register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }
    @PostMapping("/login")
public AuthResponse login(
        @Valid @RequestBody LoginRequest request) {

    return authService.login(request);
}
}
