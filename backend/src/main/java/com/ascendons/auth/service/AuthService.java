package com.ascendons.auth.service;

import com.ascendons.auth.dto.AuthResponse;
import com.ascendons.auth.dto.ForgotPasswordRequest;
import com.ascendons.auth.dto.LoginRequest;
import com.ascendons.auth.dto.RefreshTokenRequest;
import com.ascendons.auth.dto.RegisterRequest;
import com.ascendons.auth.dto.RegisterResponse;
import com.ascendons.auth.dto.ResetPasswordRequest;
import com.ascendons.auth.entity.EmailVerificationToken;
import com.ascendons.auth.entity.PasswordResetToken;
import com.ascendons.auth.repository.EmailVerificationTokenRepository;
import com.ascendons.auth.repository.PasswordResetTokenRepository;
import com.ascendons.email.EmailService;
import com.ascendons.exception.BadRequestException;
import com.ascendons.exception.ConflictException;
import com.ascendons.exception.UnauthorizedException;
import com.ascendons.security.JwtUtil;
import com.ascendons.user.entity.Role;
import com.ascendons.user.entity.User;
import com.ascendons.user.entity.UserAuth;
import com.ascendons.user.repository.UserAuthRepository;
import com.ascendons.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final UserAuthRepository userAuthRepository;
    private final EmailVerificationTokenRepository tokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;

    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ConflictException("Email already registered");
        }

        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .role(Role.USER)
                .isActive(true)
                .emailVerified(false)
                .build();

        UserAuth userAuth = UserAuth.builder()
                .user(user)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .build();

        user.setUserAuth(userAuth);
        user = userRepository.save(user);

        String rawToken = UUID.randomUUID().toString();
        EmailVerificationToken verificationToken = EmailVerificationToken.builder()
                .user(user)
                .token(rawToken)
                .expiresAt(OffsetDateTime.now().plusHours(24))
                .build();
        tokenRepository.save(verificationToken);

        emailService.sendVerificationEmail(user.getEmail(), rawToken);

        return new RegisterResponse("A verification link has been sent to " + user.getEmail() + ". Please check your inbox.");
    }

    @Transactional
    public AuthResponse verifyEmail(String token) {
        EmailVerificationToken verificationToken = tokenRepository.findByToken(token)
                .orElseThrow(() -> new BadRequestException("Invalid or expired verification link"));

        if (verificationToken.getExpiresAt().isBefore(OffsetDateTime.now())) {
            tokenRepository.delete(verificationToken);
            throw new BadRequestException("Verification link has expired. Please register again.");
        }

        User user = verificationToken.getUser();
        user.setEmailVerified(true);
        userRepository.save(user);
        tokenRepository.delete(verificationToken);

        String accessToken = jwtUtil.generateAccessToken(user.getId(), user.getRole().name());
        String refreshToken = jwtUtil.generateRefreshToken(user.getId());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .role(user.getRole().name())
                .build();
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        UserAuth userAuth = userAuthRepository.findById(user.getId())
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), userAuth.getPasswordHash())) {
            throw new UnauthorizedException("Invalid email or password");
        }

        if (!user.getIsActive()) {
            throw new BadRequestException("Account is deactivated");
        }

        if (!Boolean.TRUE.equals(user.getEmailVerified())) {
            throw new BadRequestException("Please verify your email before logging in");
        }

        userAuth.setLastLoginAt(OffsetDateTime.now());
        userAuthRepository.save(userAuth);

        String accessToken = jwtUtil.generateAccessToken(user.getId(), user.getRole().name());
        String refreshToken = jwtUtil.generateRefreshToken(user.getId());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .role(user.getRole().name())
                .build();
    }

    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        userRepository.findByEmail(request.getEmail()).ifPresent(user -> {
            passwordResetTokenRepository.deleteByUserId(user.getId());

            String rawToken = UUID.randomUUID().toString();
            PasswordResetToken resetToken = PasswordResetToken.builder()
                    .user(user)
                    .token(rawToken)
                    .expiresAt(OffsetDateTime.now().plusHours(1))
                    .build();
            passwordResetTokenRepository.save(resetToken);

            emailService.sendPasswordResetEmail(user.getEmail(), rawToken);
        });
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(request.getToken())
                .orElseThrow(() -> new BadRequestException("Invalid or expired reset link"));

        if (resetToken.getExpiresAt().isBefore(OffsetDateTime.now())) {
            passwordResetTokenRepository.delete(resetToken);
            throw new BadRequestException("Reset link has expired. Please request a new one.");
        }

        User user = resetToken.getUser();
        UserAuth userAuth = userAuthRepository.findById(user.getId())
                .orElseThrow(() -> new BadRequestException("User not found"));

        userAuth.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userAuthRepository.save(userAuth);
        passwordResetTokenRepository.delete(resetToken);
    }

    public AuthResponse refreshToken(RefreshTokenRequest request) {
        if (!jwtUtil.isTokenValid(request.getRefreshToken())) {
            throw new UnauthorizedException("Invalid or expired refresh token");
        }

        UUID userId = jwtUtil.extractUserId(request.getRefreshToken());
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        String accessToken = jwtUtil.generateAccessToken(user.getId(), user.getRole().name());
        String refreshToken = jwtUtil.generateRefreshToken(user.getId());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .role(user.getRole().name())
                .build();
    }
}
