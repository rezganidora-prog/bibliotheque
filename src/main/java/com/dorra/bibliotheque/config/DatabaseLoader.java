package com.dorra.bibliotheque.config;

import com.dorra.bibliotheque.entity.Book;
import com.dorra.bibliotheque.entity.Emprunt;
import com.dorra.bibliotheque.entity.Emprunt.EmpruntStatus;
import com.dorra.bibliotheque.entity.Reservation;
import com.dorra.bibliotheque.entity.Reservation.ReservationStatus;
import com.dorra.bibliotheque.entity.Role;
import com.dorra.bibliotheque.entity.User;
import com.dorra.bibliotheque.repository.BookRepository;
import com.dorra.bibliotheque.repository.EmpruntRepository;
import com.dorra.bibliotheque.repository.ReservationRepository;
import com.dorra.bibliotheque.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class DatabaseLoader implements CommandLineRunner {

    private final UserRepository userRepository;
    private final BookRepository bookRepository;
    private final ReservationRepository reservationRepository;
    private final EmpruntRepository empruntRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0) {
            // 1. Créer les utilisateurs
            User admin = User.builder()
                    .nom("Admin")
                    .email("admin@arche.com")
                    .password(passwordEncoder.encode("admin"))
                    .role(Role.ADMIN)
                    .build();
            userRepository.save(admin);

            User student = User.builder()
                    .nom("Dorra")
                    .email("student@example.com")
                    .password(passwordEncoder.encode("password"))
                    .role(Role.STUDENT)
                    .build();
            userRepository.save(student);

            User student2 = User.builder()
                    .nom("Lucas Bernard")
                    .email("lucas.bernard@example.com")
                    .password(passwordEncoder.encode("password"))
                    .role(Role.STUDENT)
                    .build();
            userRepository.save(student2);

            // 2. Créer les livres
            Book book1 = Book.builder()
                    .titre("1984")
                    .auteur("George Orwell")
                    .isbn("9782070368228")
                    .quantite(5)
                    .disponible(true)
                    .build();
            bookRepository.save(book1);

            Book book2 = Book.builder()
                    .titre("Le Petit Prince")
                    .auteur("Antoine de Saint-Exupéry")
                    .isbn("9782070408504")
                    .quantite(3)
                    .disponible(true)
                    .build();
            bookRepository.save(book2);

            Book book3 = Book.builder()
                    .titre("L'Étranger")
                    .auteur("Albert Camus")
                    .isbn("9782070360024")
                    .quantite(4)
                    .disponible(true)
                    .build();
            bookRepository.save(book3);

            Book book4 = Book.builder()
                    .titre("Sapiens")
                    .auteur("Yuval Noah Harari")
                    .isbn("9782226257017")
                    .quantite(2)
                    .disponible(true)
                    .build();
            bookRepository.save(book4);

            // 3. Créer des emprunts
            // Emprunt actif pour Dorra
            Emprunt empruntActif = Emprunt.builder()
                    .book(book1)
                    .user(student)
                    .dateEmprunt(LocalDate.now().minusDays(5))
                    .dateRetourPrevue(LocalDate.now().plusDays(9))
                    .statut(EmpruntStatus.ACTIF)
                    .build();
            empruntRepository.save(empruntActif);

            // Emprunt en retard pour Dorra
            Emprunt empruntRetard = Emprunt.builder()
                    .book(book2)
                    .user(student)
                    .dateEmprunt(LocalDate.now().minusDays(20))
                    .dateRetourPrevue(LocalDate.now().minusDays(6))
                    .statut(EmpruntStatus.ACTIF)
                    .build();
            empruntRepository.save(empruntRetard);

            // Emprunt retourné pour Dorra
            Emprunt empruntRetourne = Emprunt.builder()
                    .book(book3)
                    .user(student)
                    .dateEmprunt(LocalDate.now().minusDays(30))
                    .dateRetourPrevue(LocalDate.now().minusDays(16))
                    .dateRetourEffective(LocalDate.now().minusDays(17))
                    .statut(EmpruntStatus.RETOURNE)
                    .build();
            empruntRepository.save(empruntRetourne);

            // Emprunt en retard pour Lucas Bernard
            Emprunt empruntRetard2 = Emprunt.builder()
                    .book(book4)
                    .user(student2)
                    .dateEmprunt(LocalDate.now().minusDays(15))
                    .dateRetourPrevue(LocalDate.now().minusDays(1))
                    .statut(EmpruntStatus.ACTIF)
                    .build();
            empruntRepository.save(empruntRetard2);

            // 4. Créer des réservations
            Reservation reservationEnAttente = Reservation.builder()
                    .book(book3)
                    .user(student)
                    .reservationDate(LocalDateTime.now().minusDays(1))
                    .status(ReservationStatus.EN_ATTENTE)
                    .build();
            reservationRepository.save(reservationEnAttente);

            Reservation reservationApprouvee = Reservation.builder()
                    .book(book1)
                    .user(student2)
                    .reservationDate(LocalDateTime.now().minusDays(3))
                    .status(ReservationStatus.APPROUVÉ)
                    .approvalDate(LocalDateTime.now().minusDays(2))
                    .build();
            reservationRepository.save(reservationApprouvee);
        }
    }
}
