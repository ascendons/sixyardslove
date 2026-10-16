package com.ascendons.order.service;

import com.ascendons.order.entity.Order;
import com.ascendons.order.entity.OrderItem;
import com.ascendons.order.entity.Payment;
import com.ascendons.order.repository.OrderRepository;
import com.ascendons.user.entity.UserAddress;
import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class InvoiceService {

    private final OrderRepository orderRepository;
    private final com.ascendons.coupon.repository.CouponRepository couponRepository;

    // ── Palette ──────────────────────────────────────────────────────────────
    private static final Color FOREST     = new Color(0x1B, 0x4D, 0x3E);
    private static final Color LIGHT_GRAY = new Color(0xF5, 0xF5, 0xF5);
    private static final Color MID_GRAY   = new Color(0xCC, 0xCC, 0xCC);
    private static final Color TEXT_MUTED = new Color(0x6B, 0x7B, 0x8D);
    private static final Color GREEN_600  = new Color(0x16, 0xA3, 0x4A);
    private static final Color WHITE      = Color.WHITE;

    // ── Fonts ────────────────────────────────────────────────────────────────
    private static final Font F_TITLE    = FontFactory.getFont(FontFactory.HELVETICA_BOLD,  20, FOREST);
    private static final Font F_SUBTITLE = FontFactory.getFont(FontFactory.HELVETICA,        8, TEXT_MUTED);
    private static final Font F_INVOICE  = FontFactory.getFont(FontFactory.HELVETICA_BOLD,  28, LIGHT_GRAY);
    private static final Font F_LABEL    = FontFactory.getFont(FontFactory.HELVETICA_BOLD,   7, TEXT_MUTED);
    private static final Font F_BODY     = FontFactory.getFont(FontFactory.HELVETICA,         9, Color.DARK_GRAY);
    private static final Font F_BOLD     = FontFactory.getFont(FontFactory.HELVETICA_BOLD,   9, Color.DARK_GRAY);
    private static final Font F_MONO     = FontFactory.getFont(FontFactory.COURIER,           8, TEXT_MUTED);
    private static final Font F_TH       = FontFactory.getFont(FontFactory.HELVETICA_BOLD,   7, WHITE);
    private static final Font F_TOTAL    = FontFactory.getFont(FontFactory.HELVETICA_BOLD,  11, FOREST);
    private static final Font F_FOOTER   = FontFactory.getFont(FontFactory.HELVETICA,         7, TEXT_MUTED);

    private static final DateTimeFormatter DATE_FMT =
            DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a");

    // ── Public entry points ──────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public byte[] generateForUser(UUID orderId, UUID userId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Order not found"));
        if (!order.getUser().getId().equals(userId))
            throw new AccessDeniedException("Access denied");
        return build(order);
    }

    @Transactional(readOnly = true)
    public byte[] generateForAdmin(UUID orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Order not found"));
        return build(order);
    }

    // ── PDF assembly ─────────────────────────────────────────────────────────

    private byte[] build(Order order) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document doc = new Document(PageSize.A4, 40, 40, 44, 40);
            PdfWriter.getInstance(doc, out);
            doc.open();

            header(doc, order);
            divider(doc);
            billToAndMeta(doc, order);
            itemsTable(doc, order);
            totalsAndGST(doc, order);
            paymentInfo(doc, order);
            footer(doc);

            doc.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate invoice", e);
        }
    }

    // ── Sections ─────────────────────────────────────────────────────────────

    private void header(Document doc, Order order) throws Exception {
        PdfPTable t = new PdfPTable(2);
        t.setWidthPercentage(100);
        t.setWidths(new float[]{1.3f, 1f});
        t.setSpacingAfter(8);

        PdfPCell left = noBorder();
        left.addElement(new Phrase("[SYL legal entity TBD]", F_TITLE));
        Paragraph sub = new Paragraph();
        sub.add(new Chunk("[SYL address TBD]", F_SUBTITLE));
        sub.add(Chunk.NEWLINE);
        sub.add(new Chunk("sixyardslove.com  ·  customer-support@sixyardslove.com  ·  +91 00000 00000", F_SUBTITLE));
        left.addElement(sub);
        t.addCell(left);

        PdfPCell right = noBorder();
        right.setHorizontalAlignment(Element.ALIGN_RIGHT);
        Paragraph invLabel = new Paragraph("INVOICE", F_INVOICE);
        invLabel.setAlignment(Element.ALIGN_RIGHT);
        right.addElement(invLabel);
        Paragraph invNum = new Paragraph(invoiceNumber(order), F_SUBTITLE);
        invNum.setAlignment(Element.ALIGN_RIGHT);
        right.addElement(invNum);
        if (order.getCreatedAt() != null) {
            Paragraph invDate = new Paragraph(order.getCreatedAt().format(DATE_FMT), F_SUBTITLE);
            invDate.setAlignment(Element.ALIGN_RIGHT);
            right.addElement(invDate);
        }
        t.addCell(right);
        doc.add(t);
    }

    private void divider(Document doc) throws Exception {
        PdfPTable t = new PdfPTable(1);
        t.setWidthPercentage(100);
        PdfPCell c = new PdfPCell();
        c.setBackgroundColor(MID_GRAY);
        c.setFixedHeight(1f);
        c.setBorder(Rectangle.NO_BORDER);
        t.addCell(c);
        t.setSpacingAfter(10);
        doc.add(t);
    }

    private void billToAndMeta(Document doc, Order order) throws Exception {
        PdfPTable t = new PdfPTable(2);
        t.setWidthPercentage(100);
        t.setSpacingAfter(14);

        PdfPCell left = noBorder();
        left.addElement(label("BILL TO"));
        UserAddress addr = order.getAddress();
        if (addr != null) {
            left.addElement(boldPara(customerName(order)));
            if (addr.getAddressLine1() != null) left.addElement(body(addr.getAddressLine1()));
            if (addr.getAddressLine2() != null && !addr.getAddressLine2().isBlank())
                left.addElement(body(addr.getAddressLine2()));
            String cs = cityStatePin(addr);
            if (!cs.isBlank()) left.addElement(body(cs));
            if (addr.getCountry() != null) left.addElement(body(addr.getCountry()));
        } else {
            left.addElement(body("Address not available"));
        }
        if (order.getUser().getEmail() != null) left.addElement(body(order.getUser().getEmail()));
        if (order.getUser().getPhone() != null) left.addElement(body(order.getUser().getPhone()));
        t.addCell(left);

        PdfPCell right = noBorder();
        right.setHorizontalAlignment(Element.ALIGN_RIGHT);
        right.addElement(labelRight("ORDER DETAILS"));
        right.addElement(metaRow("Status",   order.getStatus().name()));
        right.addElement(metaRow("Currency", order.getCurrency()));
        if (order.getIsBulk() != null && order.getIsBulk())
            right.addElement(metaRow("Type", "Bulk Order"));
        if (order.getCouponCode() != null)
            right.addElement(metaRow("Coupon", order.getCouponCode()));
        order.getPayments().stream()
                .filter(p -> p.getProviderPaymentId() != null)
                .findFirst()
                .ifPresent(p -> right.addElement(metaRow("Payment Ref", p.getProviderPaymentId())));
        t.addCell(right);
        doc.add(t);
    }

    private void itemsTable(Document doc, Order order) throws Exception {
        boolean useIgst = order.getItems().stream()
                .anyMatch(i -> gt0(i.getIgstAmount()));

        // 9 columns: # | Item | HSN | SKU | Qty | Unit Price | Tax Rate | CGST | SGST or IGST | Amount
        PdfPTable t = new PdfPTable(10);
        t.setWidthPercentage(100);
        t.setWidths(new float[]{0.4f, 2.2f, 0.9f, 1.3f, 0.5f, 1.1f, 0.8f, 0.8f, 0.8f, 1.1f});
        t.setSpacingAfter(10);
        t.setHeaderRows(1);

        th(t, "#");
        th(t, "ITEM");
        th(t, "HSN");
        th(t, "SKU");
        th(t, "QTY");
        th(t, "UNIT PRICE");
        th(t, "TAX RATE");
        th(t, "CGST");
        th(t, useIgst ? "IGST" : "SGST");
        th(t, "AMOUNT");

        int idx = 1;
        for (OrderItem item : order.getItems()) {
            // Price is tax-inclusive; derive taxable (pre-GST) values for GST invoice display
            BigDecimal itemTax = item.getTaxAmount() != null ? item.getTaxAmount() : BigDecimal.ZERO;
            BigDecimal inclusiveLineAmt = item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
            BigDecimal taxableLineAmt   = inclusiveLineAmt.subtract(itemTax);
            BigDecimal taxableUnitPrice = item.getQuantity() > 0
                    ? taxableLineAmt.divide(BigDecimal.valueOf(item.getQuantity()), 2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;

            td(t, String.valueOf(idx++), Element.ALIGN_CENTER, false);
            td(t, item.getProductVariant().getProduct().getName(), Element.ALIGN_LEFT, false);
            td(t, item.getProductVariant().getProduct().getHsn(), Element.ALIGN_CENTER, false);
            tdMono(t, item.getProductVariant().getSku());
            td(t, String.valueOf(item.getQuantity()), Element.ALIGN_CENTER, false);
            td(t, money(taxableUnitPrice, order.getCurrency()), Element.ALIGN_RIGHT, false);
            td(t, taxRateStr(item.getTaxRate()), Element.ALIGN_CENTER, false);
            td(t, money(item.getCgstAmount(), order.getCurrency()), Element.ALIGN_RIGHT, false);
            td(t, useIgst
                    ? money(item.getIgstAmount(), order.getCurrency())
                    : money(item.getSgstAmount(), order.getCurrency()),
                    Element.ALIGN_RIGHT, false);
            td(t, money(taxableLineAmt, order.getCurrency()), Element.ALIGN_RIGHT, true);
        }
        doc.add(t);
    }

    private void totalsAndGST(Document doc, Order order) throws Exception {
        PdfPTable outer = new PdfPTable(2);
        outer.setWidthPercentage(100);
        outer.setWidths(new float[]{1f, 1f});
        outer.setSpacingAfter(12);

        // Left – GST breakdown
        PdfPCell gstCell = noBorder();
        boolean hasCgst = gt0(order.getCgstAmount());
        boolean hasSgst = gt0(order.getSgstAmount());
        boolean hasIgst = gt0(order.getIgstAmount());
        boolean hasTax  = gt0(order.getTaxAmount());

        if (hasCgst || hasSgst || hasIgst || hasTax) {
            gstCell.addElement(label("GST BREAKDOWN"));
            PdfPTable gst = new PdfPTable(2);
            gst.setWidths(new float[]{1.8f, 1f});
            if (hasCgst) gstRow(gst, "Central GST (CGST)",    order.getCgstAmount(), order.getCurrency());
            if (hasSgst) gstRow(gst, "State GST (SGST)",      order.getSgstAmount(), order.getCurrency());
            if (hasIgst) gstRow(gst, "Integrated GST (IGST)", order.getIgstAmount(), order.getCurrency());
            if (hasTax) {
                // separator
                PdfPCell sep = new PdfPCell(new Phrase(" "));
                sep.setColspan(2); sep.setBorderWidthTop(0.5f); sep.setBorderColorTop(MID_GRAY);
                sep.setBorderWidthBottom(0); sep.setBorderWidthLeft(0); sep.setBorderWidthRight(0);
                sep.setFixedHeight(4f);
                gst.addCell(sep);
                gstRow(gst, "Total Tax", order.getTaxAmount(), order.getCurrency());
            }
            gstCell.addElement(gst);
        }
        outer.addCell(gstCell);

        // Right – order totals
        PdfPCell totalsCell = noBorder();
        totalsCell.addElement(labelRight("ORDER TOTALS"));

        BigDecimal subtotal = order.getItems().stream()
                .map(i -> i.getPrice().multiply(BigDecimal.valueOf(i.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Derive taxable (pre-GST) value — tax is inclusive in the stored prices
        BigDecimal orderTax = order.getTaxAmount() != null ? order.getTaxAmount() : BigDecimal.ZERO;
        BigDecimal taxableValue = subtotal.subtract(orderTax);

        PdfPTable tot = new PdfPTable(2);
        tot.setWidths(new float[]{2f, 1f});
        totRow(tot, "Taxable Value", money(taxableValue, order.getCurrency()), false, null);
        if (hasTax)
            totRow(tot, "GST", money(order.getTaxAmount(), order.getCurrency()), false, null);
        if (gt0(order.getShippingFee()))
            totRow(tot, "Shipping", money(order.getShippingFee(), order.getCurrency()), false, null);
        if (gt0(order.getCouponDiscount())) {
            String dLabel = order.getCouponCode() != null
                    ? "Discount (" + order.getCouponCode() + ")" : "Discount";
            totRow(tot, dLabel, "-" + money(order.getCouponDiscount(), order.getCurrency()), false, GREEN_600);
        }

        // grand total separator
        PdfPCell sep = new PdfPCell(new Phrase(" "));
        sep.setColspan(2);
        sep.setBorderWidthTop(1.5f); sep.setBorderColorTop(FOREST);
        sep.setBorderWidthBottom(0); sep.setBorderWidthLeft(0); sep.setBorderWidthRight(0);
        sep.setFixedHeight(5f);
        tot.addCell(sep);

        totRow(tot, "GRAND TOTAL", money(order.getTotalAmount(), order.getCurrency()), true, FOREST);

        totalsCell.addElement(tot);
        outer.addCell(totalsCell);
        doc.add(outer);

        if (gt0(order.getCouponDiscount()) && order.getCouponCode() != null) {
            couponRepository.findByCodeIgnoreCase(order.getCouponCode()).ifPresent(coupon -> {
                String desc = coupon.getDescription();
                String appliedTo = applicableProductNames(coupon, order.getItems());
                if ((desc == null || desc.isBlank()) && appliedTo.isBlank()) return;

                Paragraph note = new Paragraph();
                note.add(new Chunk(order.getCouponCode() + ": ", F_BOLD));
                if (desc != null && !desc.isBlank())
                    note.add(new Chunk(desc, F_BODY));
                if (!appliedTo.isBlank()) {
                    note.add(new Chunk("\n", F_BODY));
                    note.add(new Chunk("Applied to: ", F_BOLD));
                    note.add(new Chunk(appliedTo, F_BODY));
                }
                note.setSpacingAfter(10);
                try {
                    doc.add(note);
                } catch (Exception e) {
                    throw new RuntimeException(e);
                }
            });
        }
    }

    /** Names of the order's line-item products the coupon's rules (or BOGO SKUs) match — same matching logic as CouponService. */
    private String applicableProductNames(com.ascendons.coupon.entity.Coupon coupon, java.util.Collection<OrderItem> items) {
        java.util.List<com.ascendons.coupon.entity.CouponRule> rules = coupon.getRules();
        java.util.stream.Stream<OrderItem> matched;

        if (coupon.getDiscountType() == com.ascendons.coupon.entity.DiscountType.BOGO
                || coupon.getDiscountType() == com.ascendons.coupon.entity.DiscountType.SKU_BOGO) {
            String buySku = coupon.getBuySku();
            String getSku = (coupon.getGetSku() != null && !coupon.getGetSku().isBlank()) ? coupon.getGetSku() : buySku;
            matched = items.stream().filter(i -> i.getProductVariant() != null
                    && (i.getProductVariant().getSku().equals(buySku) || i.getProductVariant().getSku().equals(getSku)));
        } else if (rules == null || rules.isEmpty()) {
            matched = items.stream();
        } else {
            matched = items.stream().filter(item -> {
                var variant = item.getProductVariant();
                if (variant == null || variant.getProduct() == null) return false;
                UUID productId = variant.getProduct().getId();
                UUID categoryId = variant.getProduct().getCategory() != null ? variant.getProduct().getCategory().getId() : null;
                String sku = variant.getSku();
                for (com.ascendons.coupon.entity.CouponRule rule : rules) {
                    switch (rule.getRuleType()) {
                        case ALL -> { return true; }
                        case PRODUCT -> { if (productId != null && rule.getEntityId().equals(productId.toString())) return true; }
                        case CATEGORY -> { if (categoryId != null && rule.getEntityId().equals(categoryId.toString())) return true; }
                        case SKU -> {
                            if (variant.getId() != null && rule.getEntityId().equals(variant.getId().toString())) return true;
                            if (sku != null && rule.getEntityId().equals(sku)) return true;
                        }
                    }
                }
                return false;
            });
        }

        return matched
                .filter(i -> i.getProductVariant() != null && i.getProductVariant().getProduct() != null)
                .map(i -> i.getProductVariant().getProduct().getName())
                .distinct()
                .collect(java.util.stream.Collectors.joining(", "));
    }

    private void paymentInfo(Document doc, Order order) throws Exception {
        if (order.getPayments().isEmpty()) return;

        Payment p = order.getPayments().stream()
                .max(Comparator.comparing(Payment::getCreatedAt))
                .orElse(order.getPayments().iterator().next());

        PdfPTable t = new PdfPTable(1);
        t.setWidthPercentage(100);
        t.setSpacingAfter(10);

        PdfPCell cell = new PdfPCell();
        cell.setBackgroundColor(LIGHT_GRAY);
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setPadding(10);

        cell.addElement(label("PAYMENT DETAILS"));

        Paragraph info = new Paragraph();
        info.add(new Chunk("Status: ", F_BOLD));
        info.add(new Chunk(p.getStatus().name() + "   ", F_BODY));
        info.add(new Chunk("Provider: ", F_BOLD));
        info.add(new Chunk(p.getProvider().name() + "   ", F_BODY));
        info.add(new Chunk("Mode: ", F_BOLD));
        info.add(new Chunk(p.getPaymentMode().name() + "   ", F_BODY));
        if (p.getPaidAt() != null) {
            info.add(new Chunk("Paid At: ", F_BOLD));
            info.add(new Chunk(p.getPaidAt().format(DATE_FMT), F_BODY));
        }
        cell.addElement(info);

        if (p.getProviderPaymentId() != null) {
            Paragraph ref = new Paragraph();
            ref.add(new Chunk("Payment Reference: ", F_BOLD));
            ref.add(new Chunk(p.getProviderPaymentId(), F_MONO));
            cell.addElement(ref);
        }

        if (p.getFailureReason() != null) {
            Paragraph fail = new Paragraph();
            fail.add(new Chunk("Failure Reason: ", F_BOLD));
            fail.add(new Chunk(p.getFailureReason(),
                    FontFactory.getFont(FontFactory.HELVETICA, 9, new Color(0xDC, 0x26, 0x26))));
            cell.addElement(fail);
        }

        t.addCell(cell);
        doc.add(t);
    }

    private void footer(Document doc) throws Exception {
        divider(doc);
        Paragraph p = new Paragraph(
                "Thank you for shopping with Six Yards Love.  " +
                "For queries, contact customer-support@sixyardslove.com or call +91 00000 00000.  " +
                "This is a computer-generated invoice and does not require a signature.",
                F_FOOTER);
        p.setAlignment(Element.ALIGN_CENTER);
        doc.add(p);
    }

    // ── Table cell builders ──────────────────────────────────────────────────

    private void th(PdfPTable t, String text) {
        PdfPCell c = new PdfPCell(new Phrase(text, F_TH));
        c.setBackgroundColor(FOREST);
        c.setBorder(Rectangle.NO_BORDER);
        c.setPadding(5);
        t.addCell(c);
    }

    private void td(PdfPTable t, String text, int align, boolean bold) {
        PdfPCell c = new PdfPCell(new Phrase(text != null ? text : "—", bold ? F_BOLD : F_BODY));
        c.setBorderColor(LIGHT_GRAY);
        c.setBorderWidth(0.5f);
        c.setPadding(5);
        c.setHorizontalAlignment(align);
        t.addCell(c);
    }

    private void tdMono(PdfPTable t, String text) {
        PdfPCell c = new PdfPCell(new Phrase(text != null ? text : "—", F_MONO));
        c.setBorderColor(LIGHT_GRAY);
        c.setBorderWidth(0.5f);
        c.setPadding(5);
        t.addCell(c);
    }

    private void gstRow(PdfPTable t, String lbl, BigDecimal amount, String currency) {
        PdfPCell l = new PdfPCell(new Phrase(lbl, F_BODY));
        l.setBorder(Rectangle.NO_BORDER); l.setPaddingBottom(3);
        t.addCell(l);
        PdfPCell v = new PdfPCell(new Phrase(money(amount, currency), F_BODY));
        v.setBorder(Rectangle.NO_BORDER); v.setHorizontalAlignment(Element.ALIGN_RIGHT); v.setPaddingBottom(3);
        t.addCell(v);
    }

    private void totRow(PdfPTable t, String lbl, String val, boolean bold, Color color) {
        Font lf = bold ? F_TOTAL : (color != null ? FontFactory.getFont(FontFactory.HELVETICA, 9, color) : F_BODY);
        Font vf = bold ? F_TOTAL : (color != null ? FontFactory.getFont(FontFactory.HELVETICA, 9, color) : F_BODY);
        PdfPCell l = new PdfPCell(new Phrase(lbl, lf));
        l.setBorder(Rectangle.NO_BORDER); l.setHorizontalAlignment(Element.ALIGN_RIGHT); l.setPaddingBottom(3);
        t.addCell(l);
        PdfPCell v = new PdfPCell(new Phrase(val, vf));
        v.setBorder(Rectangle.NO_BORDER); v.setHorizontalAlignment(Element.ALIGN_RIGHT); v.setPaddingBottom(3);
        t.addCell(v);
    }

    // ── Paragraph helpers ────────────────────────────────────────────────────

    private PdfPCell noBorder() {
        PdfPCell c = new PdfPCell(); c.setBorder(Rectangle.NO_BORDER); return c;
    }

    private Paragraph label(String text) {
        Paragraph p = new Paragraph(text, F_LABEL); p.setSpacingAfter(3); return p;
    }

    private Paragraph labelRight(String text) {
        Paragraph p = new Paragraph(text, F_LABEL);
        p.setAlignment(Element.ALIGN_RIGHT); p.setSpacingAfter(3); return p;
    }

    private Paragraph boldPara(String text) {
        Paragraph p = new Paragraph(text, F_BOLD); p.setSpacingAfter(2); return p;
    }

    private Paragraph body(String text) {
        Paragraph p = new Paragraph(text, F_BODY); p.setSpacingAfter(1); return p;
    }

    private Paragraph metaRow(String lbl, String val) {
        Paragraph p = new Paragraph();
        p.setAlignment(Element.ALIGN_RIGHT);
        p.add(new Chunk(lbl + ": ", F_LABEL));
        p.add(new Chunk(val, F_BOLD));
        p.setSpacingAfter(2);
        return p;
    }

    // ── Utilities ────────────────────────────────────────────────────────────

    private String money(BigDecimal amount, String currency) {
        if (amount == null) return "—";
        String sym = "USD".equals(currency) ? "$" : "₹";
        return sym + amount.setScale(2, RoundingMode.HALF_UP).toPlainString();
    }

    private boolean gt0(BigDecimal v) {
        return v != null && v.compareTo(BigDecimal.ZERO) > 0;
    }

    /** Orders created before invoice_seq existed have no sequential number — fall back to the old UUID-derived one. */
    private String invoiceNumber(Order order) {
        return order.getInvoiceSeq() != null
                ? String.format("Six Yards Love/I-%06d", order.getInvoiceSeq())
                : "#" + order.getId().toString().substring(0, 8).toUpperCase();
    }

    private String taxRateStr(BigDecimal rate) {
        return rate != null ? rate.stripTrailingZeros().toPlainString() + "%" : "—";
    }

    private String customerName(Order order) {
        String first = order.getUser().getFirstName() != null ? order.getUser().getFirstName() : "";
        String last  = order.getUser().getLastName()  != null ? order.getUser().getLastName()  : "";
        return (first + " " + last).trim();
    }

    private String cityStatePin(UserAddress addr) {
        StringBuilder sb = new StringBuilder();
        if (addr.getCity()  != null) sb.append(addr.getCity());
        if (addr.getState() != null) { if (sb.length() > 0) sb.append(", "); sb.append(addr.getState()); }
        if (addr.getPostalCode() != null) sb.append(" – ").append(addr.getPostalCode());
        return sb.toString();
    }
}
