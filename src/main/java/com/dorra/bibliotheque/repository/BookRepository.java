package com.dorra.bibliotheque.repository;

import com.dorra.bibliotheque.entity.Book;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BookRepository extends JpaRepository<Book, Long> {

    List<Book> findByTitreContainingIgnoreCase(String titre);

    List<Book> findByAuteurContainingIgnoreCase(String auteur);
}