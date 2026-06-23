package com.dorra.bibliotheque.repository;

import com.dorra.bibliotheque.entity.Emprunt;
import com.dorra.bibliotheque.entity.Emprunt.EmpruntStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface EmpruntRepository extends JpaRepository<Emprunt, Long> {

    List<Emprunt> findByUserId(Long userId);

    List<Emprunt> findByStatut(EmpruntStatus statut);

    long countByStatut(EmpruntStatus statut);

    @Query("SELECT e FROM Emprunt e WHERE e.statut = :statut AND e.dateRetourPrevue < :today")
    List<Emprunt> findOverdueEmprunts(@Param("statut") EmpruntStatus statut, @Param("today") LocalDate today);

    @Query("SELECT COUNT(e) FROM Emprunt e WHERE e.statut = :statut AND e.dateRetourPrevue < :today")
    long countOverdueEmprunts(@Param("statut") EmpruntStatus statut, @Param("today") LocalDate today);
}
