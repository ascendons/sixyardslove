package com.ascendons.user.repository;

import com.ascendons.user.entity.User;
import com.ascendons.user.entity.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByPhone(String phone);

    Page<User> findByRole(Role role, Pageable pageable);

    @Query("SELECT u FROM User u WHERE u.role = :role AND " +
           "(LOWER(u.firstName) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           " LOWER(u.lastName)  LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           " LOWER(u.email)     LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           " u.phone            LIKE CONCAT('%', :q, '%'))")
    Page<User> searchCustomers(@Param("role") Role role,
                               @Param("q") String query,
                               Pageable pageable);
}
