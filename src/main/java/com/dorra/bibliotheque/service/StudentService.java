package com.dorra.bibliotheque.service;

import com.dorra.bibliotheque.entity.Role;
import com.dorra.bibliotheque.entity.User;
import com.dorra.bibliotheque.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class StudentService {

    private final UserRepository userRepository;

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

        user.setNom(updatedUser.getNom());
        user.setEmail(updatedUser.getEmail());

        return userRepository.save(user);
    }
}