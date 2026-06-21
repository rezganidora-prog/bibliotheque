package com.dorra.bibliotheque.service;

import com.dorra.bibliotheque.entity.Book;
import com.dorra.bibliotheque.exception.BookNotFoundException;
import com.dorra.bibliotheque.repository.BookRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BookService {

    private final BookRepository bookRepository;

    // CREATE
    public Book addBook(Book book) {

        if (book.getQuantite() == null) {
            book.setQuantite(1);
        }

        book.setDisponible(book.getQuantite() > 0);

        return bookRepository.save(book);
    }

    // READ ALL
    public List<Book> getAllBooks() {
        return bookRepository.findAll();
    }

    // READ BY ID
    public Book getBookById(Long id) {
        return bookRepository.findById(id)
                .orElseThrow(() ->
                        new BookNotFoundException("Livre introuvable avec id : " + id));
    }

    // UPDATE
    public Book updateBook(Long id, Book updatedBook) {

        Book book = getBookById(id);

        book.setTitre(updatedBook.getTitre());
        book.setAuteur(updatedBook.getAuteur());
        book.setIsbn(updatedBook.getIsbn());
        book.setQuantite(updatedBook.getQuantite());

        // logique disponibilité
        book.setDisponible(updatedBook.getQuantite() != null && updatedBook.getQuantite() > 0);

        return bookRepository.save(book);
    }

    // DELETE
    public void deleteBook(Long id) {
        Book book = getBookById(id);
        bookRepository.delete(book);
    }
}