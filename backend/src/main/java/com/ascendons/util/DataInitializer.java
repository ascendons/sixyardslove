package com.ascendons.util;

import com.ascendons.geo.entity.Currency;
import com.ascendons.geo.repository.CurrencyRepository;
import com.ascendons.user.entity.Role;
import com.ascendons.user.entity.User;
import com.ascendons.user.entity.UserAuth;
import com.ascendons.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CurrencyRepository currencyRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        seedCurrencies();
        seedAdmin();
    }

    private void seedCurrencies() {
        if (currencyRepository.count() == 0) {
            log.info("Seeding base currency...");
            Currency inr = Currency.builder()
                    .code("INR")
                    .name("Indian Rupee")
                    .symbol("₹")
                    .exchangeRate(BigDecimal.ONE)
                    .isBase(true)
                    .isActive(true)
                    .build();
            currencyRepository.save(inr);
        }
    }

    private void seedAdmin() {
        String adminEmail = "admin@sixyardslove.com";
        if (userRepository.existsByEmail(adminEmail)) {
            User adminUser = userRepository.findByEmail(adminEmail).get();
            UserAuth auth = adminUser.getUserAuth();
            if (auth == null) {
                auth = UserAuth.builder().user(adminUser).build();
                adminUser.setUserAuth(auth);
            }
            auth.setPasswordHash(passwordEncoder.encode("admin123"));
            userRepository.save(adminUser);
            log.info("Admin password reset to 'admin123' for: {}", adminEmail);
        } else {
            User adminUser = User.builder()
                    .firstName("System")
                    .lastName("Admin")
                    .email(adminEmail)
                    .role(Role.SUPER_ADMIN)
                    .isActive(true)
                    .build();

            UserAuth auth = UserAuth.builder()
                    .user(adminUser)
                    .passwordHash(passwordEncoder.encode("admin123"))
                    .build();

            adminUser.setUserAuth(auth);
            userRepository.save(adminUser);

            log.info("Default Admin created: {} / admin123", adminEmail);
        }

        String userEmail = "user@sixyardslove.com";
        if (!userRepository.existsByEmail(userEmail)) {
            User regularUser = User.builder()
                    .firstName("Test")
                    .lastName("User")
                    .email(userEmail)
                    .role(Role.USER)
                    .isActive(true)
                    .build();

            UserAuth auth = UserAuth.builder()
                    .user(regularUser)
                    .passwordHash(passwordEncoder.encode("user123"))
                    .build();

            regularUser.setUserAuth(auth);
            userRepository.save(regularUser);

            log.info("Default User created: {} / user123", userEmail);
        }
    }
}
