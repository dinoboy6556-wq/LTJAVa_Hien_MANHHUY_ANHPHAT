package com.example.library.service;
import com.example.library.entity.Book;import com.example.library.repository.*;import org.springframework.stereotype.Service;import org.springframework.transaction.annotation.Transactional;import java.util.*;
@Service public class HomeSelectionService {
 private final BookRepository books;private final LoanItemRepository loans;private final FavoriteRepository favorites;private final BookReviewRepository reviews;
 public HomeSelectionService(BookRepository books,LoanItemRepository loans,FavoriteRepository favorites,BookReviewRepository reviews){this.books=books;this.loans=loans;this.favorites=favorites;this.reviews=reviews;}
 public record Entry(Book book,long borrowCount,long favoriteCount,double averageRating,long reviewCount){}
 public record Selection(long totalBooks,List<Entry> newBooks,List<Entry> popularBooks,List<Entry> topRatedBooks,List<Entry> budgetBooks){}
 @Transactional(readOnly=true) public Selection get(){
  Map<Long,Long> borrowed=new HashMap<>(),saved=new HashMap<>();Map<Long,Object[]> rated=new HashMap<>();
  loans.borrowTotals().forEach(r->borrowed.put((Long)r[0],((Number)r[1]).longValue()));favorites.favoriteTotals().forEach(r->saved.put((Long)r[0],((Number)r[1]).longValue()));reviews.ratingTotals().forEach(r->rated.put((Long)r[0],r));
  var entries=books.findAll().stream().map(b->{var rating=rated.get(b.getId());return new Entry(b,borrowed.getOrDefault(b.getId(),0L),saved.getOrDefault(b.getId(),0L),rating==null?0:((Number)rating[1]).doubleValue(),rating==null?0:((Number)rating[2]).longValue());}).toList();
  Comparator<Entry> newest=Comparator.comparing((Entry e)->e.book().getId()).reversed();
  var newBooks=entries.stream().sorted(newest).limit(4).toList();
  var popular=entries.stream().filter(e->e.borrowCount()>0||e.favoriteCount()>0).sorted(Comparator.comparingLong(Entry::borrowCount).reversed().thenComparing(Comparator.comparingLong(Entry::favoriteCount).reversed()).thenComparing(newest)).limit(4).toList();
  var top=entries.stream().filter(e->e.reviewCount()>0).sorted(Comparator.comparingDouble(Entry::averageRating).reversed().thenComparing(Comparator.comparingLong(Entry::reviewCount).reversed()).thenComparing(newest)).limit(4).toList();
  var budget=entries.stream().filter(e->e.book().getAvailableQuantity()!=null&&e.book().getAvailableQuantity()>0&&e.book().getRentalPrice()!=null&&e.book().getRentalPrice().signum()>=0).sorted(Comparator.comparing((Entry e)->e.book().getRentalPrice()).thenComparing(newest)).limit(4).toList();
  return new Selection(entries.size(),newBooks,popular,top,budget);
 }
}
