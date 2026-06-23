package com.dorra.bibliotheque.service;

import com.dorra.bibliotheque.entity.Role;
import com.dorra.bibliotheque.entity.User;
import com.dorra.bibliotheque.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class StudentService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public List<User> getAllStudents() {
        return userRepository.findByRole(Role.STUDENT);
    }

    public User getStudentById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Étudiant introuvable"));
    }

    public User updateStudent(Long id, User updatedUser) {
        User user = getStudentById(id);

        if (updatedUser.getNom() != null && !updatedUser.getNom().trim().isEmpty()) {
            user.setNom(updatedUser.getNom().trim());
        }

        if (updatedUser.getEmail() != null && !updatedUser.getEmail().trim().isEmpty()) {
            user.setEmail(updatedUser.getEmail().trim());
        }

        if (updatedUser.getPassword() != null && !updatedUser.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(updatedUser.getPassword()));
        }

        return userRepository.save(user);
    }
}