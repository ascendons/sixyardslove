/**
 * Returns the flat shipping fee based on cart subtotal.
 *   < ₹1000  → ₹150
 *   < ₹2000  → ₹100
 *   ≥ ₹2000  → free (₹0)
 */
export function getShippingFee(subtotal: number): number {
  if (subtotal < 1000) return 150;
  if (subtotal < 2000) return 100;
  return 0;
}

export function getShippingLabel(subtotal: number): string {
  return subtotal >= 2000 ? "Free Delivery" : "Standard Delivery";
}

const shippingService = { getShippingFee, getShippingLabel };
export default shippingService;
