package com.dorra.bibliotheque.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "emprunts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Emprunt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "book_id", nullable = false)
    private Book book;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private LocalDate dateEmprunt;
    private LocalDate dateRetourPrevue;
    private LocalDate dateRetourEffective;

    @Enumerated(EnumType.STRING)
    private EmpruntStatus statut;

    public enum EmpruntStatus {
        ACTIF,
        RETOURNE
    }
}
