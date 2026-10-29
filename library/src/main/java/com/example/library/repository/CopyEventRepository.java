package com.example.library.repository;
import com.example.library.entity.CopyEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface CopyEventRepository extends JpaRepository<CopyEvent,Long> {
 List<CopyEvent> findByCopyIdOrderByIdDesc(Long copyId);
}
