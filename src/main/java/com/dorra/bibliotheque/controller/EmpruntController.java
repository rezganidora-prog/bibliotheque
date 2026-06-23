package com.dorra.bibliotheque.controller;

import com.dorra.bibliotheque.entity.Emprunt;
import com.dorra.bibliotheque.service.EmpruntService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/emprunts")
@RequiredArgsConstructor
public class EmpruntController {

    private final EmpruntService empruntService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Emprunt>> getAllEmprunts() {
        return ResponseEntity.ok(empruntService.getAllEmprunts());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Emprunt>> getUserEmprunts(@PathVariable Long userId) {
        return ResponseEntity.ok(empruntService.getUserEmprunts(userId));
    }

    @GetMapping("/overdue")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Emprunt>> getOverdueEmprunts() {
        return ResponseEntity.ok(empruntService.getOverdueEmprunts());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Emprunt> createEmprunt(@RequestBody Emprunt emprunt) {
        return ResponseEntity.ok(empruntService.createEmprunt(emprunt));
    }

    @PutMapping("/{id}/return")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Emprunt> returnBook(@PathVariable Long id) {
        return ResponseEntity.ok(empruntService.returnBook(id));
    }
}

