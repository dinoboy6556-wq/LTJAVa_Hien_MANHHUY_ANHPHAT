package com.example.library.repository;

import com.example.library.entity.PasswordChangeOtp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface PasswordChangeOtpRepository extends JpaRepository<PasswordChangeOtp, Long> {
    Optional<PasswordChangeOtp> findTopByEmailOrderByCreatedAtDesc(String email);

    Optional<PasswordChangeOtp> findByEmailAndOtpCodeAndUsedFalse(String email, String otpCode);

    @Modifying
    @Query("delete from PasswordChangeOtp p where p.email = :email")
    void deleteAllByEmail(@Param("email") String email);
}
