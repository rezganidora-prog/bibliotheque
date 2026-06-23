package com.dorra.bibliotheque.controller;

import com.dorra.bibliotheque.entity.Role;
import com.dorra.bibliotheque.repository.BookRepository;
import com.dorra.bibliotheque.repository.UserRepository;
import com.dorra.bibliotheque.service.ReservationService;
import com.dorra.bibliotheque.service.EmpruntService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/stats")
@RequiredArgsConstructor
public class StatsController {

    private final BookRepository bookRepository;
    private final UserRepository userRepository;
    private final ReservationService reservationService;
    private final EmpruntService empruntService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getStats() {
        Map<String, Object> stats = new HashMap<>();

        long totalBooks = bookRepository.findAll().stream()
                .mapToLong(b -> b.getQuantite() != null ? b.getQuantite() : 0)
                .sum();
        stats.put("disponible", totalBooks);
        stats.put("etudiants", userRepository.countByRole(Role.STUDENT));
        stats.put("reservations", reservationService.countPendingReservations());
        stats.put("emprunts", empruntService.countActiveEmprunts());
        stats.put("retards", empruntService.countOverdueEmprunts());

        return ResponseEntity.ok(stats);
    }
}
