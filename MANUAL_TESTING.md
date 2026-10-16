# Manual Testing Guide — Six Yards Love E-Commerce Portal

## Setup

**Prerequisites**
- Backend running on `http://localhost:8081`
- Frontend running on `http://localhost:3000`
- A seeded database with at least one product, one category, and one product variant
- Two test accounts:
  - **USER** — `testuser@sixyardslove.com` / `password123`
  - **ADMIN** — `admin@sixyardslove.com` / `admin123`
- A valid FIXED coupon code (e.g. `FLAT50`) and a PERCENT coupon (e.g. `SAVE10`) in the DB
- At least one saved address for the test USER account

---

## 1. Authentication

### 1.1 Registration

| # | Steps | Expected |
|---|-------|----------|
| 1 | Go to `/`. Click the **Login / Sign In** button. Switch to Register tab. Fill in first name, last name, a **new unique email**, and a password. Click Register. | `POST /api/auth/register` returns 201. UI shows "verification email sent" message. |
| 2 | Repeat registration with the **same email** as an existing account. Click Register. | Returns 409. UI shows "already exists / taken" error. |
| 3 | Submit the registration form with **all fields empty**. | Client-side validation errors appear; no network request sent. |

### 1.2 Login

| # | Steps | Expected |
|---|-------|----------|
| 4 | Open the login modal. Enter valid USER credentials. Click Login. | `POST /api/auth/login` returns 200 with `accessToken`. `syl_auth_user` key appears in `localStorage` with `role: "user"`. |
| 5 | Log in with valid **ADMIN** credentials. | Same as above but `role` is `"admin"` or `"super_admin"`. Admin nav/dashboard link becomes visible. |
| 6 | Enter a valid email but **wrong password**. Click Login. | Returns 401. UI shows "invalid / incorrect credentials" error. |
| 7 | Enter an **unregistered email**. Click Login. | Returns 4xx. UI shows "not found / no account" error. |

### 1.3 Forgot / Reset Password

| # | Steps | Expected |
|---|-------|----------|
| 8 | Visit `/forgot-password`. Enter the USER's email. Click Send. | `POST /api/auth/forgot-password` returns 200/204. UI shows "check your inbox" message. A reset email is received at the address. |
| 9 | Repeat with a **completely unknown email** (e.g. `nobody@nowhere.com`). | Returns 200/204 (no user enumeration). No error message that reveals whether the account exists. |
| 10 | Follow the reset link in the email. Enter and confirm a new password. Submit. | Password is changed. Login with the new password succeeds. |

### 1.4 Route Protection

| # | Steps | Expected |
|---|-------|----------|
| 11 | While **logged out**, navigate directly to `/account`. | Redirected to `/` or `/?login=true`. |
| 12 | While **logged out**, navigate directly to `/cart`. | Redirected away from `/cart`. |
| 13 | While **logged out**, navigate directly to `/checkout`. | Redirected away from `/checkout`. |
| 14 | While **logged out**, navigate directly to `/admin/dashboard`. | Redirected away; no admin content visible. |
| 15 | Log in as **USER**, then navigate to `/admin/dashboard`. | Redirected away; USER cannot see the admin dashboard. |
| 16 | Log in as **ADMIN**, then navigate to `/admin/dashboard`. | Dashboard loads correctly; no 404 or blank screen. |

### 1.5 Logout

| # | Steps | Expected |
|---|-------|----------|
| 17 | Log in as USER. Go to `/account`. Click **Logout / Sign Out**. | `syl_auth_user` is removed from `localStorage`. User is redirected to home. All protected routes redirect again. |

---

## 2. Public Pages

### 2.1 Home Page (`/`)

| # | Steps | Expected |
|---|-------|----------|
| 18 | Visit `/`. | Hero / banner section is visible. `GET /api/products/featured` is called; featured product cards render. `GET /api/categories` is called; category grid renders. |
| 19 | Click any featured product card. | Navigates to `/product/:id`. |

### 2.2 Static / Marketing Pages

Visit each URL and confirm the page renders without a 404 or blank body:

| Route | Check |
|-------|-------|
| `/about` | Page renders |
| `/producers` | Page renders |
| `/shgs` | Page renders |
| `/customers` | Page renders |
| `/solutions` | Page renders |
| `/impact` | Page renders |
| `/quality` | Page renders |
| `/partner` | Page renders |

### 2.3 Policy Pages

| Route | Check |
|-------|-------|
| `/terms` or `/termsandconditions` | Terms content visible |
| `/privacy` | Privacy policy visible |
| `/shipping` | Shipping policy visible |
| `/returns` | Returns policy visible |
| `/refundspolicy` | Refund policy visible |

### 2.4 Contact Form (`/contact`)

| # | Steps | Expected |
|---|-------|----------|
| 20 | Visit `/contact`. Fill in name, email, and message. Click Send. | `POST /api/contact` returns 200/201. UI shows "thank you / received" message. |
| 21 | Click Send with **all fields empty**. | Client-side validation errors shown; no request sent. |

### 2.5 404 Page

| # | Steps | Expected |
|---|-------|----------|
| 22 | Visit `/this-route-definitely-does-not-exist`. | A "Not Found / 404" page is shown; app does not crash. |

---

## 3. Product Catalogue

### 3.1 Shop Listing (`/shop`)

| # | Steps | Expected |
|---|-------|----------|
| 23 | Visit `/shop`. | `GET /api/products` returns 200. At least one product card is rendered. |
| 24 | Type a keyword in the search box (e.g. `syl`). | `GET /api/products/search?query=syl` is called. Results filter to matching products. |
| 25 | Type a nonsense search term (e.g. `xxxxnotareal`). | Empty-state message ("No products found") is shown. |
| 26 | Click any product card. | Navigates to `/product/:id` for that product. |

### 3.2 Product Detail (`/product/:id`)

| # | Steps | Expected |
|---|-------|----------|
| 27 | Open any product. | `GET /api/products/:id` returns 200. Product name, at least one image, and price are visible. |
| 28 | Click a different **variant button** (size / weight). | Selected variant is highlighted. Price updates accordingly. |
| 29 | Scroll to the **Reviews** section. | `GET /api/reviews/product/:id` returns 200. Reviews (or "no reviews yet") are shown. |
| 30 | Check if **coupon chips / banners** are visible. | `GET /api/coupons/applicable` returns 200. Applicable coupons are displayed. |
| 31 | Log in as USER. Click **Add to Cart**. | `POST /api/cart/items` returns 200/201. Cart badge count increments. Toast confirmation shown. |
| 32 | Click the **Wishlist / Heart** icon. | `POST /api/wishlist/items` returns 200/201. Icon changes to filled/active state. |
| 33 | While logged in as USER, select a star rating and type a comment. Click **Submit Review**. | `POST /api/reviews` returns 200/201. New review appears in the list. |

### 3.3 Categories (`/categories`)

| # | Steps | Expected |
|---|-------|----------|
| 34 | Visit `/categories`. | `GET /api/categories` returns 200. Category cards are displayed. |
| 35 | Click a category card. | Navigates to `/categories/:id`. Category detail page shows products belonging to that category. |

---

## 4. Cart

> All tests require being logged in as USER.

| # | Steps | Expected |
|---|-------|----------|
| 36 | Visit `/cart` with an **empty cart**. | `GET /api/cart` returns 200. Empty-state message shown. |
| 37 | Add a product from `/shop`, then visit `/cart`. | Cart item is displayed with correct product name, variant, and price. |
| 38 | Click **+** (increase quantity). | `PUT /api/cart/items/:id` returns 200. Quantity and subtotal update. |
| 39 | Click **−** when quantity is **1**. | `DELETE /api/cart/items/:id` returns 200/204. Item is removed. Empty-state shown. |
| 40 | Add an item (qty ≥ 2). Click the **trash icon** for that item. | `DELETE /api/cart/items/:id` returns 200/204. Item removed from list. |
| 41 | Add items, then click **Clear Cart**. | `DELETE /api/cart` returns 200/204. All items removed; empty-state shown. |
| 42 | With items in cart, click **Proceed to Checkout**. | Navigates to `/checkout`. |

---

## 5. Checkout

> Requires USER login, at least one item in cart, and at least one saved address.

### 5.1 Address Selection

| # | Steps | Expected |
|---|-------|----------|
| 43 | Visit `/checkout`. | `GET /api/users/me/addresses` returns 200. Address cards are displayed. |
| 44 | Click an address card. | Card is visually highlighted (border, ring, or background change). |

### 5.2 Shipping Rate Selection

| # | Steps | Expected |
|---|-------|----------|
| 45 | Select an address. Wait a moment. | `GET /api/shiprocket/rates` is called with pickup and delivery postcodes. Courier options with prices are displayed. |
| 46 | Click a **different courier option**. | Selected courier is highlighted. Shipping fee in the order summary updates. |

### 5.3 Coupon Application

| # | Steps | Expected |
|---|-------|----------|
| 47 | Type a **valid coupon code** (e.g. `FLAT50`) in the coupon field. Click **Apply**. | `POST /api/coupons/validate` returns 200 with `valid: true`. Discount amount appears in order summary. Total decreases. |
| 48 | Type an **invalid / expired code** (e.g. `INVALIDCODE123`). Click **Apply**. | Returns 200 with `valid: false`. Error message shown (e.g. "Invalid coupon"). |
| 49 | Apply a valid coupon, then click the **× / remove** button next to it. | Discount line disappears. Total reverts to original amount. |

### 5.4 Razorpay Payment Flow

| # | Steps | Expected |
|---|-------|----------|
| 50 | Complete address + courier selection, then click **Pay / Place Order**. | `POST /api/orders` returns 200/201 with an `id`. `POST /api/payments/razorpay/create-order` returns 200/201 with `razorpayOrderId` and `amountInPaisa`. Razorpay payment modal opens. |
| 51 | In the Razorpay modal, use the **test card** (`4111 1111 1111 1111`, CVV `123`, future expiry). Complete payment. | `POST /api/payments/razorpay/verify` is called with valid signature. Order status changes to `CONFIRMED`. Redirected to order confirmation / success page. |
| 52 | Attempt payment with a **bad / tampered signature** (API call): send `POST /api/payments/razorpay/verify` with `razorpaySignature: "badsignature"`. | Returns 400. Order status remains `PENDING`. |
| 53 | Call `POST /api/payments/razorpay/create-order` **twice** for the same `orderId`. | Both calls return the **same** `razorpayOrderId` (idempotent). No duplicate payment record created. |

---

## 6. User Account

> All tests require USER login.

### 6.1 Profile (`/account/profile`)

| # | Steps | Expected |
|---|-------|----------|
| 54 | Visit `/account/profile`. | `GET /api/users/me` returns 200. First name, last name, email are pre-filled in the form. |
| 55 | Change the **First Name** field. Click **Save / Update**. | `PUT /api/users/me` returns 200 with updated `firstName`. The new name is reflected in the header/nav. |
| 56 | Open **Change Password**. Enter current password and new password (same value so login still works). Submit. | `POST /api/users/me/change-password` returns 200/204. Toast confirmation shown. |
| 57 | Open **Change Password**. Enter a **wrong current password**. Submit. | Returns 4xx. UI shows "wrong / incorrect password" error. |

### 6.2 Addresses (`/account/addresses`)

| # | Steps | Expected |
|---|-------|----------|
| 58 | Visit `/account/addresses`. | `GET /api/users/me/addresses` returns 200. Saved addresses listed (or empty state). |
| 59 | Click **Add Address**. Fill in address line, city, state, pincode. Select address type. Click **Save**. | `POST /api/users/me/addresses` returns 200/201. New address appears in the list. |
| 60 | Click **Delete** on a saved address. Confirm in the dialog. | `DELETE /api/users/me/addresses/:id` returns 200/204. Address is removed from the list. |

### 6.3 Order History (`/account/orders`)

| # | Steps | Expected |
|---|-------|----------|
| 61 | Visit `/account/orders`. | `GET /api/orders` returns 200. Order rows are displayed (or empty state if no orders). |
| 62 | Click an order row. | Navigates to `/account/orders/:id`. |

### 6.4 Order Detail (`/account/orders/:id`)

| # | Steps | Expected |
|---|-------|----------|
| 63 | Open an order detail page. | `GET /api/orders/:id/tracking` returns 200. Order items, amounts, and current status are displayed. Tracking timeline is visible. |

### 6.5 Wishlist (`/account/wishlist`)

| # | Steps | Expected |
|---|-------|----------|
| 64 | Visit `/account/wishlist`. | `GET /api/wishlist` returns 200. Wishlist items (or empty state) shown. |
| 65 | Click **Remove** on a wishlist item. | `DELETE /api/wishlist/items/:productId` returns 200/204. Item removed from the list. |

---

## 7. Admin Dashboard

> All tests require ADMIN or SUPER_ADMIN login and navigation to `/admin/dashboard`.

### 7.1 Analytics Tab

| # | Steps | Expected |
|---|-------|----------|
| 66 | Open the Admin Dashboard. | `GET /admin/analytics` returns 200 with `totalOrders`, `totalRevenue`, `totalProducts`, `totalCustomers`. Summary cards render with correct values. |
| 67 | Check the **Monthly Sales** chart. | Chart shows 6 months of data. Bars/lines render without errors. |
| 68 | Check the **Orders by Status** section. | All statuses shown: `PENDING`, `CONFIRMED`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`, `REFUNDED`. |

### 7.2 Products Tab

| # | Steps | Expected |
|---|-------|----------|
| 69 | Click the **Products** tab. | `GET /admin/products` returns 200. Product rows render in the table. |
| 70 | Type in the **search field**. | Table filters to matching products in real time. |
| 71 | Click **Add Product**. Fill in product name and select a category. Click Save. | `POST /admin/products` returns 200/201. New product appears in the list. |
| 72 | Click **Delete** on a product. Confirm the dialog. | `DELETE /admin/products/:id` returns 200/204. Product is removed from the table. |
| 73 | Click the **Featured toggle** for a product. | `PATCH /admin/products/:id/featured` returns 200/204. Featured badge updates. |

### 7.3 Categories Tab

| # | Steps | Expected |
|---|-------|----------|
| 74 | Click the **Categories** tab. | `GET /admin/categories` returns 200. Category rows shown. |
| 75 | Click **Add Category**. Enter a name. Click Save. | `POST /admin/categories` returns 200/201. New category appears in the list. |
| 76 | Click **Edit** on a category. Change the name. Save. | `PUT /admin/categories/:id` returns 200. Updated name shown. |
| 77 | Click **Delete** on a category. Confirm. | `DELETE /admin/categories/:id` returns 200/204. Category removed. |

### 7.4 Orders Tab

| # | Steps | Expected |
|---|-------|----------|
| 78 | Click the **Orders** tab. | `GET /admin/orders` returns 200 with paginated `content`. Order rows with status badges shown. |
| 79 | Click an order row. | `GET /admin/orders/:id` returns 200. Order detail panel/modal opens with line items. |
| 80 | Change the **status dropdown** for an order (e.g. from `PENDING` to `CONFIRMED`). | `PATCH /admin/orders/:id/status` returns 200. Status badge updates in the table. |

### 7.5 Payments Tab

| # | Steps | Expected |
|---|-------|----------|
| 81 | Click the **Payments** tab. | `GET /admin/payments` returns 200. Payment rows shown with provider IDs and amounts. |
| 82 | Apply the **status filter** (e.g. select `CAPTURED`). | `GET /admin/payments?status=CAPTURED` is called. Table updates to show only CAPTURED payments. |

### 7.6 Inventory Tab

| # | Steps | Expected |
|---|-------|----------|
| 83 | Click the **Inventory** tab. | `GET /admin/inventory` returns 200 with paginated `content`. SKU rows with stock counts and status labels (`In Stock`, `Low Stock`, `Out of Stock`) shown. |
| 84 | Click **Adjust Stock** for a variant. Enter a quantity (e.g. `5`) and a reason. Click Save. | `POST /admin/inventory/adjust` returns 200/204. Quantity updates in the table. |
| 85 | Click **Movements / History** for a variant. | `GET /admin/inventory/:id/movements` returns 200. Movement log entries shown with date, quantity, and reason. |
| 86 | Click **Sync Inventory**. | `POST /admin/inventory/sync` returns 200/204. Toast confirmation shown. |

### 7.7 Coupons Tab

| # | Steps | Expected |
|---|-------|----------|
| 87 | Click the **Coupons** tab. | `GET /admin/coupons/all` returns 200 with an array. Coupon rows shown. |
| 88 | Create a **FIXED** coupon: click Create, enter code `FIXED<timestamp>`, description, type=FIXED, value=50, min cart=100, max=50. Save. | `POST /admin/coupons/create` returns 200/201 with `discountType: "FIXED"`. Coupon appears in list. |
| 89 | Create a **PERCENT** coupon: code `PCT<timestamp>`, type=PERCENT, value=10, min=200, max=100. Save. | Returns 200/201 with `discountType: "PERCENT"`. |
| 90 | Create a **BOGO** coupon: code `BOGO<timestamp>`, type=BOGO, buy=2, get=1. Save. | Returns 200/201 with `discountType: "BOGO"`. |
| 91 | Click **Delete** on any coupon. Confirm. | `DELETE /admin/coupons/delete/:id` returns 200/204. Coupon removed from list. |

**Coupon Validation — API tests (run with Postman / curl):**

| # | Request | Expected |
|---|---------|----------|
| 92 | `POST /api/coupons/validate?code=FLAT50` with a cart item body (as USER). | `valid: true`, `discountAmount > 0`. |
| 93 | `POST /api/coupons/validate?code=EXPIREDCODE` with any cart body. | `valid: false`. |
| 94 | `POST /api/orders` as USER with `isBulk: true` + a `couponCode`. | Returns 400 — bulk orders cannot use coupons. |

### 7.8 Shipping Tab (Shiprocket)

| # | Steps | Expected |
|---|-------|----------|
| 95 | Click the **Shipping** tab. Enter pickup postcode `110001` and delivery `400001`. Click **Check Rates / Calculate**. | `GET /admin/shiprocket/rates` returns 200. Courier options with prices shown. |
| 96 | Enter a real AWB code and click **Track**. | `GET /admin/shiprocket/track/:awb` returns 200 (or 404 for unknown AWB). Tracking events shown. |
| 97 | Click **Pickup Addresses**. | `GET /admin/shiprocket/pickup-addresses` returns 200. Configured pickup locations shown. |

### 7.9 Featured Sections Tab

| # | Steps | Expected |
|---|-------|----------|
| 98 | Click the **Featured** tab. | `GET /admin/features/sections` returns 200. Sections listed (or empty state). |
| 99 | Click **Create Section**. Enter a title and slug. Click Save. | `POST /admin/features/sections` returns 200/201. New section appears. |
| 100 | Click **Delete** on a section. Confirm. | `DELETE /admin/features/sections/:id` returns 200/204. Section removed. |

### 7.10 Returns & Refunds Tab

| # | Steps | Expected |
|---|-------|----------|
| 101 | Click the **Returns / Refunds** tab. | `GET /admin/refunds` returns 200 with an array. Cancelled/refunded orders are listed. |
| 102 | Locate a row that has `refunded: true`. | The **Process Refund** button is **disabled** (already refunded). |
| 103 | Locate a cancelled order with a **captured payment** (`paymentId` present). Click **Process Refund**. Confirm the dialog. | `POST /admin/refunds/:orderId/process` returns 200/201 with `razorpayRefundId` and `refundAmount > 0`. Order status updates to `REFUNDED`. |
| 104 | Try to process the **same refund a second time**. | Returns 400 or 409. UI shows an error — double-refund prevented. |
| 105 | Check that a COD order (no `paymentId`) shows **"No payment"** instead of a Process button. | Confirm this is the intended UX. |

### 7.11 Customers Tab

| # | Steps | Expected |
|---|-------|----------|
| 106 | Click the **Customers** tab. | `GET /admin/customers` returns 200. Customer rows shown with name, email, and status. |
| 107 | Click a customer row. | Customer detail view opens with order history. |
| 108 | Toggle a customer's **Active / Inactive** status. | `PATCH /admin/customers/:id/status` returns 200. Status badge updates. |

### 7.12 Sellers Tab

| # | Steps | Expected |
|---|-------|----------|
| 109 | Click the **Sellers** tab. | `GET /admin/sellers` returns 200. Seller records shown. |
| 110 | Click **Add Seller**. Fill in required fields. Save. | `POST /admin/sellers` returns 200/201. New seller appears. |
| 111 | Edit and delete a seller. | PUT/DELETE return 200/204. Changes reflected immediately. |

### 7.13 Media Tab

| # | Steps | Expected |
|---|-------|----------|
| 112 | Click the **Media** tab. Click **Upload**. Select an image file. | `POST /api/media/presign` returns a presigned S3 URL. File is uploaded via PUT. Uploaded asset appears in the media library. |

---

## 8. Email Triggers

These must be verified end-to-end in **staging** with a real email account. Check the inbox after each action.

| # | Trigger | Email Expected |
|---|---------|---------------|
| 113 | Register a new account. | **Verification email** with a confirmation link. |
| 114 | Request a password reset. | **Password reset email** with a reset link. |
| 115 | Complete a Razorpay payment (test sandbox). | **Order Confirmation email** with order ID, items, total. |
| 116 | Admin pushes an order to Shiprocket and it gets shipped (Shiprocket sends webhook with `status: "Shipped"`). | **Order Shipped email** with AWB / carrier details. |
| 117 | Shiprocket webhook fires with `status: "Delivered"`. | **Order Delivered email**. |
| 118 | Order is cancelled (via admin status update or Shiprocket webhook). | **Order Cancelled email**. |
| 119 | Admin processes a refund via the Returns tab. | **Refund Processed email** with refund amount. |

---

## 9. Webhook Integrations

### 9.1 Razorpay Webhook

| # | Steps | Expected |
|---|-------|----------|
| 120 | Send `POST /api/webhooks/razorpay` with a **valid** `payment.captured` payload and a **correct** HMAC signature (using the configured `RZP_WEBHOOK_SECRET`). | Returns 200. Order status updated to `CONFIRMED`. Inventory decremented. Order confirmation email sent. |
| 121 | Send the same endpoint with a **wrong / missing** signature. | Returns 400. Event ignored. |
| 122 | Send with event type `payment.failed`. | Returns 200. Order status updated to `CANCELLED`. Inventory **restored** to pre-order level. |

### 9.2 Shiprocket Webhook

| # | Steps | Expected |
|---|-------|----------|
| 123 | Send `POST /api/webhooks/fulfillment` **without** the `X-Shiprocket-Hmac-Sha256` header (when `SHIPROCKET_WEBHOOK_SECRET` is configured in prod). | Returns 401. |
| 124 | Send with a **bad HMAC** value. | Returns 401. |
| 125 | Send a valid payload with a **split-order ID** format (`SYL-<uuid>-1`) for an unknown order. | Returns 200 (graceful no-op — service logs and skips unknown order IDs without throwing 500). |
| 126 | Send a valid payload with `current_status: "Delivered"` for a known order's Shiprocket ID. | Returns 200. Order status updates to `DELIVERED`. Delivered email sent to customer. |

---

## 10. Security Edge Cases

| # | Steps | Expected |
|---|-------|----------|
| 127 | Make `GET /admin/orders` with a **USER JWT** (not admin). | Returns 401 or 403. |
| 128 | Make `GET /api/orders` with an **expired or garbage JWT** (e.g. `Bearer this.is.fake`). | Returns 401. |
| 129 | `POST /api/cart/items` with `quantity: 999999` for a variant that has less than that in stock. | Returns 400 or 409 (insufficient stock). No cart item added. |
| 130 | Access `/admin/dashboard` as a USER via direct URL. | Redirected away. Admin content never rendered in the DOM. |

---

## 11. Buy Now (Direct Checkout)

| # | Steps | Expected |
|---|-------|----------|
| 131 | On any product detail page, click **Buy Now** (if available). | `BuyNowDialog` opens with address selection and payment button, bypassing the cart. |
| 132 | Select an address and complete payment. | `POST /api/orders/buy-now` creates a single-item order. Razorpay flow proceeds as in §5.4. |

---

## 12. Preferred Courier (End-to-End)

| # | Steps | Expected |
|---|-------|----------|
| 133 | At checkout, load shipping options. Select a **specific courier** (not the default/first). Complete payment. | The order in the DB has `preferred_courier_id` set to the selected courier's ID. |
| 134 | Admin views the order and pushes it to Shiprocket. | Shiprocket's `assignawb` is called with the **user-selected** `courier_id`, not the auto-selected one. Check backend logs: `autoFulfillShipment: using user-selected courier_id=...` |

---

## 13. Concurrency

| # | Steps | Expected |
|---|-------|----------|
| 135 | **Double-click Add to Cart** rapidly on the same product variant before the first request returns. | Only one cart item is created (or quantity incremented once). No duplicate line items. |
| 136 | Open the same product in two browser tabs as the same USER. Add to cart in both tabs simultaneously. | Cart shows one item with quantity 2 (or two items), not a corrupted/doubled entry. No 500 errors. |
| 137 | At checkout, click **Pay / Place Order** twice in quick succession (e.g. double-click). | Only one Razorpay order is created. Second call returns the same `razorpayOrderId` (idempotent). Only one order record in the DB. |
| 138 | While an **Add to Cart** request is in flight, click the same button again. | UI button is disabled / shows spinner during the in-flight request. Second click is a no-op. |
| 139 | Two admin users update the **same order's status** at the same moment (simulate with two Postman tabs). | Both return 200, but the final status is one of the two values — no corrupted/null state. |
| 140 | Place an order for a product that has **1 unit in stock**. While payment verification is in flight, attempt a second purchase of the same variant (different browser session). | The second buyer receives a stock-exhausted error (400/409) after the first payment is confirmed; inventory does not go negative. |

---

## 14. Failure Scenarios

| # | Steps | Expected |
|---|-------|----------|
| 141 | **Kill the backend** mid-checkout (stop the Spring Boot process after `POST /api/orders` succeeds but before Razorpay modal opens). Restart the backend. Reload the page. | No orphaned `PENDING` order is visible to the user. The order either completes (if payment was processed before death) or is cleaned up. No 500 errors on reload. |
| 142 | Simulate a **Razorpay timeout**: send `POST /api/payments/razorpay/create-order` with a valid `orderId`, then close the Razorpay modal without paying. Re-open checkout for the same order. | The existing Razorpay order ID is reused (idempotent). A new `razorpayOrderId` is NOT created. |
| 143 | Force a **Shiprocket 500** response (temporarily point `SHIPROCKET_BASE_URL` at a mock server that returns 500). Place and confirm an order. | Order is saved with status `CONFIRMED`. Shiprocket failure is logged. No exception propagates to the user. The order does not disappear. |
| 144 | Disconnect the network **after** clicking Pay but **before** Razorpay's success callback fires. Reconnect and return to the order history page. | Order shows `PENDING` (or `CONFIRMED` if the Razorpay webhook arrived). No duplicate charges. Razorpay webhook will eventually confirm or the order stays pending for manual review. |
| 145 | Trigger a **Resend / email failure** (remove the `RESEND_API_KEY` env var, restart backend). Complete a payment. | Order is still confirmed and saved. Email failure is logged. The user sees the order confirmation page (email delivery is best-effort, not blocking). |
| 146 | Send a **malformed JSON payload** to `POST /api/webhooks/fulfillment`. | Returns 200 (Shiprocket must not be allowed to retry indefinitely). Backend logs the parse error. No order state is changed. |
| 147 | Send a **malformed JSON payload** to `POST /api/webhooks/razorpay`. | Returns 500 (Razorpay should retry). Backend logs the error. |
| 148 | Submit the **Add Address** form with a **network error** (DevTools → Network → Offline). | UI shows a "something went wrong / check your connection" message. No blank screen or JS crash. |

---

## 15. Performance

These are subjective checks — note any sluggishness and investigate if a page takes more than 3 s on a local network.

| # | Steps | Expected |
|---|-------|----------|
| 149 | Open `/shop` with **50+ products** in the DB. | First meaningful paint within 3 s. Product cards load progressively (skeleton or spinner shown while loading). |
| 150 | Open the Admin **Inventory** tab with **200+ SKUs**. Use the pagination arrows to navigate between pages. | Each page loads within 2 s. No full-page spinner between pages — table updates in place. |
| 151 | Open the Admin **Orders** tab. Scroll through **100+ orders**. | Table renders without freezing the browser tab. |
| 152 | Open the Admin **Analytics** tab. | `GET /admin/analytics` returns within 2 s. Monthly sales chart renders within 1 s of data arriving. |
| 153 | Open a **product detail page** with 5 images. | All images load without layout shift. Lazy-loading defers off-screen images. |
| 154 | Open DevTools → **Network** tab (throttle to Fast 3G). Complete an add-to-cart action. | Cart badge updates within 5 s on simulated 3G. No JS error due to timeout. |
| 155 | Open DevTools → **Performance** panel. Record a 10-second clip of browsing `/shop → /product/:id → /cart`. | No long tasks (> 50 ms) caused by React re-renders. Heap does not continuously grow (no major memory leak). |

---

## 16. SEO

| # | Check | Expected |
|---|-------|----------|
| 156 | View page source of `/`. | `<title>` tag is present and not empty. `<meta name="description">` is present. |
| 157 | View page source of `/product/:id` for any product. | `<title>` contains the product name. `<meta name="description">` contains product description. |
| 158 | Check Open Graph tags on `/product/:id` (use `curl -s <url> \| grep og:`). | `og:title`, `og:description`, and `og:image` are all present and non-empty. |
| 159 | Visit `/sitemap.xml` or `/sitemap_index.xml`. | Returns 200 with a valid XML sitemap listing public routes (`/`, `/shop`, category and product URLs). |
| 160 | Visit `/robots.txt`. | Returns 200. `Disallow:` rules block `/admin/` and `/api/`. `Allow: /` covers public routes. |
| 161 | Check canonical `<link>` tags on `/shop?query=syl` (filtered URL). | `<link rel="canonical">` points to `/shop` (or the canonical form), preventing duplicate-content indexing of query-string variants. |
| 162 | Inspect the product detail page HTML for **structured data**. | A `<script type="application/ld+json">` block with `@type: "Product"` is present, containing `name`, `image`, `offers.price`, and `offers.priceCurrency`. |
| 163 | Open **Chrome Lighthouse** (DevTools → Lighthouse). Run an SEO audit on `/` and `/product/:id`. | SEO score ≥ 90. No "missing meta description", "links are not crawlable", or "page is blocked from indexing" issues. |

---

## 17. Mobile

All checks should be performed at **375 × 812 px** (iPhone SE / 14) viewport. Use DevTools device emulation or a real device.

| # | Steps | Expected |
|---|-------|----------|
| 164 | Open `/` on mobile. | Hero, featured products, and category grid are visible without horizontal scroll. Text is legible (no overflow). |
| 165 | Open `/shop`. | Product cards stack in 2 columns (or 1). Cards are tappable — no tiny hit targets. |
| 166 | Open a product detail page. Swipe through product images. | Image gallery swipe works with touch. Variant buttons are at least 44 × 44 px. "Add to Cart" button spans full width and is easily tappable. |
| 167 | Open `/cart`. | Line items, quantity controls (+/−), and the Checkout button are all fully visible without horizontal overflow. |
| 168 | Complete the full **checkout flow on mobile**: add item → cart → checkout → select address → select courier → apply coupon → pay. | Each step renders correctly. Razorpay modal opens and is usable (no elements clipped off-screen). |
| 169 | Open `/admin/dashboard` on mobile. | Hamburger menu (☰) is visible. Tapping it opens the sidebar. Sidebar closes when a tab is selected. |
| 170 | Browse the Admin **Products** table on mobile. | Table is horizontally scrollable (or columns collapse). No content is permanently hidden behind other elements. |
| 171 | Open any modal (e.g. Add Address, Product dialog) on mobile. | Modal is scrollable if content overflows the viewport. The close / cancel button is reachable without zooming. |
| 172 | Open `/account/orders` on mobile. | Order rows are readable. Tap an order — order detail view opens correctly. |
| 173 | Open the login modal on mobile. | Form fields and the Login button are fully visible. Soft keyboard does not cover the Submit button (test on a real device or Chrome mobile emulation with virtual keyboard enabled). |

---

## Notes

- **Razorpay test cards**: `4111 1111 1111 1111` (Visa), CVV any 3 digits, expiry any future date.
- **Shiprocket webhook HMAC**: compute `HMAC-SHA256(requestBody, SHIPROCKET_WEBHOOK_SECRET)` and send as `X-Shiprocket-Hmac-Sha256` header.
- **Razorpay webhook HMAC**: compute `HMAC-SHA256(requestBody, RZP_WEBHOOK_SECRET)` and send as `X-Razorpay-Signature` header.
- All admin API tests can be run with Postman/curl using an ADMIN JWT obtained from `POST /api/auth/login`.
- Before a production deploy, all items marked **staging** above must pass.
