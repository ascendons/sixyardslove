# Shiprocket Dimensions & Weight Support

## Current State

| Layer | Status |
|---|---|
| Rate check (`/api/shipping/rates`) | Only sends `weight`. Dimensions (`length`, `breadth`, `height`) not sent to Shiprocket. |
| Order creation | Dimensions sent but hardcoded to config defaults (`10x10x10cm`, `0.5kg`) regardless of actual product. |
| Product model | No weight/dimension fields on `Product` entity. |

## TODO

- [ ] **Product entity** — Add `weightKg`, `lengthCm`, `breadthCm`, `heightCm` fields + DB migration.
- [ ] **Backend rate API** — `ShippingRatesController` + `ShiprocketService.getShippingRates()` — accept and forward dimension params alongside `weight`.
- [ ] **Order creation** — Pull actual dimensions from order's products instead of config defaults (`ShiprocketService.java:147-150`). Decide multi-item strategy (sum weights, bounding box for dims).
- [ ] **Frontend checkout** — Pass product dimensions when calling the rate endpoint so quoted price is accurate.
- [ ] **Admin UI** — Add weight and dimension fields to the product form.

## Open Question

How to handle **multi-item orders**: sum weights (straightforward), but dimensions need a decision — largest item's box, or a bounding box across all items?
