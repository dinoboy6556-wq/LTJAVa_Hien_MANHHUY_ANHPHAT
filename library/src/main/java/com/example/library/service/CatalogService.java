package com.example.library.service;

import com.example.library.entity.Book;
import com.example.library.repository.BookRepository;
import jakarta.persistence.criteria.JoinType;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.util.*;

@Service
public class CatalogService {
    private final BookRepository books;
    public CatalogService(BookRepository books) { this.books = books; }
    private String pattern(String text) {
        return "%" + text.trim().toLowerCase(Locale.ROOT).replace("!", "!!").replace("%", "!%").replace("_", "!_") + "%";
    }
    public Page<Book> search(String q, String author, String category, BigDecimal min, BigDecimal max, String status, String order, int page) {
        if ((min != null && min.signum() < 0) || (max != null && max.signum() < 0) || (min != null && max != null && min.compareTo(max) > 0))
            throw new IllegalArgumentException("Khoảng phí mượn không hợp lệ.");
        Specification<Book> spec = (root, query, cb) -> {
            var predicates = new ArrayList<jakarta.persistence.criteria.Predicate>();
            var a = root.join("author", JoinType.LEFT);
            var c = root.join("category", JoinType.LEFT);
            if (q != null && !q.isBlank()) predicates.add(cb.or(cb.like(cb.lower(root.get("title")), pattern(q), '!'), cb.like(cb.lower(a.get("name")), pattern(q), '!'), cb.like(cb.lower(c.get("name")), pattern(q), '!')));
            if (author != null && !author.isBlank()) predicates.add(cb.like(cb.lower(a.get("name")), pattern(author), '!'));
            if (category != null && !category.isBlank()) predicates.add(cb.like(cb.lower(c.get("name")), pattern(category), '!'));
            if (min != null) predicates.add(cb.greaterThanOrEqualTo(root.get("rentalPrice"), min));
            if (max != null) predicates.add(cb.lessThanOrEqualTo(root.get("rentalPrice"), max));
            if ("available".equals(status)) predicates.add(cb.greaterThan(root.get("availableQuantity"), 0));
            if ("unavailable".equals(status)) predicates.add(cb.equal(root.get("availableQuantity"), 0));
            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };
        Sort sort = switch (order == null ? "" : order) {
            case "title_desc" -> Sort.by("title").descending();
            case "price_asc" -> Sort.by("rentalPrice");
            case "price_desc" -> Sort.by("rentalPrice").descending();
            case "author" -> Sort.by("author.name");
            case "category" -> Sort.by("category.name");
            default -> Sort.by("title");
        };
        var result = books.findAll(spec, PageRequest.of(Math.max(0,page),12,sort.and(Sort.by("id"))));
        if (result.getTotalPages() > 0 && result.getNumber() >= result.getTotalPages())
            return books.findAll(spec, PageRequest.of(result.getTotalPages()-1,12,sort.and(Sort.by("id"))));
        return result;
    }
}
