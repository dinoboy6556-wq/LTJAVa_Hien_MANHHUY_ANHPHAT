package com.example.library.repository;
import com.example.library.entity.LibraryContent;import org.springframework.data.jpa.repository.JpaRepository;import java.util.*;
public interface LibraryContentRepository extends JpaRepository<LibraryContent,Long>{
 List<LibraryContent> findByKindOrderBySortOrderAscIdDesc(String kind);
 List<LibraryContent> findByPublishedTrueOrderBySortOrderAscIdDesc();
 Optional<LibraryContent> findBySlugAndPublishedTrue(String slug);
}
