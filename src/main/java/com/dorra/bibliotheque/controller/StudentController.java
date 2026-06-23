package com.dorra.bibliotheque.controller;

import com.dorra.bibliotheque.entity.User;
import com.dorra.bibliotheque.service.StudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/students")
@RequiredArgsConstructor
public class StudentController {

    private final StudentService studentService;

    @GetMapping
    public List<User> getAllStudents() {
        return studentService.getAllStudents();
    }

    @GetMapping("/{id}")
    public User getStudentById(@PathVariable Long id) {
        return studentService.getStudentById(id);
    }
    @PutMapping("/{id}")
    public User updateStudent(
            @PathVariable Long id,
            @RequestBody User user) {

        return studentService.updateStudent(id, user);
    }
}