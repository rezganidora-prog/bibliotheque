package com.dorra.bibliotheque.service;

import com.dorra.bibliotheque.entity.Book;
import com.dorra.bibliotheque.entity.Emprunt;
import com.dorra.bibliotheque.entity.Emprunt.EmpruntStatus;
import com.dorra.bibliotheque.repository.BookRepository;
import com.dorra.bibliotheque.repository.EmpruntRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EmpruntService {

    private final EmpruntRepository empruntRepository;
    private final BookRepository bookRepository;

    public List<Emprunt> getAllEmprunts() {
        return empruntRepository.findAll();
    }

    public List<Emprunt> getUserEmprunts(Long userId) {
        return empruntRepository.findByUserId(userId);
    }

    public List<Emprunt> getOverdueEmprunts() {
        return empruntRepository.findOverdueEmprunts(EmpruntStatus.ACTIF, LocalDate.now());
    }

    public long countActiveEmprunts() {
        return empruntRepository.countByStatut(EmpruntStatus.ACTIF);
    }

    public long countOverdueEmprunts() {
        return empruntRepository.countOverdueEmprunts(EmpruntStatus.ACTIF, LocalDate.now());
    }

    @Transactional
    public Emprunt createEmprunt(Emprunt emprunt) {
        Book book = bookRepository.findById(emprunt.getBook().getId())
                .orElseThrow(() -> new RuntimeException("Livre introuvable"));

        if (book.getQuantite() == null || book.getQuantite() <= 0) {
            throw new RuntimeException("Livre indisponible pour l'emprunt");
        }

        // Décrémenter la quantité
        book.setQuantite(book.getQuantite() - 1);
        book.setDisponible(book.getQuantite() > 0);
        bookRepository.save(book);

        if (emprunt.getStatut() == null) {
            emprunt.setStatut(EmpruntStatus.ACTIF);
        }
        if (emprunt.getDateEmprunt() == null) {
            emprunt.setDateEmprunt(LocalDate.now());
        }
        if (emprunt.getDateRetourPrevue() == null) {
            emprunt.setDateRetourPrevue(LocalDate.now().plusDays(14)); // par défaut 2 semaines
        }
        return empruntRepository.save(emprunt);
    }

    @Transactional
    public Emprunt returnBook(Long id) {
        Emprunt emprunt = empruntRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Emprunt introuvable"));

        if (emprunt.getStatut() == EmpruntStatus.RETOURNE) {
            return emprunt;
        }

        // Mettre à jour l'emprunt
        emprunt.setStatut(EmpruntStatus.RETOURNE);
        emprunt.setDateRetourEffective(LocalDate.now());

        // Incrémenter la quantité du livre
        Book book = emprunt.getBook();
        if (book != null) {
            book.setQuantite((book.getQuantite() != null ? book.getQuantite() : 0) + 1);
            book.setDisponible(true);
            bookRepository.save(book);
        }

        return empruntRepository.save(emprunt);
    }
}

