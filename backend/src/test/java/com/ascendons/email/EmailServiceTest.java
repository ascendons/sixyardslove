package com.ascendons.email;

import com.resend.Resend;
import com.resend.core.exception.ResendException;
import com.resend.services.emails.Emails;
import com.resend.services.emails.model.CreateEmailOptions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailServiceTest {

    private static final String TO     = "customer@example.com";
    private static final String FROM   = "noreply@sixyardslove.com";
    private static final String BASE   = "http://localhost:3000";
    private static final String ORDER  = "550e8400-e29b-41d4-a716-446655440000";

    @Mock private Resend resend;
    @Mock private Emails emails;

    private EmailService emailService;

    @BeforeEach
    void setUp() throws ResendException {
        emailService = new EmailService("test-key", FROM, BASE);
        ReflectionTestUtils.setField(emailService, "resend", resend);
        // Use lenient so tests that override send() with doThrow don't trigger UnnecessaryStubbingException
        lenient().when(resend.emails()).thenReturn(emails);
        lenient().when(emails.send(any(CreateEmailOptions.class))).thenReturn(null);
    }

    // ─── helpers ─────────────────────────────────────────────────────────────

    private CreateEmailOptions captureLastSend() throws ResendException {
        ArgumentCaptor<CreateEmailOptions> captor = ArgumentCaptor.forClass(CreateEmailOptions.class);
        verify(emails).send(captor.capture());
        return captor.getValue();
    }

    // ─── Verification email ───────────────────────────────────────────────────

    @Nested
    class SendVerificationEmail {

        @Test
        void sends_with_correct_recipient_and_subject() throws ResendException {
            emailService.sendVerificationEmail(TO, "tok123");

            CreateEmailOptions sent = captureLastSend();
            assertThat(sent.getFrom()).isEqualTo(FROM);
            assertThat(sent.getTo()).contains(TO);
            assertThat(sent.getSubject()).containsIgnoringCase("verify");
        }

        @Test
        void html_contains_verification_link() throws ResendException {
            emailService.sendVerificationEmail(TO, "tok123");

            CreateEmailOptions sent = captureLastSend();
            assertThat(sent.getHtml())
                    .contains(BASE + "/verify-email?token=tok123")
                    .containsIgnoringCase("verify");
        }

        @Test
        void throws_RuntimeException_on_ResendException() throws ResendException {
            when(emails.send(any())).thenThrow(new ResendException("API error"));

            assertThatThrownBy(() -> emailService.sendVerificationEmail(TO, "tok123"))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Failed to send verification email");
        }
    }

    // ─── Password reset email ────────────────────────────────────────────────

    @Nested
    class SendPasswordResetEmail {

        @Test
        void sends_with_correct_recipient_and_subject() throws ResendException {
            emailService.sendPasswordResetEmail(TO, "reset-token-abc");

            CreateEmailOptions sent = captureLastSend();
            assertThat(sent.getFrom()).isEqualTo(FROM);
            assertThat(sent.getTo()).contains(TO);
            assertThat(sent.getSubject()).containsIgnoringCase("password");
        }

        @Test
        void html_contains_reset_link() throws ResendException {
            emailService.sendPasswordResetEmail(TO, "reset-token-abc");

            CreateEmailOptions sent = captureLastSend();
            assertThat(sent.getHtml())
                    .contains(BASE + "/reset-password?token=reset-token-abc");
        }

        @Test
        void throws_RuntimeException_on_ResendException() throws ResendException {
            when(emails.send(any())).thenThrow(new ResendException("API error"));

            assertThatThrownBy(() -> emailService.sendPasswordResetEmail(TO, "tok"))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Failed to send password reset email");
        }
    }

    // ─── Order confirmation email ────────────────────────────────────────────

    @Nested
    class SendOrderConfirmationEmail {

        private final List<EmailService.OrderItemSummary> items = List.of(
                new EmailService.OrderItemSummary("Six Yards Love Pack", "SKU-001", 2, new BigDecimal("150.00"))
        );

        @Test
        void sends_with_correct_recipient_and_subject() throws ResendException {
            emailService.sendOrderConfirmationEmail(TO, "Priya Sharma", ORDER, items,
                    new BigDecimal("300.00"), "INR");

            CreateEmailOptions sent = captureLastSend();
            assertThat(sent.getTo()).contains(TO);
            assertThat(sent.getSubject()).containsIgnoringCase("confirmed");
        }

        @Test
        void html_contains_order_items_and_total() throws ResendException {
            emailService.sendOrderConfirmationEmail(TO, "Priya Sharma", ORDER, items,
                    new BigDecimal("300.00"), "INR");

            CreateEmailOptions sent = captureLastSend();
            assertThat(sent.getHtml())
                    .contains("Six Yards Love Pack")
                    .contains("SKU-001")
                    .contains("INR")
                    .contains("300");
        }

        @Test
        void html_contains_order_tracking_link() throws ResendException {
            emailService.sendOrderConfirmationEmail(TO, "Priya Sharma", ORDER, items,
                    new BigDecimal("300.00"), "INR");

            CreateEmailOptions sent = captureLastSend();
            assertThat(sent.getHtml()).contains(BASE + "/account/orders/" + ORDER);
        }

        @Test
        void silently_swallows_ResendException_without_throwing() throws ResendException {
            when(emails.send(any())).thenThrow(new ResendException("API error"));

            // Should NOT throw — transactional emails are best-effort
            emailService.sendOrderConfirmationEmail(TO, "Priya", ORDER, items,
                    new BigDecimal("300.00"), "INR");

            verify(emails).send(any());
        }
    }

    // ─── Order shipped email ─────────────────────────────────────────────────

    @Nested
    class SendOrderShippedEmail {

        @Test
        void sends_with_awb_and_courier_in_subject_and_body() throws ResendException {
            emailService.sendOrderShippedEmail(TO, "Priya", ORDER, "AWB12345", "Delhivery");

            CreateEmailOptions sent = captureLastSend();
            assertThat(sent.getSubject()).containsIgnoringCase("shipped");
            assertThat(sent.getHtml())
                    .contains("AWB12345")
                    .contains("Delhivery");
        }

        @Test
        void handles_null_awb_and_courier_gracefully() throws ResendException {
            emailService.sendOrderShippedEmail(TO, "Priya", ORDER, null, null);

            CreateEmailOptions sent = captureLastSend();
            // Should not throw and should still render HTML
            assertThat(sent.getHtml()).isNotBlank();
        }

        @Test
        void silently_swallows_ResendException() throws ResendException {
            when(emails.send(any())).thenThrow(new ResendException("fail"));

            emailService.sendOrderShippedEmail(TO, "Priya", ORDER, "AWB", "DHL");

            verify(emails).send(any());
        }
    }

    // ─── Order delivered email ───────────────────────────────────────────────

    @Nested
    class SendOrderDeliveredEmail {

        @Test
        void sends_with_delivered_subject_and_body() throws ResendException {
            emailService.sendOrderDeliveredEmail(TO, "Priya", ORDER);

            CreateEmailOptions sent = captureLastSend();
            assertThat(sent.getSubject()).containsIgnoringCase("delivered");
            assertThat(sent.getHtml()).containsIgnoringCase("delivered");
        }

        @Test
        void silently_swallows_ResendException() throws ResendException {
            when(emails.send(any())).thenThrow(new ResendException("fail"));

            emailService.sendOrderDeliveredEmail(TO, "Priya", ORDER);

            verify(emails).send(any());
        }
    }

    // ─── Order cancelled email ───────────────────────────────────────────────

    @Nested
    class SendOrderCancelledEmail {

        @Test
        void includes_reason_when_provided() throws ResendException {
            emailService.sendOrderCancelledEmail(TO, "Priya", ORDER, "Payment failed");

            CreateEmailOptions sent = captureLastSend();
            assertThat(sent.getHtml()).contains("Payment failed");
        }

        @Test
        void omits_reason_line_when_reason_is_null() throws ResendException {
            emailService.sendOrderCancelledEmail(TO, "Priya", ORDER, null);

            CreateEmailOptions sent = captureLastSend();
            assertThat(sent.getHtml()).doesNotContain("<strong>Reason:</strong>");
        }

        @Test
        void silently_swallows_ResendException() throws ResendException {
            when(emails.send(any())).thenThrow(new ResendException("fail"));

            emailService.sendOrderCancelledEmail(TO, "Priya", ORDER, null);

            verify(emails).send(any());
        }
    }

    // ─── Refund processed email ──────────────────────────────────────────────

    @Nested
    class SendRefundProcessedEmail {

        @Test
        void sends_with_refund_amount_in_subject_and_body() throws ResendException {
            emailService.sendRefundProcessedEmail(TO, "Priya", ORDER, new BigDecimal("250.00"), "INR");

            CreateEmailOptions sent = captureLastSend();
            assertThat(sent.getSubject()).containsIgnoringCase("refund");
            assertThat(sent.getHtml())
                    .contains("250")
                    .contains("INR");
        }

        @Test
        void silently_swallows_ResendException() throws ResendException {
            when(emails.send(any())).thenThrow(new ResendException("fail"));

            emailService.sendRefundProcessedEmail(TO, "Priya", ORDER, new BigDecimal("100.00"), "INR");

            verify(emails).send(any());
        }
    }
}
