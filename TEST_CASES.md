# Six Yards Love E-Commerce — Feature Test Cases
> Format: each feature group maps directly to a Cypress `describe` block.
> Each bullet under it is an `it(...)` test case.
> Preconditions and test data hints are noted inline.

---

## Conventions

- **BASE_URL** = `http://localhost:5173` (Vite dev server)
- **API_URL** = `http://localhost:8080`
- **USER_EMAIL / USER_PASS** = a seeded regular user account
- **ADMIN_EMAIL / ADMIN_PASS** = a seeded admin/super_admin account
- Cypress commands assume `cy.login()` is a custom command that POSTs to `/api/auth/login` and sets `localStorage.syl_auth_user`.

---

## 1. Authentication

### 1.1 Registration

```
describe('Registration', () => {
```

- **it** registers a new user with valid first name, last name, email, password → shows "verification email sent" message
- **it** blocks registration with a duplicate email → shows error
- **it** blocks registration when password is too short (< 8 chars) → shows validation error
- **it** blocks registration when email format is invalid → shows validation error
- **it** blocks registration when required fields are blank → shows validation errors

### 1.2 Email Verification

```
describe('Email Verification', () => {
```

- **it** verifies email with a valid token in query param → logs in automatically, redirects to home
- **it** shows an error page when token is missing or invalid

### 1.3 Login

```
describe('Login', () => {
```

- **it** logs in a USER with correct credentials → stores JWT in localStorage, redirects to home
- **it** logs in an ADMIN with correct credentials → stores JWT with role `admin`
- **it** shows an error with wrong password
- **it** shows an error with unregistered email
- **it** redirects to login (via `?login=true`) when an unauthenticated user visits a protected route

### 1.4 Forgot / Reset Password

```
describe('Password Reset', () => {
```

- **it** sends forgot-password email for a known email → shows "check your inbox" message
- **it** silently succeeds for an unknown email (no user enumeration)
- **it** resets password with a valid token and a new password → can log in with new password
- **it** rejects reset with an expired/invalid token → shows error

### 1.5 Logout

```
describe('Logout', () => {
```

- **it** clears localStorage on logout → subsequent visit to `/account` redirects to `/?login=true`

---

## 2. Route Protection

```
describe('Route Protection', () => {
```

- **it** redirects unauthenticated user from `/account` to `/?login=true`
- **it** redirects unauthenticated user from `/cart` to `/?login=true`
- **it** redirects unauthenticated user from `/checkout` to `/?login=true`
- **it** redirects unauthenticated user from `/admin/dashboard` to `/?login=true`
- **it** redirects a logged-in USER from `/admin/dashboard` to `/` (403 guard)
- **it** allows a logged-in ADMIN to access `/admin/dashboard`
- **it** allows a logged-in USER to access `/account`

---

## 3. Public Pages

### 3.1 Home Page (`/`)

```
describe('Home Page', () => {
```

- **it** renders the hero section
- **it** shows the featured products section (calls `GET /api/products/featured`)
- **it** clicking a featured product navigates to `/product/:id`
- **it** shows the category grid (calls `GET /api/categories`)
- **it** clicking a category navigates to `/categories/:categoryId`

### 3.2 Static / Marketing Pages

```
describe('Static Pages', () => {
```

- **it** `/about` renders without error
- **it** `/producers` renders without error
- **it** `/shgs` renders without error
- **it** `/customers` renders without error
- **it** `/solutions` renders without error
- **it** `/impact` renders without error
- **it** `/quality` renders without error
- **it** `/partner` renders without error

### 3.3 Policy Pages

```
describe('Policy Pages', () => {
```

- **it** `/terms` and `/termsandconditions` both render the Terms page
- **it** `/privacy` renders the Privacy Policy page
- **it** `/shipping` renders the Shipping Policy page
- **it** `/returns` renders the Returns page
- **it** `/refundspolicy` renders the Refunds page
- **it** `/policy` renders the General Policy page

### 3.4 Contact Form (`/contact`)

```
describe('Contact Form', () => {
```

- **it** submits the contact form with name, email, message → shows success toast (calls `POST /api/contact`)
- **it** shows validation errors when required fields are empty
- **it** shows an error when backend is unreachable (network error handling)

### 3.5 404 Page

```
describe('404 Page', () => {
```

- **it** visiting an unknown route renders the NotFound page

---

## 4. Product Catalogue

### 4.1 Shop (`/shop`)

```
describe('Shop - Product Listing', () => {
```

- **it** loads and displays all products (calls `GET /api/products`)
- **it** search input filters products by name (calls `GET /api/products/search?query=...`)
- **it** shows an empty state when search returns no results
- **it** clicking a product card navigates to `/product/:id`

### 4.2 Product Detail (`/product/:id`)

```
describe('Product Detail', () => {
```

- **it** loads product details (name, images, description, variants) from `GET /api/products/:id`
- **it** selecting a variant updates the displayed price and SKU
- **it** shows stock status (In Stock / Out of Stock) based on variant
- **it** shows product reviews (calls `GET /api/reviews/product/:id`)
- **it** authenticated USER can submit a review (rating + comment) → review appears in list
- **it** unauthenticated user sees the review form but is redirected to login on submit
- **it** shows applicable coupons for the product (calls `GET /api/coupons/applicable`)
- **it** clicking "Add to Cart" adds the selected variant → toast confirmation (calls `POST /api/cart/items`)
- **it** clicking "Add to Wishlist" adds product to wishlist (calls `POST /api/wishlist/items`)
- **it** shows an error toast when adding an out-of-stock variant to cart

### 4.3 Bulk Shop (`/bulk-shop`) and Bulk Product (`/bulk-product/:id`)

```
describe('Bulk Shop', () => {
```

- **it** loads bulk product listing
- **it** bulk product detail shows MOQ and bulk order price
- **it** places a bulk order without applying coupons (coupon is blocked on bulk orders)

### 4.4 Categories (`/categories` and `/categories/:id`)

```
describe('Categories', () => {
```

- **it** `/categories` lists all categories with images
- **it** clicking a category navigates to `/categories/:categoryId`
- **it** category detail page shows all products in that category

---

## 5. Cart (USER)

```
describe('Cart', () => {
```

> Precondition: logged in as USER

- **it** `GET /cart` loads cart items from `GET /api/cart`
- **it** empty cart shows empty state message
- **it** quantity increment calls `PUT /api/cart/items/:id` and updates displayed total
- **it** quantity decrement to 0 removes the item from the cart
- **it** clicking the trash icon removes item via `DELETE /api/cart/items/:id`
- **it** "Clear Cart" button removes all items via `DELETE /api/cart`
- **it** cart total updates correctly when quantity changes
- **it** "Proceed to Checkout" button navigates to `/checkout`

---

## 6. Checkout (USER)

```
describe('Checkout', () => {
```

> Precondition: logged in as USER, cart has at least one item

### 6.1 Address Selection

- **it** lists the user's saved addresses (calls `GET /api/users/me/addresses`)
- **it** selecting an address highlights it and enables the payment flow
- **it** shows an empty state if no addresses are saved, prompts to add one first

### 6.2 Shipping Rate Selection

- **it** after address selection, fetches shipping options (`GET /api/shiprocket/rates`)
- **it** displays courier name, rate, and estimated delivery date for each option
- **it** selecting a different courier updates the displayed shipping fee and grand total

### 6.3 Coupon Application

- **it** entering a valid coupon code and clicking "Apply" calls `POST /api/coupons/validate`
- **it** valid coupon shows the discount amount and updated total
- **it** invalid / expired coupon code shows an error message below the input
- **it** clicking "×" on an applied coupon removes the discount, reverts to original total
- **it** a BOGO coupon applies the correct free-item discount
- **it** a PERCENT coupon caps at `maxDiscount` when the discount would exceed it
- **it** a coupon is blocked on bulk orders

### 6.4 Payment via Razorpay

- **it** clicking "Pay" creates an internal order (`POST /api/orders`) and a Razorpay order (`POST /api/payments/initiate`)
- **it** the Razorpay checkout modal opens with the correct amount (in paisa)
- **it** on payment success, `POST /api/payments/verify` is called with signature, payment ID, order ID
- **it** successful payment redirects to order confirmation / order detail page
- **it** cancelling the Razorpay modal returns user to checkout without creating a duplicate order on retry
- **it** on payment failure (Razorpay returns error), shows a failure message

---

## 7. User Account (USER)

### 7.1 Account Dashboard (`/account`)

```
describe('User Account Dashboard', () => {
```

- **it** shows links to Profile, Orders, Addresses, Wishlist

### 7.2 Profile (`/account/profile`)

```
describe('Profile', () => {
```

- **it** loads current profile from `GET /api/users/me`
- **it** updates first name, last name, phone → `PUT /api/users/me` → shows success toast
- **it** changes password with correct old password → `POST /api/users/me/change-password` → success
- **it** change password with wrong old password → shows error message

### 7.3 Addresses (`/account/addresses`)

```
describe('Addresses', () => {
```

- **it** lists saved addresses (calls `GET /api/users/me/addresses`)
- **it** "Add Address" form saves a new address via `POST /api/users/me/addresses`
- **it** new address appears in the list immediately
- **it** "Edit" opens the address form prefilled; saving calls `PUT /api/users/me/addresses/:id`
- **it** "Delete" removes the address via `DELETE /api/users/me/addresses/:id` and removes from list
- **it** validation: required fields (line1, city, state, pincode) enforced before submit

### 7.4 Order History (`/account/orders`)

```
describe('Order History', () => {
```

- **it** lists all orders for the current user (calls `GET /api/orders`)
- **it** shows order status badge (PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED)
- **it** clicking an order navigates to `/account/orders/:id`

### 7.5 Order Detail (`/account/orders/:id`)

```
describe('Order Detail', () => {
```

- **it** shows order items, quantities, prices, shipping address, and payment method
- **it** shows shipment tracking info when AWB exists (calls `GET /api/orders/:id/tracking`)
- **it** tracking timeline renders activities when Shiprocket returns tracking data
- **it** shows "Tracking pending" state when AWB is not yet assigned

### 7.6 Wishlist (`/account/wishlist`)

```
describe('Wishlist', () => {
```

- **it** lists all wishlist items (calls `GET /api/wishlist`)
- **it** "Remove" button removes item via `DELETE /api/wishlist/items/:productId`
- **it** clicking a wishlist item navigates to the product detail page
- **it** empty state is shown when wishlist is empty

---

## 8. Admin Dashboard (ADMIN / SUPER_ADMIN)

> Precondition: logged in as ADMIN for all cases in this section

### 8.1 Analytics Tab

```
describe('Admin - Analytics', () => {
```

- **it** loads summary cards: Total Orders, Total Revenue, Total Products, Total Customers (calls `GET /admin/analytics`)
- **it** revenue chart renders with monthly data (last 6 months)
- **it** orders-by-status breakdown renders as badges

### 8.2 Products Tab

```
describe('Admin - Products', () => {
```

- **it** lists all products (calls `GET /admin/products`)
- **it** search box filters the table
- **it** "Add Product" form submits `POST /admin/products` with name, category, variants, images
- **it** "Edit" button opens the product form prefilled with existing data
- **it** saving edit calls `PUT /admin/products/:id`
- **it** "Delete" button shows confirmation dialog; confirming calls `DELETE /admin/products/:id` and removes from table
- **it** "Toggle Featured" calls `PATCH /admin/products/:id/featured` and updates the featured badge
- **it** product form validates required fields (name, category) before submit

### 8.3 Categories Tab

```
describe('Admin - Categories', () => {
```

- **it** lists categories (calls `GET /admin/categories`)
- **it** "Add Category" submits `POST /admin/categories`
- **it** "Edit" saves via `PUT /admin/categories/:id`
- **it** "Delete" calls `DELETE /admin/categories/:id`

### 8.4 Orders Tab

```
describe('Admin - Orders', () => {
```

- **it** lists paginated orders (calls `GET /admin/orders`)
- **it** clicking an order row shows order detail (items, amounts, customer info)
- **it** "Update Status" dropdown updates via `PATCH /admin/orders/:id/status`
- **it** status change to SHIPPED reflects immediately in the table

### 8.5 Customers Tab

```
describe('Admin - Customers', () => {
```

- **it** lists all customers (calls `GET /admin/customers` or equivalent)
- **it** clicking a customer shows their profile detail
- **it** admin can toggle customer active/inactive status

### 8.6 Sellers Tab

```
describe('Admin - Sellers', () => {
```

- **it** lists sellers
- **it** admin can create a new seller record
- **it** admin can edit and delete a seller

### 8.7 Inventory Tab

```
describe('Admin - Inventory', () => {
```

- **it** lists inventory items with SKU, product name, quantity, status (calls `GET /admin/inventory`)
- **it** "Adjust Stock" dialog submits `POST /admin/inventory/adjust` with changeQty and reason
- **it** stock quantity updates in the table after adjustment
- **it** "View Movements" opens the movement history for a variant (calls `GET /admin/inventory/:id/movements`)
- **it** "Sync Inventory" button calls `POST /admin/inventory/sync`

### 8.8 Coupons Tab

```
describe('Admin - Coupons', () => {
```

- **it** lists all coupons (calls `GET /admin/coupons/all`)
- **it** creates a FIXED discount coupon → `POST /admin/coupons/create` → appears in list
- **it** creates a PERCENT discount coupon with maxDiscount cap
- **it** creates a BOGO coupon (buy X get Y free) with buyQty / getQty
- **it** creates a SKU_BOGO coupon with buySku / getSku
- **it** edit coupon opens prefilled form; save calls `PUT /admin/coupons/update/:id`
- **it** delete coupon calls `DELETE /admin/coupons/delete/:id`
- **it** deactivating a coupon (isActive = false) prevents it from being applied at checkout

### 8.9 Payments Tab

```
describe('Admin - Payments', () => {
```

- **it** lists payments with status filter (CREATED, CAPTURED, FAILED, REFUNDED)
- **it** filter by status calls `GET /admin/payments?status=...`
- **it** clicking a payment shows detail (provider, amount, method, paidAt)
- **it** "Update Payment Status" calls `PATCH /admin/payments/:id/status`

### 8.10 Shipping Tab

```
describe('Admin - Shipping (Shiprocket)', () => {
```

- **it** "Rate Calculator" fetches available couriers (`GET /admin/shiprocket/rates`)
- **it** rate table shows courier name, rate, ETD, zones
- **it** "Track Shipment" by AWB calls `GET /admin/shiprocket/track/:awb`
- **it** "Ship" action assigns a courier (calls `POST /admin/shiprocket/ship`)
- **it** "Schedule Pickup" calls `POST /admin/shiprocket/schedule-pickup`
- **it** "Generate Label" calls `GET /admin/shiprocket/label`
- **it** "Cancel Shipment" calls `POST /admin/shiprocket/cancel`
- **it** "Pickup Addresses" lists Shiprocket pickup locations

### 8.11 Featured Sections Tab

```
describe('Admin - Featured Sections', () => {
```

- **it** lists all featured sections (calls `GET /admin/features/sections`)
- **it** "Create Section" dialog submits `POST /admin/features/sections` → appears in list
- **it** "Edit Section" updates title/slug via `PUT /admin/features/sections/:id`
- **it** "Delete Section" calls `DELETE /admin/features/sections/:id`
- **it** clicking a section shows its assigned products
- **it** "Add Product to Section" dialog filters product list and calls `POST /admin/features/products`
- **it** "Remove Product from Section" calls `DELETE /admin/features/products/:id`

### 8.12 Media Tab

```
describe('Admin - Media', () => {
```

- **it** lists uploaded media (calls appropriate admin media endpoint)
- **it** "Upload" file picker requests presigned URL and uploads to S3
- **it** uploaded image URL appears in the media grid

### 8.13 Returns Tab

```
describe('Admin - Returns & Refunds', () => {
```

- **it** lists cancelled and refunded orders with customer name and amount (calls `GET /admin/refunds`)
- **it** "Process Refund" button is enabled only for CANCELLED orders with a captured payment
- **it** clicking "Process Refund" confirms via dialog; confirms calls `POST /admin/refunds/:orderId/process`
- **it** after refund, order status changes to REFUNDED and button becomes disabled
- **it** refunded amount is displayed correctly in the row
- **it** "Process Refund" shows error toast when no captured payment exists for the order

### 8.14 Messages Tab

```
describe('Admin - Contact Messages', () => {
```

- **it** lists contact form submissions
- **it** clicking a message marks it as read
- **it** delete removes the message from the list

---

## 9. Integrations

### 9.1 Razorpay

```
describe('Razorpay Integration', () => {
```

- **it** `POST /api/payments/initiate` returns `keyId`, `razorpayOrderId`, `amountInPaisa`
- **it** calling initiate again for the same unpaid order returns the existing Razorpay order (idempotent)
- **it** `POST /api/payments/verify` with correct HMAC signature captures the payment
- **it** `POST /api/payments/verify` with tampered signature returns 400
- **it** webhook `payment.captured` event marks payment CAPTURED and triggers Shiprocket push
- **it** webhook `payment.failed` event marks payment FAILED, restores inventory, cancels order
- **it** webhook `order.paid` is idempotent — does not double-capture an already CAPTURED payment
- **it** webhook with wrong `X-Razorpay-Signature` is rejected with 400
- **it** payment mode stored on payment record matches actual method (card/upi/netbanking/wallet)

### 9.2 Shiprocket

```
describe('Shiprocket Integration', () => {
```

- **it** after payment capture, a Shiprocket order is created automatically
- **it** duplicate Shiprocket push is idempotent (guard skips if shipment already exists)
- **it** user-selected courier ID at checkout is used for AWB assignment (not Shiprocket's default)
- **it** split orders (items from multiple pickup locations) generate separate Shiprocket order IDs (`SYL-<uuid>-1`, `-2`)
- **it** webhook with status `SHIPPED` updates shipment status and sends shipped email
- **it** webhook with status `DELIVERED` updates shipment status and sends delivered email
- **it** webhook with status `CANCELLED` / `RTO` restores inventory and sends cancelled email
- **it** webhook with invalid HMAC header returns 401
- **it** split-order webhook payload (`SYL-<uuid>-1`) resolves to the correct internal order

### 9.3 Transactional Email

```
describe('Transactional Email (Resend)', () => {
```

- **it** order confirmation email is sent when payment is captured (check Resend dashboard / mock)
- **it** order shipped email is sent when Shiprocket webhook reports SHIPPED status
- **it** order delivered email is sent when Shiprocket webhook reports DELIVERED status
- **it** order cancelled email is sent when payment fails
- **it** refund processed email is sent when admin processes a refund
- **it** email failures do not break the underlying business operation (payment still captures, etc.)

---

## 10. Edge Cases & Security

```
describe('Security & Edge Cases', () => {
```

- **it** USER cannot access `/admin/dashboard` even with a valid JWT
- **it** expired JWT results in 401, user is redirected to login
- **it** inventory is decremented on order placement and restored on payment failure
- **it** placing an order for a quantity exceeding available stock returns 400
- **it** coupon cannot be used more than its `usageLimit` across all users
- **it** coupon cannot be used more than its `userLimit` by the same user
- **it** Razorpay refund for an already-refunded order returns an error (no double refund)
- **it** admin cannot process a refund when no captured payment exists
- **it** bulk orders cannot use discount coupons

---

## Appendix — Cypress Custom Commands to Implement

```ts
// cypress/support/commands.ts

Cypress.Commands.add('login', (email: string, password: string) => {
  cy.request('POST', '/api/auth/login', { email, password }).then(({ body }) => {
    localStorage.setItem('syl_auth_user', JSON.stringify({
      username: email,
      role: body.role.toLowerCase(),
      token: body.accessToken,
    }));
  });
});

Cypress.Commands.add('loginAsAdmin', () => {
  cy.login(Cypress.env('ADMIN_EMAIL'), Cypress.env('ADMIN_PASS'));
});

Cypress.Commands.add('loginAsUser', () => {
  cy.login(Cypress.env('USER_EMAIL'), Cypress.env('USER_PASS'));
});

Cypress.Commands.add('addToCart', (productVariantId: string, quantity = 1) => {
  cy.request({
    method: 'POST',
    url: '/api/cart/items',
    headers: { Authorization: `Bearer ${JSON.parse(localStorage.getItem('syl_auth_user')!).token}` },
    body: { productVariantId, quantity },
  });
});

Cypress.Commands.add('clearCart', () => {
  cy.request({ method: 'DELETE', url: '/api/cart', ... });
});
```

---

## Appendix — Suggested `cypress.env.json`

```json
{
  "BASE_URL": "http://localhost:5173",
  "API_URL": "http://localhost:8080",
  "ADMIN_EMAIL": "admin@sixyardslove.com",
  "ADMIN_PASS": "admin_password_here",
  "USER_EMAIL": "testuser@sixyardslove.com",
  "USER_PASS": "user_password_here",
  "TEST_PRODUCT_ID": "<uuid of a seeded product>",
  "TEST_VARIANT_ID": "<uuid of a seeded variant>",
  "TEST_COUPON_CODE": "TEST10"
}
```

---

## Appendix — Test Data Requirements

| Seed item | Used by |
|---|---|
| 1 ADMIN user | All admin tests |
| 1 regular USER with verified email | All user tests |
| ≥ 2 products with variants (one featured, one with variants in multiple packaging sizes) | Catalogue, cart, coupon tests |
| ≥ 1 category | Category tests |
| 1 saved address on the test user | Checkout tests |
| 1 active coupon of each type (FIXED, PERCENT, BOGO, SKU_BOGO) | Coupon tests |
| 1 completed order with captured payment (for refund tests) | Returns & Refund tests |
| Razorpay test keys | Payment tests |
| Shiprocket sandbox credentials | Shipping tests |
