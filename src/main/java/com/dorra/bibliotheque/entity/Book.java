package com.dorra.bibliotheque.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "books")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Book {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String titre;

    private String auteur;

    @Column(unique = true)
    private String isbn;

    private Integer quantite;

    private Boolean disponible;
}