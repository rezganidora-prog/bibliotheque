package com.dorra.bibliotheque.service;

import com.dorra.bibliotheque.entity.Book;
import com.dorra.bibliotheque.entity.Reservation;
import com.dorra.bibliotheque.entity.Reservation.ReservationStatus;
import com.dorra.bibliotheque.entity.User;
import com.dorra.bibliotheque.exception.BookNotFoundException;
import com.dorra.bibliotheque.repository.BookRepository;
import com.dorra.bibliotheque.repository.ReservationRepository;
import com.dorra.bibliotheque.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final UserRepository userRepository;
    private final BookRepository bookRepository;

    // CREATE
    public Reservation createReservation(Long userId, Long bookId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new BookNotFoundException("Livre introuvable"));

        Reservation reservation = Reservation.builder()
                .user(user)
                .book(book)
                .reservationDate(LocalDateTime.now())
                .status(ReservationStatus.EN_ATTENTE)
                .build();

        return reservationRepository.save(reservation);
    }

    // READ ALL
    public Page<Reservation> getAllReservations(int page, int size) {
        return reservationRepository.findAll(PageRequest.of(page, size));
    }

    // READ BY USER
    public List<Reservation> getReservationsByUser(Long userId) {
        return reservationRepository.findByUserId(userId);
    }

    // READ BY ID
    public Reservation getReservationById(Long id) {
        return reservationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Réservation introuvable"));
    }

    // APPROVE
    public Reservation approveReservation(Long id) {
        Reservation reservation = getReservationById(id);
        reservation.setStatus(ReservationStatus.APPROUVÉ);
        reservation.setApprovalDate(LocalDateTime.now());
        return reservationRepository.save(reservation);
    }

    // REJECT
    public Reservation rejectReservation(Long id, String reason) {
        Reservation reservation = getReservationById(id);
        reservation.setStatus(ReservationStatus.REFUSÉ);
        reservation.setApprovalDate(LocalDateTime.now());
        reservation.setApprovalNotes(reason);
        return reservationRepository.save(reservation);
    }

    // COUNT PENDING
    public long countPendingReservations() {
        return reservationRepository.countByStatus(ReservationStatus.EN_ATTENTE);
    }

    // DELETE
    public void cancelReservation(Long id) {
        Reservation reservation = getReservationById(id);
        reservation.setStatus(ReservationStatus.ANNULÉ);
        reservationRepository.save(reservation);
    }
}
