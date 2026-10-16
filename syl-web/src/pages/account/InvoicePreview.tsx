import { useEffect, useState } from "react";
import { OrderResponse, OrderItem } from "@/services/orderService";
import couponService, { CouponResponse } from "@/services/couponService";
import logo from "@/assets/logo.png";
import authSignatory from "@/assets/auth-signatory.png";

/** Names of the order's line-item products the coupon's rules (or BOGO SKUs) match — mirrors CouponService's matching logic. */
function applicableProductNames(coupon: CouponResponse, items: OrderItem[]): string {
  let matched: OrderItem[];

  if (coupon.discountType === "BOGO" || coupon.discountType === "SKU_BOGO") {
    const buySku = coupon.buySku;
    const getSku = coupon.getSku && coupon.getSku.trim() ? coupon.getSku : buySku;
    matched = items.filter((i) => i.sku && (i.sku === buySku || i.sku === getSku));
  } else if (!coupon.rules || coupon.rules.length === 0) {
    matched = items;
  } else {
    matched = items.filter((item) =>
      coupon.rules!.some((rule) => {
        if (rule.ruleType === "ALL") return true;
        if (rule.ruleType === "PRODUCT") return !!item.productId && rule.entityId === item.productId;
        if (rule.ruleType === "CATEGORY") return !!item.categoryId && rule.entityId === item.categoryId;
        if (rule.ruleType === "SKU") return rule.entityId === item.productVariantId || rule.entityId === item.sku;
        return false;
      }),
    );
  }

  return Array.from(new Set(matched.map((i) => i.productName).filter(Boolean))).join(", ");
}

const sym = (currency?: string) => (currency === "USD" ? "$" : "₹");

const fmt = (amount?: number | null, currency?: string) =>
  `${sym(currency)}${(amount ?? 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const gt0 = (v?: number | null) => v != null && v > 0;

const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function numToWords(n: number): string {
  if (n === 0) return "Zero";
  if (n < 0) return "Minus " + numToWords(-n);
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? " " + ONES[n % 10] : "");
  if (n < 1000) return ONES[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + numToWords(n % 100) : "");
  if (n < 100000) return numToWords(Math.floor(n / 1000)) + " Thousand" + (n % 1000 ? " " + numToWords(n % 1000) : "");
  if (n < 10000000) return numToWords(Math.floor(n / 100000)) + " Lakh" + (n % 100000 ? " " + numToWords(n % 100000) : "");
  return numToWords(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 ? " " + numToWords(n % 10000000) : "");
}

function amountInWords(amount: number): string {
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);
  let words = numToWords(rupees) + " Rupees";
  if (paise > 0) words += " and " + numToWords(paise) + " Paise";
  words += " Only";
  return words;
}

const BRAND = "#a21d20";
const BRAND_LIGHT = "#fff1f1";
const BRAND_BORDER = "#fecaca";
const FONT_BODY = "'Inter', sans-serif";
const FONT_HEADING = "'Playfair Display', serif";

export const InvoicePreview: React.FC<{ order: OrderResponse }> = ({ order }) => {
  const currency = order.currency;

  const [coupon, setCoupon] = useState<CouponResponse | null>(null);
  useEffect(() => {
    if (!order.couponCode) {
      setCoupon(null);
      return;
    }
    let cancelled = false;
    couponService
      .getByCode(order.couponCode)
      .then((c) => {
        if (!cancelled) setCoupon(c);
      })
      .catch(() => {
        if (!cancelled) setCoupon(null);
      });
    return () => {
      cancelled = true;
    };
  }, [order.couponCode]);

  const couponDescription = coupon?.description || null;
  const couponAppliedTo = coupon ? applicableProductNames(coupon, order.items) : "";

  // Derived from the line items themselves (not backed out of the order total) so the
  // summary always reconciles with what the table above actually shows, even if the
  // order's own aggregate GST fields have drifted from their per-line GST amounts.
  // item.price * quantity is already the pre-tax "Amount" shown per line (GST is added
  // on top to reach Line Total) — so the subtotal is that sum as-is, not net of GST again.
  // item.price is tax-inclusive (same convention the table rows use to derive their own
  // "Amount" column: lineTotal - gstAmt) — so the subtotal must net out each item's GST too,
  // not just sum the inclusive line totals.
  const itemsCgst = order.items.reduce((sum, item) => sum + (item.cgstAmount ?? 0), 0);
  const itemsSgst = order.items.reduce((sum, item) => sum + (item.sgstAmount ?? 0), 0);
  const itemsIgst = order.items.reduce((sum, item) => sum + (item.igstAmount ?? 0), 0);
  const itemsSubtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    - itemsCgst - itemsSgst - itemsIgst;

  const shippingGstRate = 18;
  const shippingBase = (order.shippingFee ?? 0) / (1 + shippingGstRate / 100);
  const shippingGstAmount = (order.shippingFee ?? 0) - shippingBase;
  const hasShipping = gt0(order.shippingFee);

  // Same CGST/SGST vs IGST split the products use (intra-state vs inter-state) applies to
  // the shipping line too — it's just another taxable line item now, not a separate calc.
  const useIgst = itemsCgst === 0 && itemsSgst === 0;
  const shippingCgst = hasShipping && !useIgst ? shippingGstAmount / 2 : 0;
  const shippingSgst = hasShipping && !useIgst ? shippingGstAmount - shippingCgst : 0;
  const shippingIgst = hasShipping && useIgst ? shippingGstAmount : 0;

  const subtotal = itemsSubtotal + (hasShipping ? shippingBase : 0);
  const totalCgst = itemsCgst + shippingCgst;
  const totalSgst = itemsSgst + shippingSgst;
  const totalIgst = itemsIgst + shippingIgst;

  // Match the exact amount captured by the payment gateway — no rounding,
  // since this is a digital settlement, not cash.
  const grandTotal = order.totalAmount ?? 0;

  const formatAddr = (addr?: typeof order.address) => {
    if (!addr) return null;
    const parts = [
      addr.addressLine1,
      addr.addressLine2,
      [addr.city, addr.state].filter(Boolean).join(", "),
      addr.pincode ?? addr.postalCode,
      addr.country,
    ].filter(Boolean);
    return parts.join(", ");
  };

  const billingAddr = formatAddr(order.address);

  return (
    <div className="bg-white min-w-[700px]" style={{ fontFamily: FONT_BODY, fontSize: 11, color: "#1a1a1a" }}>
      {/* Google Fonts */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');`}</style>

      {/* ── Header ── */}
      <div style={{ background: BRAND, padding: "28px 36px", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
          {/* Logo in white circle */}
          <div style={{ width: 110, height: 110, borderRadius: "50%", background: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>
            <img src={logo} alt="Six Yards Love" style={{ maxWidth: 72, maxHeight: 72, width: "auto", height: "auto", display: "block" }} />
          </div>
          <div>
            <div style={{ fontFamily: FONT_HEADING, fontSize: 22, fontWeight: 700, color: "#ffffff", letterSpacing: "0.5px", lineHeight: 1.2 }}>
              Six Yards Love
            </div>
            <div style={{ fontSize: 10, color: "#fee2e2", marginTop: 10, lineHeight: 1.7, maxWidth: 280 }}>
              [SYL address TBD]
            </div>
            <div style={{ display: "flex", gap: 20, marginTop: 8 }}>
              <span style={{ fontSize: 10, color: "#fecaca" }}><span style={{ fontWeight: 600 }}>GSTIN:</span> GSTIN_TBD</span>
              <span style={{ fontSize: 10, color: "#fecaca" }}><span style={{ fontWeight: 600 }}>CIN:</span> CIN_TBD</span>
            </div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: FONT_HEADING, fontSize: 28, fontWeight: 700, color: "#ffffff", letterSpacing: "1px" }}>
            Tax Invoice
          </div>
          <div style={{ marginTop: 14, padding: "10px 14px", background: "rgba(255,255,255,0.12)", borderRadius: 6, display: "inline-flex", gap: 24, textAlign: "right" }}>
            <div>
              <div style={{ fontSize: 10, color: "#fecaca", marginBottom: 4, fontWeight: 600 }}>Invoice No</div>
              <div style={{ fontSize: 13, color: "#ffffff", fontWeight: 600, letterSpacing: "0.5px" }}>
                {order.invoiceNumber ?? order.orderNumber ?? order.id.slice(0, 8).toUpperCase()}
              </div>
            </div>
            <div style={{ borderLeft: "1px solid rgba(255,255,255,0.2)", paddingLeft: 24 }}>
              <div style={{ fontSize: 10, color: "#fecaca", marginBottom: 4, fontWeight: 600 }}>Date</div>
              <div style={{ fontSize: 13, color: "#ffffff", fontWeight: 600 }}>
                {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Accent bar ── */}
      <div style={{ height: 4, background: `linear-gradient(90deg, ${BRAND}, #e05252, ${BRAND})` }} />

      {/* ── Bill To / Ship To ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", background: BRAND_LIGHT, borderBottom: `1px solid ${BRAND_BORDER}` }}>
        <div style={{ padding: "18px 28px", borderRight: `1px solid ${BRAND_BORDER}` }}>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "2px", color: BRAND, marginBottom: 8, borderLeft: `3px solid ${BRAND}`, paddingLeft: 7 }}>
            Bill To
          </div>
          <div style={{ fontWeight: 600, fontSize: 13, color: "#111827" }}>{order.customerName ?? "—"}</div>
          <div style={{ color: "#6b7280", marginTop: 4, lineHeight: 1.6, fontSize: 11 }}>{billingAddr ?? "—"}</div>
          <div style={{ marginTop: 6, color: "#6b7280", fontSize: 11 }}><span style={{ fontWeight: 500, color: "#374151" }}>GSTIN:</span> —</div>
        </div>
        <div style={{ padding: "18px 28px" }}>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "2px", color: BRAND, marginBottom: 8, borderLeft: `3px solid ${BRAND}`, paddingLeft: 7 }}>
            Ship To
          </div>
          <div style={{ fontWeight: 600, fontSize: 13, color: "#111827" }}>{order.customerName ?? "—"}</div>
          <div style={{ color: "#6b7280", marginTop: 4, lineHeight: 1.6, fontSize: 11 }}>{billingAddr ?? "—"}</div>
        </div>
      </div>

      {/* ── Items Table ── */}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: BRAND }}>
            {(["Sl No", "Product Description", "HSN/SAC", "Qty", "UOM", "Rate", "Amount", "GST %", "GST Amount", "Line Total"] as const).map((h, i, arr) => (
              <th key={h} style={{
                padding: "10px 8px",
                fontFamily: FONT_BODY,
                fontWeight: 600,
                fontSize: 10,
                color: "#ffffff",
                textAlign: i === 1 ? "left" : i >= 5 ? "right" : "center",
                letterSpacing: "0.3px",
                borderRight: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.15)" : "none",
              }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {order.items.map((item: OrderItem, i: number) => {
            const lineTotal = item.price * item.quantity;
            const gstAmt = (item.cgstAmount ?? 0) + (item.sgstAmount ?? 0) + (item.igstAmount ?? 0);
            const taxableAmt = lineTotal - gstAmt;
            const rate = item.quantity ? taxableAmt / item.quantity : 0;
            return (
              <tr key={item.id ?? i} style={{ background: i % 2 === 0 ? "#ffffff" : BRAND_LIGHT, borderBottom: `1px solid ${BRAND_BORDER}` }}>
                <td style={{ padding: "11px 8px", textAlign: "center", color: "#9ca3af", borderRight: `1px solid ${BRAND_BORDER}` }}>{i + 1}</td>
                <td style={{ padding: "11px 8px", fontWeight: 500, color: "#111827", borderRight: `1px solid ${BRAND_BORDER}` }}>{item.productName || "Product"}</td>
                <td style={{ padding: "11px 8px", textAlign: "center", color: "#9ca3af", borderRight: `1px solid ${BRAND_BORDER}` }}>{item.hsn || "—"}</td>
                <td style={{ padding: "11px 8px", textAlign: "center", borderRight: `1px solid ${BRAND_BORDER}` }}>{item.quantity}</td>
                <td style={{ padding: "11px 8px", textAlign: "center", color: "#6b7280", borderRight: `1px solid ${BRAND_BORDER}` }}>Pcs</td>
                <td style={{ padding: "11px 8px", textAlign: "right", borderRight: `1px solid ${BRAND_BORDER}` }}>{fmt(rate, currency)}</td>
                <td style={{ padding: "11px 8px", textAlign: "right", borderRight: `1px solid ${BRAND_BORDER}` }}>{fmt(taxableAmt, currency)}</td>
                <td style={{ padding: "11px 8px", textAlign: "center", borderRight: `1px solid ${BRAND_BORDER}` }}>{item.taxRate != null ? `${item.taxRate}%` : "—"}</td>
                <td style={{ padding: "11px 8px", textAlign: "right", color: "#6b7280", borderRight: `1px solid ${BRAND_BORDER}` }}>{fmt(gstAmt, currency)}</td>
                <td style={{ padding: "11px 8px", textAlign: "right", fontWeight: 600, color: BRAND }}>{fmt(lineTotal, currency)}</td>
              </tr>
            );
          })}
          {hasShipping && (
            <tr style={{ background: order.items.length % 2 === 0 ? "#ffffff" : BRAND_LIGHT, borderBottom: `1px solid ${BRAND_BORDER}` }}>
              <td style={{ padding: "11px 8px", textAlign: "center", color: "#9ca3af", borderRight: `1px solid ${BRAND_BORDER}` }}>{order.items.length + 1}</td>
              <td style={{ padding: "11px 8px", fontWeight: 500, color: "#111827", borderRight: `1px solid ${BRAND_BORDER}` }}>Shipping Charges</td>
              <td style={{ padding: "11px 8px", textAlign: "center", color: "#9ca3af", borderRight: `1px solid ${BRAND_BORDER}` }}>996511</td>
              <td style={{ padding: "11px 8px", textAlign: "center", borderRight: `1px solid ${BRAND_BORDER}` }}>1</td>
              <td style={{ padding: "11px 8px", textAlign: "center", color: "#6b7280", borderRight: `1px solid ${BRAND_BORDER}` }}>—</td>
              <td style={{ padding: "11px 8px", textAlign: "right", borderRight: `1px solid ${BRAND_BORDER}` }}>{fmt(shippingBase, currency)}</td>
              <td style={{ padding: "11px 8px", textAlign: "right", borderRight: `1px solid ${BRAND_BORDER}` }}>{fmt(shippingBase, currency)}</td>
              <td style={{ padding: "11px 8px", textAlign: "center", borderRight: `1px solid ${BRAND_BORDER}` }}>{shippingGstRate}%</td>
              <td style={{ padding: "11px 8px", textAlign: "right", color: "#6b7280", borderRight: `1px solid ${BRAND_BORDER}` }}>{fmt(shippingGstAmount, currency)}</td>
              <td style={{ padding: "11px 8px", textAlign: "right", fontWeight: 600, color: BRAND }}>{fmt(order.shippingFee, currency)}</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* ── Totals + Signatory ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderTop: `2px solid ${BRAND}` }}>
        {/* Left: amount in words */}
        <div style={{ padding: "20px 28px", background: BRAND_LIGHT, borderRight: `1px solid ${BRAND_BORDER}`, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "2px", color: BRAND, marginBottom: 8, borderLeft: `3px solid ${BRAND}`, paddingLeft: 7 }}>
              Amount in Words
            </div>
            <div style={{ color: "#374151", lineHeight: 1.7, fontWeight: 500, fontSize: 11 }}>
              {amountInWords(grandTotal)}
            </div>
          </div>
          <div style={{ marginTop: 24, fontSize: 9, color: "#9ca3af", fontStyle: "italic" }}>
            This is a computer-generated invoice.
          </div>
        </div>

        {/* Right: summary */}
        <div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
            <tbody>
              {[
                { label: "Tax Type", value: "Inclusive" },
                { label: "Subtotal", value: fmt(subtotal, currency) },
                { label: "CGST", value: fmt(totalCgst, currency) },
                { label: "SGST", value: fmt(totalSgst, currency) },
                { label: "IGST", value: fmt(totalIgst, currency) },
                { label: `Discount${order.couponCode ? ` (${order.couponCode})` : ""}`, value: gt0(order.couponDiscount) ? `-${fmt(order.couponDiscount, currency)}` : fmt(0, currency) },
              ].map(({ label, value }) => (
                <tr key={label} style={{ borderBottom: `1px solid ${BRAND_BORDER}` }}>
                  <td style={{ padding: "7px 16px", color: "#6b7280", borderRight: `1px solid ${BRAND_BORDER}` }}>{label}</td>
                  <td style={{ padding: "7px 16px", textAlign: "right", fontWeight: 500, color: "#111827" }}>{value}</td>
                </tr>
              ))}
              <tr style={{ background: BRAND }}>
                <td style={{ padding: "12px 16px", fontFamily: FONT_HEADING, fontWeight: 700, fontSize: 13, color: "#ffffff" }}>Grand Total</td>
                <td style={{ padding: "12px 16px", textAlign: "right", fontFamily: FONT_HEADING, fontWeight: 700, fontSize: 14, color: "#ffffff" }}>{fmt(grandTotal, currency)}</td>
              </tr>
            </tbody>
          </table>

          {order.couponCode && (couponDescription || couponAppliedTo) && (
            <div style={{ padding: "8px 16px", background: BRAND_LIGHT, borderTop: `1px solid ${BRAND_BORDER}`, fontSize: 10, color: "#6b7280" }}>
              {couponDescription && (
                <div>
                  <span style={{ fontWeight: 600, color: "#374151" }}>{order.couponCode}:</span> {couponDescription}
                </div>
              )}
              {couponAppliedTo && (
                <div>
                  <span style={{ fontWeight: 600, color: "#374151" }}>Applied to:</span> {couponAppliedTo}
                </div>
              )}
            </div>
          )}

          {/* Signatory */}
          <div style={{ padding: "16px 20px", textAlign: "right", background: BRAND_LIGHT }}>
            <img src={authSignatory} alt="Authorized Signatory" style={{ width: 180, marginLeft: "auto", display: "block" }} />
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={{ background: BRAND, padding: "10px 36px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 9, color: "#fecaca", letterSpacing: "1px" }}>GSTIN: GSTIN_TBD</div>
        <div style={{ fontSize: 9, color: "#fee2e2" }}>Thank you for your order!</div>
        <div style={{ fontSize: 9, color: "#fecaca", letterSpacing: "1px" }}>CIN: CIN_TBD</div>
      </div>
    </div>
  );
};
