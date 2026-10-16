package com.ascendons.email;

import com.resend.Resend;
import com.resend.core.exception.ResendException;
import com.resend.services.emails.model.CreateEmailOptions;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
@Slf4j
public class EmailService {

    private final Resend resend;
    private final String fromEmail;
    private final String frontendBaseUrl;

    public record OrderItemSummary(String productName, String sku, int quantity, BigDecimal price) {}

    public EmailService(
            @Value("${app.email.api-key}") String apiKey,
            @Value("${app.email.from:noreply@sixyardslove.com}") String fromEmail,
            @Value("${app.email.frontend-base-url:http://localhost:5173}") String frontendBaseUrl) {
        this.resend = new Resend(apiKey);
        this.fromEmail = fromEmail;
        this.frontendBaseUrl = frontendBaseUrl;
    }

    // ── Shared layout helpers ─────────────────────────────────────

    private String header(String accentColor, String title, String preheader) {
        return """
                <!DOCTYPE html>
                <html lang="en">
                <head>
                  <meta charset="UTF-8"/>
                  <meta name="viewport" content="width=device-width,initial-scale=1"/>
                  <title>%s</title>
                </head>
                <body style="margin:0;padding:0;background:#FAF7F5;font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1a1a;">
                <span style="display:none;max-height:0;overflow:hidden;mso-hide:all;">%s</span>
                <table width="100%%" cellpadding="0" cellspacing="0" style="background:#FAF7F5;padding:32px 16px;">
                  <tr><td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%%;">
                    <!-- Logo bar -->
                    <tr>
                      <td style="padding-bottom:20px;text-align:center;">
                        <span style="font-family:Georgia,serif;font-size:26px;font-weight:bold;color:#6B3A1F;letter-spacing:2px;">Six Yards Love</span>
                      </td>
                    </tr>
                    <!-- Card -->
                    <tr>
                      <td style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
                        <!-- Header band -->
                        <table width="100%%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="background:%s;padding:28px 32px;text-align:center;">
                              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:0.5px;">%s</h1>
                            </td>
                          </tr>
                        </table>
                        <!-- Body -->
                        <table width="100%%" cellpadding="0" cellspacing="0">
                          <tr><td style="padding:32px;">
                """.formatted(title, preheader, accentColor, title);
    }

    private String footer() {
        return """
                          </td></tr>
                        </table>
                        <!-- Footer -->
                        <table width="100%%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="background:#FAF7F5;border-top:1px solid #e5e7eb;padding:20px 32px;text-align:center;">
                              <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">
                                Need help? Write to us at
                                <a href="mailto:support@sixyardslove.com" style="color:#6B3A1F;text-decoration:none;">support@sixyardslove.com</a>
                              </p>
                              <p style="margin:0;font-size:12px;color:#9ca3af;">
                                Six Yards Love &nbsp;·&nbsp; Handpicked sarees, delivered with love &nbsp;·&nbsp;
                                <a href="https://www.sixyardslove.com" style="color:#9ca3af;">www.sixyardslove.com</a>
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                  </td></tr>
                </table>
                </body>
                </html>
                """;
    }

    private String pill(String color, String text) {
        return "<span style=\"display:inline-block;background:%s;color:#fff;font-size:12px;font-weight:700;" +
               "padding:4px 12px;border-radius:20px;letter-spacing:0.5px;\">%s</span>"
                .formatted(color, text);
    }

    private String infoBox(String bgColor, String content) {
        return "<div style=\"background:%s;border-radius:8px;padding:16px 20px;margin:16px 0;\">%s</div>"
                .formatted(bgColor, content);
    }

    private String ctaButton(String color, String href, String label) {
        return """
               <table cellpadding="0" cellspacing="0" style="margin:24px auto 0;">
                 <tr>
                   <td style="background:%s;border-radius:8px;">
                     <a href="%s" style="display:inline-block;padding:14px 32px;color:#fff;font-weight:700;
                        font-size:15px;text-decoration:none;letter-spacing:0.3px;">%s</a>
                   </td>
                 </tr>
               </table>
               """.formatted(color, href, label);
    }

    // ── 1. Verification email ─────────────────────────────────────

    public void sendVerificationEmail(String toEmail, String token) {
        String verifyLink = frontendBaseUrl + "/verify-email?token=" + token;

        String html = header("#6B3A1F", "Verify Your Email Address", "Click below to activate your Six Yards Love account.")
                + "<p style=\"margin:0 0 16px;font-size:15px;\">Welcome to <strong>Six Yards Love</strong>! We're delighted to have you.</p>"
                + "<p style=\"margin:0 0 16px;font-size:15px;\">Please verify your email address to activate your account and start shopping.</p>"
                + ctaButton("#6B3A1F", verifyLink, "Verify Email Address")
                + "<p style=\"margin:24px 0 4px;font-size:13px;color:#6b7280;\">Or copy this link into your browser:</p>"
                + "<p style=\"margin:0;font-size:12px;color:#6b7280;word-break:break-all;\">" + verifyLink + "</p>"
                + "<p style=\"margin:24px 0 0;font-size:12px;color:#9ca3af;\">This link expires in 24 hours. If you didn't create a Six Yards Love account, you can safely ignore this email.</p>"
                + footer();

        send(toEmail, "Verify your Six Yards Love account", html, "verification");
    }

    // ── 2. Password reset ─────────────────────────────────────────

    public void sendPasswordResetEmail(String toEmail, String token) {
        String resetLink = frontendBaseUrl + "/reset-password?token=" + token;

        String html = header("#6B3A1F", "Reset Your Password", "We received a request to reset your Six Yards Love password.")
                + "<p style=\"margin:0 0 16px;font-size:15px;\">We received a request to reset the password for your Six Yards Love account.</p>"
                + "<p style=\"margin:0 0 16px;font-size:15px;\">Click the button below to choose a new password. This link expires in <strong>1 hour</strong>.</p>"
                + ctaButton("#6B3A1F", resetLink, "Reset Password")
                + "<p style=\"margin:24px 0 4px;font-size:13px;color:#6b7280;\">Or copy this link into your browser:</p>"
                + "<p style=\"margin:0;font-size:12px;color:#6b7280;word-break:break-all;\">" + resetLink + "</p>"
                + "<p style=\"margin:24px 0 0;font-size:12px;color:#9ca3af;\">If you didn't request a password reset, your account is safe — just ignore this email.</p>"
                + footer();

        send(toEmail, "Reset your Six Yards Love password", html, "password reset");
    }

    // ── 3. Order confirmation ─────────────────────────────────────

    public void sendOrderConfirmationEmail(String toEmail, String customerName,
                                           String orderId, List<OrderItemSummary> items,
                                           BigDecimal totalAmount, String currency) {
        String orderLink = frontendBaseUrl + "/account/orders/" + orderId;
        String shortId = shortId(orderId);

        StringBuilder rows = new StringBuilder();
        for (OrderItemSummary item : items) {
            BigDecimal lineTotal = item.price().multiply(BigDecimal.valueOf(item.quantity()));
            rows.append("""
                    <tr>
                      <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-size:14px;">
                        <strong>%s</strong><br/>
                        <span style="color:#9ca3af;font-size:12px;">SKU: %s</span>
                      </td>
                      <td style="padding:10px 8px;border-bottom:1px solid #f3f4f6;text-align:center;font-size:14px;color:#6b7280;">×%d</td>
                      <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;text-align:right;font-size:14px;font-weight:600;">%s %.2f</td>
                    </tr>
                    """.formatted(item.productName(), item.sku(), item.quantity(), currency, lineTotal));
        }

        String html = header("#6B3A1F", "Order Confirmed!", "Your Six Yards Love order #" + shortId + " is confirmed.")
                + "<p style=\"margin:0 0 16px;font-size:15px;\">Hi <strong>" + customerName + "</strong>,</p>"
                + "<p style=\"margin:0 0 20px;font-size:15px;\">Thank you for your order! We've received your payment and are preparing your items with care.</p>"
                + infoBox("#FEF3E2",
                    "<p style=\"margin:0 0 2px;font-size:11px;color:#92400e;text-transform:uppercase;font-weight:700;letter-spacing:1px;\">Order ID</p>"
                  + "<p style=\"margin:0;font-family:monospace;font-size:20px;font-weight:700;color:#6B3A1F;\">#" + shortId + "</p>")
                + "<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"border-collapse:collapse;margin:0 0 16px;\">"
                + "<thead><tr>"
                + "<th style=\"text-align:left;padding:8px 0;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid #e5e7eb;\">Item</th>"
                + "<th style=\"text-align:center;padding:8px 0;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid #e5e7eb;\">Qty</th>"
                + "<th style=\"text-align:right;padding:8px 0;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid #e5e7eb;\">Subtotal</th>"
                + "</tr></thead>"
                + "<tbody>" + rows + "</tbody>"
                + "<tfoot><tr>"
                + "<td colspan=\"2\" style=\"padding:12px 0 0;font-size:15px;font-weight:700;\">Total</td>"
                + "<td style=\"padding:12px 0 0;text-align:right;font-size:18px;font-weight:700;color:#6B3A1F;\">" + currency + " " + String.format("%.2f", totalAmount) + "</td>"
                + "</tr></tfoot>"
                + "</table>"
                + "<p style=\"margin:0 0 0;font-size:14px;color:#6b7280;\">We'll send you another email once your order ships.</p>"
                + ctaButton("#6B3A1F", orderLink, "Track Your Order")
                + footer();

        send(toEmail, "Your Six Yards Love order is confirmed! #" + shortId, html, "order confirmation");
    }

    // ── 4. Order shipped ─────────────────────────────────────────

    public void sendOrderShippedEmail(String toEmail, String customerName,
                                      String orderId, String awbCode, String courierName) {
        String trackLink = frontendBaseUrl + "/account/orders/" + orderId;
        String shortId = shortId(orderId);
        String courier = courierName != null ? courierName : "Courier";
        String awb = awbCode != null ? awbCode : "—";

        String html = header("#6B3A1F", "Your Order Has Shipped!", "Order #" + shortId + " is on its way to you.")
                + "<p style=\"margin:0 0 16px;font-size:15px;\">Hi <strong>" + customerName + "</strong>,</p>"
                + "<p style=\"margin:0 0 20px;font-size:15px;\">Great news — your Six Yards Love order is packed and on its way!</p>"
                + infoBox("#FEF3E2",
                    "<p style=\"margin:0 0 10px;font-size:11px;color:#92400e;text-transform:uppercase;font-weight:700;letter-spacing:1px;\">Shipping Details</p>"
                  + "<table cellpadding=\"0\" cellspacing=\"0\" style=\"width:100%;\">"
                  + "<tr><td style=\"font-size:14px;color:#6b7280;padding-bottom:6px;\">Order</td>"
                  + "<td style=\"font-size:14px;font-weight:700;text-align:right;padding-bottom:6px;\">#" + shortId + "</td></tr>"
                  + "<tr><td style=\"font-size:14px;color:#6b7280;padding-bottom:6px;\">Courier</td>"
                  + "<td style=\"font-size:14px;font-weight:700;text-align:right;padding-bottom:6px;\">" + courier + "</td></tr>"
                  + "<tr><td style=\"font-size:14px;color:#6b7280;\">Tracking #</td>"
                  + "<td style=\"font-size:14px;font-weight:700;font-family:monospace;text-align:right;\">" + awb + "</td></tr>"
                  + "</table>")
                + "<p style=\"margin:0;font-size:14px;color:#6b7280;\">Click below to see live tracking updates.</p>"
                + ctaButton("#6B3A1F", trackLink, "Track Delivery")
                + footer();

        send(toEmail, "Your Six Yards Love order #" + shortId + " has shipped!", html, "order shipped");
    }

    // ── 5. Order delivered ────────────────────────────────────────

    public void sendOrderDeliveredEmail(String toEmail, String customerName, String orderId) {
        String orderLink = frontendBaseUrl + "/account/orders/" + orderId;
        String shopLink = frontendBaseUrl + "/shop";
        String shortId = shortId(orderId);

        String html = header("#065F46", "Order Delivered!", "Your Six Yards Love order #" + shortId + " has arrived.")
                + "<p style=\"margin:0 0 16px;font-size:15px;\">Hi <strong>" + customerName + "</strong>,</p>"
                + "<p style=\"margin:0 0 16px;font-size:15px;\">Your order <strong>#" + shortId + "</strong> has been delivered. We hope you love your Six Yards Love products!</p>"
                + "<p style=\"margin:0 0 20px;font-size:15px;\">If anything isn't right, you can request a return from your order page within the return window.</p>"
                + ctaButton("#065F46", orderLink, "View Order")
                + "<p style=\"margin:20px 0 0;font-size:14px;text-align:center;\">"
                + "<a href=\"" + shopLink + "\" style=\"color:#6B3A1F;font-weight:600;\">Continue Shopping →</a></p>"
                + footer();

        send(toEmail, "Your Six Yards Love order #" + shortId + " has been delivered", html, "order delivered");
    }

    // ── 6. Order cancelled ────────────────────────────────────────

    public void sendOrderCancelledEmail(String toEmail, String customerName, String orderId, String reason) {
        String ordersLink = frontendBaseUrl + "/account/orders";
        String shortId = shortId(orderId);
        String reasonBlock = (reason != null && !reason.isBlank())
                ? infoBox("#FEF2F2",
                    "<p style=\"margin:0 0 2px;font-size:11px;color:#991b1b;text-transform:uppercase;font-weight:700;letter-spacing:1px;\">Reason</p>"
                  + "<p style=\"margin:0;font-size:14px;color:#7f1d1d;\">" + reason + "</p>")
                : "";

        String html = header("#991B1B", "Order Cancelled", "Your Six Yards Love order #" + shortId + " has been cancelled.")
                + "<p style=\"margin:0 0 16px;font-size:15px;\">Hi <strong>" + customerName + "</strong>,</p>"
                + "<p style=\"margin:0 0 16px;font-size:15px;\">Your order <strong>#" + shortId + "</strong> has been cancelled.</p>"
                + reasonBlock
                + "<p style=\"margin:0 0 20px;font-size:15px;\">If a payment was made, a refund will be initiated and credited to your original payment method within <strong>5–7 business days</strong>.</p>"
                + ctaButton("#6b7280", ordersLink, "View My Orders")
                + footer();

        send(toEmail, "Your Six Yards Love order #" + shortId + " has been cancelled", html, "order cancelled");
    }

    // ── 7. Refund processed ───────────────────────────────────────

    public void sendRefundProcessedEmail(String toEmail, String customerName,
                                         String orderId, BigDecimal refundAmount, String currency) {
        String shortId = shortId(orderId);

        String html = header("#6B3A1F", "Refund Initiated", "Your refund for order #" + shortId + " is on its way.")
                + "<p style=\"margin:0 0 16px;font-size:15px;\">Hi <strong>" + customerName + "</strong>,</p>"
                + "<p style=\"margin:0 0 20px;font-size:15px;\">A refund has been initiated for your order <strong>#" + shortId + "</strong>.</p>"
                + infoBox("#FEF3E2",
                    "<p style=\"margin:0 0 2px;font-size:11px;color:#92400e;text-transform:uppercase;font-weight:700;letter-spacing:1px;\">Refund Amount</p>"
                  + "<p style=\"margin:0;font-size:28px;font-weight:700;color:#6B3A1F;\">" + currency + " " + String.format("%.2f", refundAmount) + "</p>")
                + "<p style=\"margin:0 0 0;font-size:15px;\">The amount will be credited to your original payment method within <strong>5–7 business days</strong>.</p>"
                + footer();

        send(toEmail, "Refund initiated for your Six Yards Love order #" + shortId, html, "refund processed");
    }

    // ── 8. Return requested ───────────────────────────────────────

    public void sendReturnRequestedEmail(String customerEmail, String customerName,
                                         String orderId, String reason) {
        String shortId = shortId(orderId);
        String reasonText = (reason != null && !reason.isBlank()) ? reason : "No reason provided";

        // Email to admin
        String adminHtml = header("#6B3A1F", "Return Request — Action Required",
                "Customer " + customerName + " has requested a return for order #" + shortId + ".")
                + "<p style=\"margin:0 0 16px;font-size:15px;\">A customer has submitted a return request.</p>"
                + infoBox("#FEF3E2",
                    "<table cellpadding=\"0\" cellspacing=\"0\" style=\"width:100%;\">"
                  + "<tr><td style=\"font-size:14px;color:#6b7280;padding-bottom:8px;\">Order</td>"
                  + "<td style=\"font-size:14px;font-weight:700;text-align:right;padding-bottom:8px;font-family:monospace;\">#" + shortId + "</td></tr>"
                  + "<tr><td style=\"font-size:14px;color:#6b7280;padding-bottom:8px;\">Customer</td>"
                  + "<td style=\"font-size:14px;font-weight:700;text-align:right;padding-bottom:8px;\">" + customerName + "</td></tr>"
                  + "<tr><td style=\"font-size:14px;color:#6b7280;padding-bottom:8px;\">Email</td>"
                  + "<td style=\"font-size:14px;text-align:right;padding-bottom:8px;\">" + customerEmail + "</td></tr>"
                  + "<tr><td style=\"font-size:14px;color:#6b7280;\">Reason</td>"
                  + "<td style=\"font-size:14px;text-align:right;\">" + reasonText + "</td></tr>"
                  + "</table>")
                + "<p style=\"margin:0;font-size:14px;color:#6b7280;\">Please review and approve or reject the return in the admin dashboard.</p>"
                + footer();

        send("support@sixyardslove.com", "Return request for order #" + shortId + " — action required", adminHtml, "return request (admin)");

        // Confirmation to customer
        String customerHtml = header("#6B3A1F", "Return Request Received",
                "We've received your return request for order #" + shortId + ".")
                + "<p style=\"margin:0 0 16px;font-size:15px;\">Hi <strong>" + customerName + "</strong>,</p>"
                + "<p style=\"margin:0 0 20px;font-size:15px;\">We've received your return request for order <strong>#" + shortId + "</strong>.</p>"
                + infoBox("#FEF3E2",
                    "<p style=\"margin:0 0 2px;font-size:11px;color:#92400e;text-transform:uppercase;font-weight:700;letter-spacing:1px;\">Your Reason</p>"
                  + "<p style=\"margin:0;font-size:14px;color:#78350f;\">" + reasonText + "</p>")
                + "<p style=\"margin:0;font-size:15px;\">Our team will review your request and get back to you within <strong>2–3 business days</strong> with the next steps.</p>"
                + footer();

        send(customerEmail, "We've received your return request — order #" + shortId, customerHtml, "return request (customer)");
    }

    // ── 9. Return approved ────────────────────────────────────────

    public void sendReturnApprovedEmail(String toEmail, String customerName, String orderId) {
        String ordersLink = frontendBaseUrl + "/account/orders/" + orderId;
        String shortId = shortId(orderId);

        String html = header("#065F46", "Return Approved", "Your return for order #" + shortId + " has been approved.")
                + "<p style=\"margin:0 0 16px;font-size:15px;\">Hi <strong>" + customerName + "</strong>,</p>"
                + "<p style=\"margin:0 0 16px;font-size:15px;\">Good news — your return request for order <strong>#" + shortId + "</strong> has been <strong>approved</strong>.</p>"
                + infoBox("#F0FDF4",
                    "<p style=\"margin:0 0 6px;font-size:14px;color:#166534;\">✓ &nbsp;Your return has been approved</p>"
                  + "<p style=\"margin:0;font-size:14px;color:#166534;\">✓ &nbsp;A refund will be processed once we receive the item</p>")
                + "<p style=\"margin:0 0 16px;font-size:15px;\">Our team will reach out with instructions on how to return the item. Please keep the original packaging if possible.</p>"
                + "<p style=\"margin:0 0 0;font-size:15px;\">If you have questions, write to us at <a href=\"mailto:support@sixyardslove.com\" style=\"color:#6B3A1F;\">support@sixyardslove.com</a>.</p>"
                + ctaButton("#065F46", ordersLink, "View Order")
                + footer();

        send(toEmail, "Your return for order #" + shortId + " has been approved", html, "return approved");
    }

    // ── 10. Return rejected ───────────────────────────────────────

    public void sendReturnRejectedEmail(String toEmail, String customerName, String orderId, String reason) {
        String ordersLink = frontendBaseUrl + "/account/orders/" + orderId;
        String shortId = shortId(orderId);
        String reasonBlock = (reason != null && !reason.isBlank())
                ? infoBox("#FEF2F2",
                    "<p style=\"margin:0 0 2px;font-size:11px;color:#991b1b;text-transform:uppercase;font-weight:700;letter-spacing:1px;\">Reason</p>"
                  + "<p style=\"margin:0;font-size:14px;color:#7f1d1d;\">" + reason + "</p>")
                : "";

        String html = header("#991B1B", "Return Request Declined", "Your return request for order #" + shortId + " could not be approved.")
                + "<p style=\"margin:0 0 16px;font-size:15px;\">Hi <strong>" + customerName + "</strong>,</p>"
                + "<p style=\"margin:0 0 16px;font-size:15px;\">Unfortunately, your return request for order <strong>#" + shortId + "</strong> has been declined.</p>"
                + reasonBlock
                + "<p style=\"margin:0 0 16px;font-size:15px;\">If you believe this decision is incorrect or would like to discuss further, please contact our support team at <a href=\"mailto:support@sixyardslove.com\" style=\"color:#6B3A1F;\">support@sixyardslove.com</a> — we're happy to help.</p>"
                + ctaButton("#6b7280", ordersLink, "View Order")
                + footer();

        send(toEmail, "Your return request for order #" + shortId + " could not be approved", html, "return rejected");
    }

    // ── 11. Admin alert (Shiprocket failures, etc.) ───────────────

    public void sendAdminAlert(String subject, String html) {
        send("support@sixyardslove.com", subject, html, "admin alert");
    }

    // ── helpers ───────────────────────────────────────────────────

    private String shortId(String orderId) {
        return orderId.replace("-", "").substring(0, 8).toUpperCase();
    }

    private void send(String toEmail, String subject, String html, String type) {
        try {
            CreateEmailOptions params = CreateEmailOptions.builder()
                    .from(fromEmail)
                    .to(toEmail)
                    .subject(subject)
                    .html(html)
                    .build();
            resend.emails().send(params);
            log.info("{} email sent to {}", type, toEmail);
        } catch (ResendException e) {
            log.error("Failed to send {} email to {}: {}", type, toEmail, e.getMessage());
        }
    }
}
