# Six Yards Love — End-to-End Testing Checklist
> Plain-language checklist for manual testing by non-technical team members.
> Tick each box as you go. Test on both desktop and mobile where marked 📱.

**Test accounts**
- Buyer: `user@sixyardslove.com` / `user123`
- Admin: `admin@sixyardslove.com` / `admin123`
- Razorpay test card: `4111 1111 1111 1111` · CVV `123` · any future expiry

---

## Part 1 — Buyer Journey

### Sign Up & Login

- [ ] Go to the website. Click the login/sign-up button. Register with a **new email address**.
  - You should see a "verification email sent" message.
- [ ] Try registering again with the **same email**.
  - Should show an error saying the email is already in use.
- [ ] Check your inbox and click the **verification link**.
  - Should log you in and land you on the home page.
- [ ] Log out, then log back in with your new credentials.
  - Should work without issues.
- [ ] Try logging in with the **wrong password**.
  - Should show an error — should NOT log you in.
- [ ] Click **Forgot Password**. Enter your email.
  - Should receive a reset email. Click the link, set a new password, and confirm you can log in with it.
- [ ] While **logged out**, try visiting `/account`, `/cart`, and `/checkout` directly in the browser address bar.
  - All three should redirect you to the login page — not show an error or blank screen. 📱

---

### Browsing the Shop

- [ ] Visit the **Home page**. Check that the featured products section and category grid both load.
- [ ] Click a featured product. Check the product detail page opens correctly. 📱
- [ ] Go to `/shop`. Scroll through the product listing — all cards should show an image, name, and price.
- [ ] Use the **search bar** on the shop page. Type a product name.
  - Matching products should appear. Typing something that doesn't exist should show "No products found".
- [ ] Open any product. **Switch between variants** (e.g. different sizes or weights).
  - The price should update when you change the variant.
- [ ] On a product page, scroll down to the **Reviews** section.
  - Existing reviews should load, or a "no reviews yet" message should appear.
- [ ] While logged in, write a **review** (pick a star rating and type a comment). Submit it.
  - The review should appear on the page immediately.
- [ ] Visit `/categories`. Click a category.
  - Should show only products belonging to that category. 📱

---

### Cart

- [ ] Add a product to the cart. Check the **cart badge** in the header increments.
- [ ] Go to `/cart`. The item you added should be listed with the correct name, variant, and price.
- [ ] Click **+** to increase the quantity. The subtotal should update.
- [ ] Click **−** until the quantity reaches zero (or click the trash icon).
  - The item should be removed. If the cart is now empty, an "empty cart" message should appear.
- [ ] Add a few items, then click **Clear Cart**.
  - All items should be removed at once. 📱

---

### Checkout

> Requires at least one saved address. Add one via Account → Addresses first if needed.

- [ ] Add items to the cart and click **Proceed to Checkout**.
- [ ] On the checkout page, **select a delivery address**. It should highlight when selected.
- [ ] After selecting an address, **courier options with prices** should appear. Select one.
  - The order summary total should update to include the shipping fee.
- [ ] Enter a valid coupon code (ask for a test code) and click **Apply**.
  - A discount line should appear and the total should decrease.
- [ ] Remove the coupon by clicking the × next to it.
  - The total should go back to the original amount.
- [ ] Enter an **invalid coupon code** (e.g. `FAKECODE999`).
  - Should show an error message.
- [ ] Complete the checkout using the Razorpay test card.
  - The Razorpay payment popup should open. After paying, you should land on an order confirmation page. 📱
- [ ] Check **Account → Orders**. The new order should appear with status `CONFIRMED`.

---

### Buy Now (Quick Purchase)

- [ ] Open any product page. Click **Buy Now** (if the button is visible).
  - A dialog should open allowing you to select an address and pay — without going through the cart.
- [ ] Complete the purchase. Check it appears in your order history.

---

### Account — Profile & Addresses

- [ ] Go to **Account → Profile**. Change your first name and save.
  - The new name should appear in the header/navigation.
- [ ] Change your password (current → new → confirm). Log out and log back in with the new password.
  - Should work. Then change it back.
- [ ] Go to **Account → Addresses**. Add a new address with all fields filled in. Save.
  - Should appear in the list immediately.
- [ ] Edit the saved address. Change the city. Save.
  - Updated city should show in the list.
- [ ] Delete the address. Confirm the dialog.
  - Should be removed from the list. 📱

---

### Account — Orders & Wishlist

- [ ] Go to **Account → Orders**. Click any order.
  - Should open order detail showing items, amounts, address, and a tracking section.
- [ ] Go to a product page and click the **heart / wishlist** icon.
  - Icon should change to filled/active.
- [ ] Go to **Account → Wishlist**. The product should be listed there.
- [ ] Click **Remove** on a wishlist item.
  - Should disappear from the list. 📱

---

### Pages to Spot-Check (just open and confirm they load)

- [ ] `/about`
- [ ] `/producers`
- [ ] `/impact`
- [ ] `/contact` — fill in the form and submit; should show a success message
- [ ] `/terms`
- [ ] `/privacy`
- [ ] `/shipping`
- [ ] `/returns`
- [ ] Any URL that doesn't exist (e.g. `/xyz-gibberish`) — should show a "Page Not Found" message, not crash

---

## Part 2 — Admin Journey

> Log in with the Admin account before starting this section. Navigate to `/admin/dashboard`.

---

### Dashboard Overview

- [ ] Open the Admin Dashboard. Four summary cards should be visible: **Total Orders, Total Revenue, Total Products, Total Customers** — all showing real numbers.
- [ ] The **Monthly Sales** chart should show the last 6 months of data. 📱

---

### Products

- [ ] Click the **Products** tab. A table of all products should load.
- [ ] Use the **search box** to filter by product name. Results should narrow in real time.
- [ ] Click **Add Product**. Fill in the name and select a category. Save.
  - The new product should appear in the list.
- [ ] Click **Edit** on any product. Change the name. Save.
  - The updated name should show in the table.
- [ ] Toggle the **Featured** switch on a product.
  - The featured badge should update immediately.
- [ ] Click **Delete** on the test product you created. Confirm the dialog.
  - Should be removed from the list.

---

### Categories

- [ ] Click the **Categories** tab. All categories should be listed.
- [ ] **Add** a new category, **edit** it to rename it, then **delete** it.
  - Each action should reflect immediately in the table.

---

### Inventory

- [ ] Click the **Inventory** tab. Products should be listed with SKU, stock quantity, and a status label (In Stock / Low Stock / Out of Stock).
- [ ] Click **Adjust Stock** for any item. Enter a quantity change (e.g. `+5`) and a reason. Save.
  - The quantity in the table should update.
- [ ] Click **View Movements** (or History) for any item.
  - Should show a log of past stock changes with dates and reasons.

---

### Orders

- [ ] Click the **Orders** tab. A paginated list of orders should appear with status badges.
- [ ] Click any order row. A detail view should open showing line items, customer info, and amounts.
- [ ] Change the **status** of an order (e.g. from `CONFIRMED` to `PROCESSING`).
  - The status badge in the table should update. 📱

---

### Coupons

- [ ] Click the **Coupons** tab. All existing coupons should be listed.
- [ ] Create a **Fixed discount** coupon: give it a unique code, set a fixed value (e.g. ₹50), minimum cart value (e.g. ₹200). Save.
  - Should appear in the list.
- [ ] Create a **Percent discount** coupon: unique code, 10%, max discount ₹100. Save.
- [ ] Go to the shop (as a buyer), add items worth over ₹200, and apply both coupon codes to verify they work.
- [ ] Back in admin, **delete** the test coupons.

---

### Payments

- [ ] Click the **Payments** tab. Payment records should be listed with amounts, status, and provider IDs.
- [ ] Use the **status filter** (e.g. select CAPTURED). The table should show only captured payments.

---

### Customers

- [ ] Click the **Customers** tab. A list of registered customers should appear.
- [ ] Click a customer row. Their profile and order history should be visible.
- [ ] Toggle a customer's **Active / Inactive** status. The badge should update.
  - Revert the status after testing.

---

### Returns & Refunds

- [ ] Click the **Returns / Refunds** tab. Any cancelled orders should be listed.
- [ ] Find a cancelled order that has a payment attached. Click **Process Refund**. Confirm the dialog.
  - Order status should change to `REFUNDED`. The Process Refund button should become disabled for that row.
- [ ] Try clicking Process Refund on the **same order again**.
  - Should show an error — no double refund allowed.
- [ ] Check that a **COD order** (cash on delivery, no online payment) shows "No payment" instead of a refund button.

---

### Shipping

- [ ] Click the **Shipping** tab. Enter a pickup postcode and a delivery postcode. Click **Check Rates**.
  - Courier options with prices should appear.
- [ ] Enter an AWB / tracking number and click **Track**.
  - Should show tracking events (or a "not found" message for an unknown number).

---

### Media

- [ ] Click the **Media** tab. Click **Upload** and select an image from your computer.
  - The image should appear in the media library after uploading.

---

### Featured Sections

- [ ] Click the **Featured** tab. Create a new featured section with a title.
- [ ] Add a product to the section.
- [ ] Delete the test section when done.

---

### Messages (Contact Form Submissions)

- [ ] Click the **Messages** tab. Any contact form submissions should be listed.
- [ ] Click a message to mark it as read.

---

## Part 3 — Mobile Checks 📱

Run these on a real phone or using browser DevTools → device emulation (375 × 812 px).

- [ ] Home page loads without any content cut off or overlapping.
- [ ] Shop page: product cards are readable and tappable.
- [ ] Product detail page: images swipe correctly, "Add to Cart" button is easy to tap.
- [ ] Cart page: all items, quantity buttons (+/−), and the Checkout button are fully visible.
- [ ] Full checkout flow completes successfully on mobile (address → courier → pay).
- [ ] Admin dashboard: a hamburger menu (☰) appears; tapping it opens the sidebar.
- [ ] Login modal: the form and login button are visible even with the keyboard open.

---

## What to Log When Something Fails

When you find an issue, note:
1. **What you were doing** (e.g. "Adding item to cart on iPhone Safari")
2. **What you expected** to happen
3. **What actually happened** (screenshot if possible)
4. **Can you reproduce it?** (does it happen every time, or only sometimes)
