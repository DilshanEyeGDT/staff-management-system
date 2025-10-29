package com.eyepax.authservice.repository;

import com.eyepax.authservice.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByCognitoSub(String cognitoSub);

    Optional<User> findByEmail(String email);

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.auditLogs WHERE u.id = :id")
    Optional<User> findByIdWithAuditLogs(@Param("id") Long id);

    Page<User> findByUsernameContainingIgnoreCaseOrEmailContainingIgnoreCase(String username, String email,
            Pageable pageable);

}