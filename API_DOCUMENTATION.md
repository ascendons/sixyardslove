# Six Yards Love E-Commerce API Documentation

**Base URL:** `http://localhost:8081`
**Authentication:** Bearer token via `Authorization` header (JWT). Token is stored in `localStorage` under `syl_auth_user`.

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [User Profile & Addresses](#2-user-profile--addresses)
3. [Products & Categories](#3-products--categories)
4. [Shopping Cart](#4-shopping-cart)
5. [Orders](#5-orders)
6. [Payments & Razorpay](#6-payments--razorpay)
7. [Coupons & Discounts](#7-coupons--discounts)
8. [Wishlist](#8-wishlist)
9. [Reviews](#9-reviews)
10. [Shipping](#10-shipping)
11. [Media Assets](#11-media-assets)
12. [Featured Products](#12-featured-products)
13. [Sellers](#13-sellers)
14. [Contact Messages](#14-contact-messages)
15. [Admin: Customers](#15-admin-customers)
16. [Admin: Inventory](#16-admin-inventory)
17. [Admin: Packaging Boxes](#17-admin-packaging-boxes)
18. [Admin: Shipments](#18-admin-shipments)
19. [Admin: Shiprocket](#19-admin-shiprocket)
20. [Admin: Analytics](#20-admin-analytics)
21. [Geo, Tax & Currency](#21-geo-tax--currency)
22. [Admin Management](#22-admin-management)
23. [Webhooks](#23-webhooks)

---

## 1. Authentication

### POST /api/auth/register
Register a new user account.

**Request Body:**
```json
{
  "firstName": "string",        // REQUIRED
  "lastName": "string",         // optional
  "email": "string",             // REQUIRED, email format
  "phone": "string",             // optional
  "password": "string"           // REQUIRED, min 8 chars, must contain uppercase, lowercase, number, special char
}
```

**Response:** `202 Accepted`
```json
{ "message": "string" }
```

---

### GET /api/auth/verify-email?token={token}
Verify email address using the token sent to the user's email.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| token | string | ✅ | Email verification token |

**Response:** `200 OK` — Sets `syl_auth_user` in localStorage
```json
{
  "username": "string",
  "role": "admin | user | super_admin",
  "token": "string"
}
```

---

### POST /api/auth/login
Authenticate user and receive JWT tokens.

**Request Body:**
```json
{
  "email": "string",    // REQUIRED, email format
  "password": "string"  // REQUIRED
}
```

**Response:** `200 OK`
```json
{
  "accessToken": "string",
  "refreshToken": "string",
  "tokenType": "string",
  "role": "string"
}
```

---

### POST /api/auth/refresh
Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "string"  // REQUIRED
}
```

**Response:** `200 OK`
```json
{
  "accessToken": "string",
  "refreshToken": "string",
  "tokenType": "string",
  "role": "string"
}
```

---

### POST /api/auth/forgot-password
Request a password reset email.

**Request Body:**
```json
{
  "email": "string"  // REQUIRED, email format
}
```

**Response:** `200 OK` — `void`

---

### POST /api/auth/reset-password
Reset password using a valid token.

**Request Body:**
```json
{
  "token": "string",        // REQUIRED
  "newPassword": "string"   // REQUIRED, min 8 chars, must contain uppercase, lowercase, number, special char
}
```

**Response:** `200 OK` — `void`

---

## 2. User Profile & Addresses

### GET /api/users/me
Get current authenticated user's profile.

**Auth:** Required

**Response:** `200 OK`
```json
{
  "id": "UUID",
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "phone": "string",
  "role": "string",
  "isActive": "boolean",
  "createdAt": "string (ISO datetime)"
}
```

---

### PATCH /api/users/me
Update current user's profile.

**Auth:** Required

**Request Body:**
```json
{
  "firstName": "string",  // optional
  "lastName": "string",   // optional
  "phone": "string"       // optional
}
```

**Response:** `200 OK` — Updated `UserProfile` object (same shape as GET)

---

### POST /api/users/me/change-password
Change the authenticated user's password.

**Auth:** Required

**Request Body:**
```json
{
  "oldPassword": "string",   // REQUIRED
  "newPassword": "string"    // REQUIRED, min 8 chars, must contain uppercase, lowercase, number, special char
}
```

**Response:** `200 OK` — `void`

---

### GET /api/users/me/addresses
Get all addresses for the current user.

**Auth:** Required

**Response:** `200 OK`
```json
[
  {
    "id": "UUID",
    "label": "string",
    "addressLine1": "string",
    "addressLine2": "string",
    "city": "string",
    "state": "string",
    "country": "string",
    "pincode": "string",
    "landmark": "string",
    "alternatePhone": "string",
    "addressType": "HOME | OFFICE | OTHER",
    "isDefault": "boolean"
  }
]
```

---

### POST /api/users/me/addresses
Add a new address for the current user.

**Auth:** Required

**Request Body:**
```json
{
  "label": "string",              // optional
  "addressLine1": "string",        // REQUIRED
  "addressLine2": "string",        // optional
  "city": "string",                // REQUIRED
  "state": "string",               // REQUIRED
  "country": "string",             // optional, default: "India"
  "pincode": "string",             // optional
  "landmark": "string",            // optional
  "alternatePhone": "string",      // optional
  "addressType": "string",         // optional, one of: HOME, OFFICE, OTHER
  "isDefault": "boolean"           // optional
}
```

**Response:** `201 Created` — Created `UserAddress` object

---

### PUT /api/users/me/addresses/{addressId}
Update an existing address.

**Auth:** Required

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| addressId | UUID | ✅ | Address ID |

**Request Body:** Same as POST (all fields optional)

**Response:** `200 OK` — Updated `UserAddress` object

---

### DELETE /api/users/me/addresses/{addressId}
Delete an address.

**Auth:** Required

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| addressId | UUID | ✅ | Address ID |

**Response:** `204 No Content` — `void`

---

## 3. Products & Categories

### GET /api/products
Get all products (paginated).

**Auth:** Not required

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | integer | optional, default: 0 | Page number |
| size | integer | optional, default: 20 | Page size |

**Response:** `200 OK`
```json
[
  {
    "id": "UUID",
    "productName": "string",
    "description": "string",
    "productCode": "string",
    "categoryId": "UUID",
    "categoryName": "string",
    "subCategory": "string",
    "unit": "string",
    "location": "string",
    "producedBy": "string",
    "featured": "boolean",
    "isActive": "boolean",
    "returnApplicable": "boolean",
    "returnWindow": "string",
    "images": [{ "imageUrl": "string", "isPrimary": "boolean" }],
    "variants": [{
      "id": "UUID",
      "sku": "string",
      "sellingPrice": "number",
      "packaging": "string",
      "weightKg": "number",
      "lengthMm": "number",
      "breadthMm": "number",
      "heightMm": "number",
      "unitsPerBox": "number",
      "mrp": "number",
      "bulkOrderPrice": "number",
      "moq": "number"
    }]
  }
]
```

---

### GET /api/products/search?query={query}
Search products by name or description.

**Auth:** Not required

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | ✅ | Search query |

**Response:** `200 OK` — Array of `Product` objects

---

### GET /api/products/featured
Get featured products.

**Auth:** Not required

**Response:** `200 OK` — Array of `Product` objects

---

### GET /api/products/category/{categoryId}
Get products by category ID.

**Auth:** Not required

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| categoryId | UUID | ✅ | Category ID |

**Response:** `200 OK` — Array of `Product` objects

---

### GET /api/products/{idOrCode}
Get a single product by ID or product code.

**Auth:** Not required

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| idOrCode | string | ✅ | Product UUID or product code |

**Response:** `200 OK` — `Product` object or `404 Not Found`

---

### GET /api/categories
Get all categories.

**Auth:** Not required

**Response:** `200 OK`
```json
[
  {
    "id": "UUID",
    "name": "string",
    "imageUrl": "string",
    "parentId": "UUID",
    "isActive": "boolean"
  }
]
```

---

### GET /api/categories/{id}
Get a category by ID.

**Auth:** Not required

**Response:** `200 OK` — `Category` object

---

### GET /api/variants/product/{productId}
Get all variants for a product.

**Auth:** Not required

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| productId | UUID | ✅ | Product ID |

**Response:** `200 OK`
```json
[
  {
    "id": "UUID",
    "sku": "string",
    "sellingPrice": "number",
    "packaging": "string",
    "weightKg": "number",
    "lengthMm": "number",
    "breadthMm": "number",
    "heightMm": "number",
    "unitsPerBox": "number",
    "mrp": "number",
    "bulkOrderPrice": "number",
    "moq": "number",
    "cogs": "number",
    "isActive": "boolean"
  }
]
```

---

### GET /api/product-images/product/{productId}
Get all images for a product.

**Auth:** Not required

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| productId | UUID | ✅ | Product ID |

**Response:** `200 OK`
```json
[
  {
    "id": "UUID",
    "imageUrl": "string",
    "isPrimary": "boolean",
    "productId": "UUID"
  }
]
```

---

## 4. Shopping Cart

### GET /api/cart
Get the current user's cart.

**Auth:** Required

**Response:** `200 OK`
```json
{
  "id": "UUID",
  "items": [
    {
      "id": "UUID",
      "productId": "UUID",
      "productVariantId": "UUID",
      "categoryId": "UUID",
      "sku": "string",
      "productName": "string",
      "packaging": "string",
      "price": "number",
      "quantity": "number",
      "imageUrl": "string",
      "weightKg": "number",
      "lengthMm": "number",
      "breadthMm": "number",
      "heightMm": "number",
      "unitsPerBox": "number"
    }
  ],
  "totalAmount": "number",
  "currency": "string"
}
```

---

### POST /api/cart/items
Add an item to the cart.

**Auth:** Required

**Request Body:**
```json
{
  "productVariantId": "UUID",  // REQUIRED
  "quantity": "integer"         // REQUIRED, minimum 1
}
```

**Response:** `200 OK` — Updated `CartResponse` object

---

### PUT /api/cart/items/{itemId}
Update the quantity of a cart item.

**Auth:** Required

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| itemId | UUID | ✅ | Cart item ID |

**Request Body:**
```json
{
  "productVariantId": "UUID",  // REQUIRED
  "quantity": "integer"         // REQUIRED, minimum 1
}
```

**Response:** `200 OK` — Updated `CartResponse` object

---

### DELETE /api/cart/items/{itemId}
Remove an item from the cart.

**Auth:** Required

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| itemId | UUID | ✅ | Cart item ID |

**Response:** `200 OK` — Updated `CartResponse` object

---

### DELETE /api/cart
Clear all items from the cart.

**Auth:** Required

**Response:** `204 No Content` — `void`

---

## 5. Orders

### POST /api/orders
Place an order from the current cart.

**Auth:** Required

**Request Body:**
```json
{
  "addressId": "UUID",            // REQUIRED
  "isBulk": "boolean",            // optional, default: false
  "currencyCode": "string",       // optional, e.g., "USD"
  "couponCode": "string",         // optional
  "shippingFee": "number",        // optional
  "preferredCourierId": "long"    // optional
}
```

**Response:** `201 Created`
```json
{
  "id": "UUID",
  "orderNumber": "string",
  "status": "string",
  "totalAmount": "number",
  "shippingFee": "number",
  "currency": "string",
  "customerName": "string",
  "paymentId": "UUID",
  "shippingId": "UUID",
  "isBulk": "boolean",
  "exchangeRate": "number",
  "taxAmount": "number",
  "taxRate": "number",
  "cgstAmount": "number",
  "sgstAmount": "number",
  "igstAmount": "number",
  "items": [
    {
      "id": "UUID",
      "productId": "UUID",
      "productVariantId": "UUID",
      "sku": "string",
      "productName": "string",
      "quantity": "number",
      "price": "number",
      "packaging": "string"
    }
  ],
  "createdAt": "string (ISO datetime)",
  "returnRequested": "boolean",
  "returnReason": "string",
  "returnRequestedAt": "string (ISO datetime)"
}
```

---

### POST /api/orders/buy-now
Buy a single product immediately without adding to cart.

**Auth:** Required

**Request Body:**
```json
{
  "productVariantId": "UUID",  // REQUIRED
  "quantity": "integer",        // REQUIRED, minimum 1
  "addressId": "UUID",          // REQUIRED
  "isBulk": "boolean",          // optional
  "currencyCode": "string",     // optional
  "couponCode": "string",       // optional
  "shippingFee": "number"      // optional
}
```

**Response:** `201 Created` — `OrderResponse` object (same as `/api/orders`)

---

### GET /api/orders/me
Get the current user's orders (paginated).

**Auth:** Required

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | integer | optional, default: 0 | Page number |
| size | integer | optional, default: 10 | Page size |

**Response:** `200 OK` — Spring `Page` object
```json
{
  "content": ["OrderResponse"],
  "totalElements": "number",
  "totalPages": "number",
  "number": "number",
  "size": "number",
  "last": "boolean",
  "first": "boolean",
  "empty": "boolean"
}
```

---

### GET /api/orders/{id}
Get a specific order by ID.

**Auth:** Required (must be order owner or admin)

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | UUID | ✅ | Order ID |

**Response:** `200 OK` — `OrderResponse` object

---

### GET /api/orders/{id}/tracking
Get tracking information for an order.

**Auth:** Not required

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | UUID | ✅ | Order ID |

**Response:** `200 OK`
```json
{
  "orderId": "UUID",
  "status": "string",
  "trackingNumber": "string",
  "carrier": "string",
  "estimatedDelivery": "string (ISO datetime)",
  "events": [
    {
      "timestamp": "string (ISO datetime)",
      "status": "string",
      "location": "string",
      "description": "string"
    }
  ]
}
```

---

### POST /api/orders/{id}/cancel
Cancel an order.

**Auth:** Required (must be order owner)

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | UUID | ✅ | Order ID |

**Response:** `200 OK` — `OrderResponse` object with updated status

---

### POST /api/orders/{id}/return-request
Request a return for an order.

**Auth:** Required (must be order owner)

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | UUID | ✅ | Order ID |

**Request Body:**
```json
{
  "reason": "string"  // REQUIRED
}
```

**Response:** `200 OK` — `OrderResponse` object

---

## 6. Payments & Razorpay

### GET /api/payments/order/{orderId}
Get all payments for an order.

**Auth:** Required

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| orderId | UUID | ✅ | Order ID |

**Response:** `200 OK`
```json
[
  {
    "id": "UUID",
    "orderId": "UUID",
    "provider": "string",
    "method": "string",
    "status": "string",
    "amount": "number",
    "currency": "string",
    "providerOrderId": "string",
    "providerPaymentId": "string",
    "failureReason": "string",
    "paidAt": "string (ISO datetime)",
    "createdAt": "string (ISO datetime)"
  }
]
```

---

### POST /api/payments/razorpay/create-order
Create a Razorpay order for payment.

**Auth:** Required

**Request Body:**
```json
{
  "orderId": "UUID"  // REQUIRED, internal order ID
}
```

**Response:** `200 OK`
```json
{
  "keyId": "string",
  "razorpayOrderId": "string",
  "amountInPaisa": "number",
  "currency": "string",
  "internalOrderId": "UUID",
  "internalPaymentId": "UUID",
  "customerName": "string",
  "customerEmail": "string"
}
```

---

### POST /api/payments/razorpay/verify
Verify a Razorpay payment and capture it.

**Auth:** Required

**Request Body:**
```json
{
  "internalPaymentId": "UUID",     // REQUIRED
  "razorpayPaymentId": "string",  // REQUIRED
  "razorpayOrderId": "string",    // REQUIRED
  "razorpaySignature": "string"  // REQUIRED
}
```

**Response:** `200 OK` — `void`

---

## 7. Coupons & Discounts

### GET /api/coupons/applicable?productId={productId}&categoryId={categoryId}
Get coupons applicable to a specific product/category.

**Auth:** Not required

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| productId | UUID | ✅ | Product ID |
| categoryId | UUID | optional | Category ID |

**Response:** `200 OK`
```json
[
  {
    "id": "UUID",
    "code": "string",
    "description": "string",
    "discountType": "FIXED | PERCENT | PERCENT_CAP | BOGO | SKU_BOGO",
    "discountValue": "number",
    "buyQty": "number",
    "getQty": "number",
    "buySku": "string",
    "getSku": "string",
    "minCartValue": "number",
    "maxDiscount": "number",
    "expiresAt": "string (ISO datetime)",
    "usageLimit": "number",
    "userLimit": "number",
    "isActive": "boolean",
    "rules": "string",
    "applicable": "boolean"
  }
]
```

---

### GET /api/coupons/all?productId={productId}&categoryId={categoryId}
Get all active coupons with applicability flags.

**Auth:** Not required

**Query Parameters:** Same as `/applicable`

**Response:** `200 OK` — Array of `CouponResponse` objects

---

### POST /api/coupons/validate?code={code}
Validate a coupon code against cart items.

**Auth:** Optional (authenticated users get user-specific coupon limits)

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| code | string | ✅ | Coupon code to validate |

**Request Body:**
```json
[
  {
    "productId": "UUID",
    "variantId": "UUID",
    "categoryId": "UUID",
    "sku": "string",
    "price": "number",
    "quantity": "number"
  }
]
```

**Response:** `200 OK`
```json
{
  "valid": "boolean",
  "message": "string",
  "discountAmount": "number",
  "discountType": "string",
  "code": "string"
}
```

---

### GET /admin/coupons/all
Get all coupons (admin).

**Auth:** ADMIN or SUPER_ADMIN

**Response:** `200 OK` — Array of `CouponResponse` objects

---

### POST /admin/coupons/create
Create a new coupon (admin).

**Auth:** ADMIN or SUPER_ADMIN

**Request Body:**
```json
{
  "code": "string",               // REQUIRED
  "description": "string",        // REQUIRED
  "discountType": "string",       // REQUIRED: FIXED, PERCENT, PERCENT_CAP, BOGO, SKU_BOGO
  "discountValue": "number",      // REQUIRED
  "buyQty": "number",             // optional (for BOGO/SKU_BOGO)
  "getQty": "number",             // optional (for BOGO/SKU_BOGO)
  "buySku": "string",             // optional (for SKU_BOGO)
  "getSku": "string",             // optional (for SKU_BOGO)
  "minCartValue": "number",       // optional
  "maxDiscount": "number",        // optional
  "usageLimit": "number",         // optional
  "userLimit": "number",          // optional
  "isActive": "boolean",          // optional, default: true
  "expiresAt": "string",         // optional, ISO datetime
  "rules": "string"              // optional
}
```

**Response:** `201 Created` — `CouponResponse` object

---

### PUT /admin/coupons/update/{id}
Update a coupon (admin).

**Auth:** ADMIN or SUPER_ADMIN

**Request Body:** Same as POST `/admin/coupons/create`

**Response:** `200 OK` — `CouponResponse` object

---

### DELETE /admin/coupons/delete/{id}
Delete a coupon (admin).

**Auth:** ADMIN or SUPER_ADMIN

**Response:** `204 No Content` — `void`

---

## 8. Wishlist

### GET /api/wishlist
Get the current user's wishlist.

**Auth:** Required

**Response:** `200 OK`
```json
{
  "id": "UUID",
  "items": [
    {
      "id": "UUID",
      "productId": "UUID",
      "productName": "string",
      "productCode": "string",
      "price": "number",
      "imageUrl": "string"
    }
  ]
}
```

---

### POST /api/wishlist/items
Add a product to the wishlist.

**Auth:** Required

**Request Body:**
```json
{
  "productId": "UUID"  // REQUIRED
}
```

**Response:** `200 OK` — Updated `Wishlist` object

---

### DELETE /api/wishlist/items/{productId}
Remove a product from the wishlist.

**Auth:** Required

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| productId | UUID | ✅ | Product ID to remove |

**Response:** `204 No Content` — `void`

---

### GET /api/wishlist/check/{productId}
Check if a product is in the user's wishlist.

**Auth:** Required

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| productId | UUID | ✅ | Product ID to check |

**Response:** `200 OK`
```json
true | false
```

---

## 9. Reviews

### GET /api/reviews/product/{productId}
Get all reviews for a product.

**Auth:** Not required

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| productId | UUID | ✅ | Product ID |

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | integer | optional, default: 0 | Page number |
| size | integer | optional, default: 20 | Page size |

**Response:** `200 OK`
```json
[
  {
    "id": "UUID",
    "userName": "string",
    "productId": "UUID",
    "rating": "number",
    "comment": "string",
    "createdAt": "string (ISO datetime)"
  }
]
```

---

### POST /api/reviews
Add a review for a product.

**Auth:** Required

**Request Body:**
```json
{
  "productId": "UUID",   // REQUIRED
  "rating": "integer",   // REQUIRED, 1-5
  "comment": "string"    // REQUIRED, non-blank
}
```

**Response:** `201 Created` — `Review` object

---

## 10. Shipping

### GET /api/shipping/rates?delivery_postcode={postcode}&weight={weight}&cod={cod}
Get available shipping rates for a delivery address.

**Auth:** Not required

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| delivery_postcode | string | ✅ | Delivery postal/PIN code |
| weight | number | optional, default: 0.5 | Weight in kg |
| cod | number | optional, default: 0 | 1 if COD preferred, 0 otherwise |

**Response:** `200 OK`
```json
[
  {
    "courierCompanyId": "number",
    "courierName": "string",
    "rate": "number",
    "freightCharge": "number",
    "rtoCharges": "number",
    "etd": "string",
    "etdHours": "number",
    "estimatedDeliveryDays": "number",
    "cod": "boolean",
    "codCharges": "number",
    "chargeWeight": "number",
    "minWeight": "number",
    "isSurface": "boolean",
    "blocked": "boolean",
    "rating": "number",
    "zone": "string",
    "reason": "string",
    "realtimeTracking": "boolean"
  }
]
```

---

## 11. Media Assets

### GET /api/media-assets?placement={placement}
Get media assets by placement.

**Auth:** Not required

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| placement | string | ✅ | Placement identifier (e.g., "HOME_BANNER", "CAROUSEL") |

**Response:** `200 OK`
```json
[
  {
    "id": "UUID",
    "type": "BANNER | CAROUSEL",
    "placement": "string",
    "imageUrl": "string",
    "title": "string",
    "subtitle": "string",
    "linkUrl": "string",
    "displayOrder": "number",
    "isActive": "boolean",
    "startsAt": "string (ISO datetime)",
    "endsAt": "string (ISO datetime)"
  }
]
```

---

### GET /api/media-assets/type/{type}
Get media assets by type.

**Auth:** Not required

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| type | string | ✅ | Asset type (BANNER, CAROUSEL) |

**Response:** `200 OK` — Array of `MediaAsset` objects

---

### POST /api/admin/media-assets
Create a new media asset.

**Auth:** ADMIN or SUPER_ADMIN

**Request Body:**
```json
{
  "type": "string",           // REQUIRED: BANNER or CAROUSEL
  "placement": "string",      // REQUIRED
  "imageUrl": "string",       // REQUIRED (URL, data URI, or absolute path)
  "title": "string",          // optional
  "subtitle": "string",       // optional
  "linkUrl": "string",        // optional
  "displayOrder": "number",   // optional
  "isActive": "boolean",      // optional
  "startsAt": "string",       // optional, ISO datetime
  "endsAt": "string"         // optional, ISO datetime
}
```

**Response:** `201 Created` — `MediaAsset` object

---

### PUT /api/admin/media-assets/{id}
Update a media asset.

**Auth:** ADMIN or SUPER_ADMIN

**Request Body:** Same as POST

**Response:** `200 OK` — Updated `MediaAsset` object

---

### DELETE /api/admin/media-assets/{id}
Delete a media asset.

**Auth:** ADMIN or SUPER_ADMIN

**Response:** `204 No Content` — `void`

---

### POST /api/media/presign
Generate a presigned S3 URL for direct file upload.

**Auth:** ADMIN or SUPER_ADMIN

**Request Body:**
```json
{
  "folder": "string",      // REQUIRED: target folder in S3
  "fileName": "string",    // REQUIRED: filename for the upload
  "contentType": "string"  // REQUIRED: MIME type (e.g., "image/jpeg")
}
```

**Response:** `200 OK`
```json
{
  "uploadUrl": "string",
  "publicUrl": "string"
}
```

---

### POST /api/media/upload
Upload a file directly to the server (multipart form, max 10MB).

**Auth:** ADMIN or SUPER_ADMIN

**Request:** `multipart/form-data`
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| file | File | ✅ | The file to upload |
| folder | string | ✅ | Target folder |
| fileName | string | ✅ | Target filename |
| contentType | string | ✅ | MIME type |

**Response:** `200 OK`
```json
"string"  // Public URL of the uploaded file
```

---

## 12. Featured Products

### GET /api/featured/sections
Get all active feature sections.

**Auth:** Not required

**Response:** `200 OK`
```json
[
  {
    "id": "UUID",
    "name": "string",
    "description": "string",
    "imageUrl": "string",
    "isActive": "boolean"
  }
]
```

---

### GET /api/featured/sections/{id}
Get a specific feature section by ID.

**Auth:** Not required

**Response:** `200 OK` — `FeatureSection` object

---

### GET /api/featured/products/section/{sectionId}
Get featured products for a specific section.

**Auth:** Not required

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| sectionId | UUID | ✅ | Feature section ID |

**Response:** `200 OK`
```json
[
  {
    "id": "UUID",
    "product": "Product object",
    "displayOrder": "number",
    "startsAt": "string (ISO datetime)",
    "endsAt": "string (ISO datetime)",
    "isActive": "boolean"
  }
]
```

---

### GET /admin/features/sections/all
Get all feature sections (admin).

**Auth:** ADMIN or SUPER_ADMIN

**Response:** `200 OK` — Array of all `FeatureSection` objects

---

### POST /admin/features/sections
Create a new feature section (admin).

**Auth:** ADMIN or SUPER_ADMIN

**Request Body:**
```json
{
  "name": "string",        // REQUIRED
  "description": "string", // optional
  "imageUrl": "string",   // optional
  "isActive": "boolean"   // optional, default: true
}
```

**Response:** `201 Created` — `FeatureSection` object

---

### PUT /admin/features/sections/{id}
Update a feature section (admin).

**Auth:** ADMIN or SUPER_ADMIN

**Request Body:** Same as POST

**Response:** `200 OK` — Updated `FeatureSection` object

---

### DELETE /admin/features/sections/{id}
Delete a feature section (admin).

**Auth:** ADMIN or SUPER_ADMIN

**Response:** `204 No Content` — `void`

---

### GET /admin/features/products/section/{sectionId}/all
Get all featured products in a section (admin).

**Auth:** ADMIN or SUPER_ADMIN

**Response:** `200 OK` — Array of `FeaturedProduct` objects

---

### POST /admin/features/products
Add a featured product to a section (admin).

**Auth:** ADMIN or SUPER_ADMIN

**Request Body:**
```json
{
  "featureSectionId": "UUID",     // REQUIRED
  "productId": "UUID",            // REQUIRED
  "displayOrder": "number",      // optional
  "startsAt": "string",         // optional, ISO datetime
  "endsAt": "string",           // optional, ISO datetime
  "isActive": "boolean"         // optional, default: true
}
```

**Response:** `201 Created` — `FeaturedProduct` object

---

### PUT /admin/features/products/{id}
Update a featured product (admin).

**Auth:** ADMIN or SUPER_ADMIN

**Request Body:** Same as POST

**Response:** `200 OK` — Updated `FeaturedProduct` object

---

### DELETE /admin/features/products/{id}
Remove a featured product from its section (admin).

**Auth:** ADMIN or SUPER_ADMIN

**Response:** `204 No Content` — `void`

---

## 13. Sellers

### GET /api/sellers
Get all active sellers (public).

**Auth:** Not required

**Response:** `200 OK`
```json
[
  {
    "id": "UUID",
    "firstName": "string",
    "lastName": "string",
    "businessName": "string",
    "gstin": "string",
    "address": "string",
    "contactEmail": "string",
    "contactPhone": "string",
    "description": "string",
    "imageUrl": "string",
    "activity": "string",
    "memberCount": "number",
    "city": "string",
    "state": "string",
    "isVerified": "boolean",
    "isActive": "boolean"
  }
]
```

---

### GET /admin/sellers
Get all sellers (admin).

**Auth:** ADMIN or SUPER_ADMIN

**Response:** `200 OK` — Array of `Seller` objects (includes inactive)

---

### GET /admin/sellers/{id}
Get a seller by ID (admin).

**Auth:** ADMIN or SUPER_ADMIN

**Response:** `200 OK` — `Seller` object

---

### POST /admin/sellers
Create a new seller (admin).

**Auth:** ADMIN or SUPER_ADMIN

**Request Body:**
```json
{
  "firstName": "string",      // REQUIRED
  "lastName": "string",       // REQUIRED
  "email": "string",          // REQUIRED
  "businessName": "string",  // REQUIRED
  "gstin": "string",         // optional
  "address": "string",       // optional
  "contactEmail": "string",  // optional
  "contactPhone": "string",  // optional
  "description": "string",   // optional
  "imageUrl": "string",      // optional
  "activity": "string",      // optional
  "memberCount": "number",   // optional
  "city": "string",          // optional
  "state": "string",         // optional
  "isVerified": "boolean",   // optional, default: false
  "isActive": "boolean"      // optional, default: true
}
```

**Response:** `201 Created` — `Seller` object

---

### PUT /admin/sellers/{id}
Update a seller (admin).

**Auth:** ADMIN or SUPER_ADMIN

**Request Body:** Same as POST (all fields optional)

**Response:** `200 OK` — Updated `Seller` object

---

### DELETE /admin/sellers/{id}
Delete a seller (admin).

**Auth:** ADMIN or SUPER_ADMIN

**Response:** `204 No Content` — `void`

---

## 14. Contact Messages

### POST /api/contact
Submit a contact message.

**Auth:** Not required

**Request Body:**
```json
{
  "name": "string",     // REQUIRED
  "email": "string",   // REQUIRED
  "phone": "string",   // optional
  "subject": "string", // REQUIRED
  "message": "string" // REQUIRED
}
```

**Response:** `201 Created`
```json
{
  "id": "UUID",
  "name": "string",
  "email": "string",
  "phone": "string",
  "subject": "string",
  "message": "string",
  "isRead": "boolean",
  "createdAt": "string (ISO datetime)"
}
```

---

### GET /api/admin/contacts
Get all contact messages (admin).

**Auth:** ADMIN or SUPER_ADMIN

**Response:** `200 OK` — Array of `ContactMessage` objects

---

### PATCH /api/admin/contacts/{id}/read
Mark a contact message as read (admin).

**Auth:** ADMIN or SUPER_ADMIN

**Response:** `204 No Content` — `void`

---

### DELETE /api/admin/contacts/{id}
Delete a contact message (admin).

**Auth:** ADMIN or SUPER_ADMIN

**Response:** `204 No Content` — `void`

---

## 15. Admin Customers

### GET /admin/customers?search={search}&page={page}&size={size}
Get all customers (admin, paginated and searchable).

**Auth:** ADMIN or SUPER_ADMIN

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| search | string | optional | Search by name or email |
| page | integer | optional, default: 0 | Page number |
| size | integer | optional, default: 50 | Page size |

**Response:** `200 OK`
```json
{
  "content": [
    {
      "id": "UUID",
      "firstName": "string",
      "lastName": "string",
      "email": "string",
      "phone": "string",
      "role": "string",
      "isActive": "boolean",
      "createdAt": "string (ISO datetime)"
    }
  ],
  "totalElements": "number",
  "totalPages": "number",
  "number": "number",
  "size": "number",
  "last": "boolean",
  "first": "boolean",
  "empty": "boolean"
}
```

---

### GET /admin/customers/{id}
Get a customer by ID (admin).

**Auth:** ADMIN or SUPER_ADMIN

**Response:** `200 OK` — Customer object with full details

---

### PATCH /admin/customers/{id}/status?active={active}
Enable or disable a customer account (admin).

**Auth:** ADMIN or SUPER_ADMIN

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| active | boolean | ✅ | true to enable, false to disable |

**Response:** `200 OK` — Updated customer object

---

## 16. Admin Inventory

### GET /admin/inventory?page={page}&size={size}
Get all inventory items (admin, paginated).

**Auth:** ADMIN or SUPER_ADMIN

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | integer | optional, default: 0 | Page number |
| size | integer | optional, default: 20 | Page size |

**Response:** `200 OK`
```json
{
  "content": [
    {
      "id": "UUID",
      "productVariantId": "UUID",
      "sku": "string",
      "productName": "string",
      "productCode": "string",
      "unit": "string",
      "quantity": "number",
      "stockLevel": "string",
      "location": "string",
      "status": "In Stock | Low Stock | Out of Stock"
    }
  ],
  "totalElements": "number",
  "totalPages": "number",
  "number": "number",
  "size": "number",
  "last": "boolean",
  "first": "boolean",
  "empty": "boolean"
}
```

---

### GET /admin/inventory/{productVariantId}
Get inventory for a specific product variant.

**Auth:** ADMIN or SUPER_ADMIN

**Response:** `200 OK` — `InventoryItem` object

---

### POST /admin/inventory/adjust
Adjust inventory stock quantity.

**Auth:** ADMIN or SUPER_ADMIN

**Request Body:**
```json
{
  "productVariantId": "UUID",  // REQUIRED
  "changeQty": "integer",      // REQUIRED: positive to add, negative to subtract
  "reason": "string"           // REQUIRED
}
```

**Response:** `200 OK` — `void`

---

### GET /admin/inventory/{productVariantId}/movements
Get inventory movement history for a variant.

**Auth:** ADMIN or SUPER_ADMIN

**Response:** `200 OK`
```json
[
  {
    "id": "UUID",
    "productVariantId": "UUID",
    "changeQty": "number",
    "reason": "string",
    "previousQuantity": "number",
    "newQuantity": "number",
    "createdAt": "string (ISO datetime)"
  }
]
```

---

### POST /admin/inventory/sync
Sync inventory from external source.

**Auth:** ADMIN or SUPER_ADMIN

**Response:** `200 OK` — `void`

---

### GET /admin/inventory/missing
Get product variants that are missing inventory records.

**Auth:** ADMIN or SUPER_ADMIN

**Response:** `200 OK`
```json
[
  {
    "id": "UUID",
    "sku": "string",
    "productName": "string",
    "productCode": "string"
  }
]
```

---

## 17. Admin Packaging Boxes

### GET /admin/packaging-boxes
Get all packaging boxes.

**Auth:** ADMIN or SUPER_ADMIN

**Response:** `200 OK`
```json
[
  {
    "id": "UUID",
    "name": "string",
    "lengthCm": "number",
    "breadthCm": "number",
    "heightCm": "number",
    "maxWeightKg": "number",
    "isActive": "boolean"
  }
]
```

---

### GET /admin/packaging-boxes/active
Get all active packaging boxes.

**Auth:** ADMIN or SUPER_ADMIN

**Response:** `200 OK` — Array of active `PackagingBox` objects

---

### GET /admin/packaging-boxes/{id}
Get a packaging box by ID.

**Auth:** ADMIN or SUPER_ADMIN

**Response:** `200 OK` — `PackagingBox` object

---

### POST /admin/packaging-boxes
Create a new packaging box.

**Auth:** ADMIN or SUPER_ADMIN

**Request Body:**
```json
{
  "name": "string",       // REQUIRED
  "lengthCm": "number",    // REQUIRED, positive
  "breadthCm": "number",   // REQUIRED, positive
  "heightCm": "number",    // REQUIRED, positive
  "maxWeightKg": "number", // REQUIRED, positive
  "isActive": "boolean"   // optional, default: true
}
```

**Response:** `201 Created` — `PackagingBox` object

---

### PUT /admin/packaging-boxes/{id}
Update a packaging box.

**Auth:** ADMIN or SUPER_ADMIN

**Request Body:** Same as POST

**Response:** `200 OK` — Updated `PackagingBox` object

---

### DELETE /admin/packaging-boxes/{id}
Delete a packaging box.

**Auth:** ADMIN or SUPER_ADMIN

**Response:** `204 No Content` — `void`

---

## 18. Admin Shipments

### GET /admin/shipments?page={page}&size={size}
Get all shipments (admin, paginated).

**Auth:** ADMIN or SUPER_ADMIN

**Response:** `200 OK`
```json
{
  "content": [
    {
      "id": "UUID",
      "orderId": "UUID",
      "carrier": "string",
      "trackingNumber": "string",
      "status": "string",
      "estimatedDelivery": "string (ISO datetime)",
      "createdAt": "string (ISO datetime)",
      "updatedAt": "string (ISO datetime)"
    }
  ],
  "totalElements": "number",
  "totalPages": "number",
  "number": "number",
  "size": "number",
  "last": "boolean",
  "first": "boolean",
  "empty": "boolean"
}
```

---

### GET /admin/shipments/{id}
Get a shipment by ID.

**Auth:** ADMIN or SUPER_ADMIN

**Response:** `200 OK` — `Shipment` object

---

### POST /admin/shipments
Create a new shipment record.

**Auth:** ADMIN or SUPER_ADMIN

**Request Body:**
```json
{
  "orderId": "UUID",                    // REQUIRED
  "carrier": "string",                  // REQUIRED
  "trackingNumber": "string",           // REQUIRED
  "status": "string",                   // REQUIRED
  "estimatedDelivery": "string"         // optional, ISO datetime
}
```

**Response:** `201 Created` — `Shipment` object

---

### PATCH /admin/shipments/{id}
Update a shipment.

**Auth:** ADMIN or SUPER_ADMIN

**Request Body:**
```json
{
  "carrier": "string",                  // REQUIRED
  "trackingNumber": "string",           // REQUIRED
  "status": "string",                   // REQUIRED
  "estimatedDelivery": "string"         // optional
}
```

**Response:** `200 OK` — Updated `Shipment` object

---

## 19. Admin Shiprocket

### GET /admin/shiprocket/rates?pickup_postcode={postcode}&delivery_postcode={postcode}&weight={weight}&cod={cod}
Get shipping rates from Shiprocket.

**Auth:** ADMIN or SUPER_ADMIN

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| pickup_postcode | string | ✅ | Pickup postal code |
| delivery_postcode | string | ✅ | Delivery postal code |
| weight | number | ✅ | Weight in kg |
| cod | number | optional, default: 0 | 1 for COD |

**Response:** `200 OK` — Shiprocket API response (as-is, camelCase mapped)

---

### GET /admin/shiprocket/delivery-estimate?pickup_postcode={postcode}&delivery_postcode={postcode}&weight={weight}&courier_id={courierId}
Get estimated delivery date.

**Auth:** ADMIN or SUPER_ADMIN

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| pickup_postcode | string | ✅ | Pickup postal code |
| delivery_postcode | string | ✅ | Delivery postal code |
| weight | number | ✅ | Weight in kg |
| courier_id | number | optional | Specific courier ID |

**Response:** `200 OK` — Delivery estimate data

---

### GET /admin/shiprocket/orders?page={page}&per_page={perPage}
List Shiprocket orders.

**Auth:** ADMIN or SUPER_ADMIN

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | number | optional, default: 1 | Page number |
| per_page | number | optional, default: 20 | Items per page |

**Response:** `200 OK` — Shiprocket orders data

---

### GET /admin/shiprocket/track/{awb}
Track a shipment by AWB (Air Waybill) number.

**Auth:** ADMIN or SUPER_ADMIN

**Response:** `200 OK`
```json
{
  "awb": "string",
  "trackingStatus": "string",
  "estimatedDelivery": "string",
  "events": [
    {
      "date": "string",
      "status": "string",
      "location": "string",
      "description": "string"
    }
  ]
}
```

---

### POST /admin/shiprocket/ship
Assign a courier to a shipment.

**Auth:** ADMIN or SUPER_ADMIN

**Request Body:**
```json
{
  "shipment_id": "number",  // REQUIRED
  "courier_id": "number"    // REQUIRED
}
```

**Response:** `200 OK` — Shiprocket response

---

### POST /admin/shiprocket/schedule-pickup
Schedule a pickup for shipments.

**Auth:** ADMIN or SUPER_ADMIN

**Request Body:**
```json
{
  "shipment_ids": ["number"]  // REQUIRED, array of Shiprocket shipment IDs
}
```

**Response:** `200 OK` — Shiprocket response

---

### GET /admin/shiprocket/label?shipment_ids={ids}
Generate shipping labels for shipments.

**Auth:** ADMIN or SUPER_ADMIN

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| shipment_ids | string | ✅ | Comma-separated Shiprocket shipment IDs |

**Response:** `200 OK` — Label data (PDF URL or base64)

---

### POST /admin/shiprocket/cancel
Cancel Shiprocket orders.

**Auth:** ADMIN or SUPER_ADMIN

**Request Body:**
```json
{
  "shiprocket_order_ids": ["number"]  // REQUIRED
}
```

**Response:** `200 OK` — Cancellation confirmation

---

### GET /admin/shiprocket/pickup-addresses
Get all pickup addresses configured in Shiprocket.

**Auth:** ADMIN or SUPER_ADMIN

**Response:** `200 OK`
```json
[
  {
    "pickupAddress": "string",
    "pickupLocation": "string",
    "isDefault": "boolean"
  }
]
```

---

## 20. Admin Analytics

### GET /admin/analytics
Get dashboard analytics summary.

**Auth:** ADMIN or SUPER_ADMIN

**Response:** `200 OK`
```json
{
  "totalOrders": "number",
  "totalRevenue": "number",
  "totalProducts": "number",
  "totalCustomers": "number",
  "monthlySales": [
    {
      "name": "string",
      "sales": "number"
    }
  ],
  "ordersByStatus": {
    "PENDING": "number",
    "CONFIRMED": "number",
    "PROCESSING": "number",
    "SHIPPED": "number",
    "DELIVERED": "number",
    "CANCELLED": "number"
  }
}
```

---

## 21. Geo, Tax & Currency

### GET /api/tax/calculate?country={countryCode}&amount={amount}&productId={productId}
Calculate tax for a given country and amount.

**Auth:** Not required

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| country | string | ✅ | ISO country code |
| amount | number | ✅ | Base amount |
| productId | UUID | optional | Product ID for product-specific tax |

**Response:** `200 OK`
```json
{
  "taxName": "string",
  "taxRate": "number",
  "taxAmount": "number",
  "cgstAmount": "number",
  "sgstAmount": "number",
  "igstAmount": "number",
  "subtotal": "number",
  "total": "number"
}
```

---

### GET /api/currencies
Get all active currencies.

**Auth:** Not required

**Response:** `200 OK`
```json
[
  {
    "code": "string",
    "name": "string",
    "symbol": "string",
    "exchangeRate": "number",
    "isDefault": "boolean"
  }
]
```

---

### GET /api/geo/detect
Detect country, currency, and tax rate from caller's IP address.

**Auth:** Not required

**Response:** `200 OK`
```json
{
  "countryCode": "string",
  "countryName": "string",
  "currencyCode": "string",
  "currencySymbol": "string",
  "taxRate": "number"
}
```

---

### GET /admin/geo/tax
Get all tax rates (admin).

**Auth:** ADMIN or SUPER_ADMIN

**Response:** `200 OK`
```json
[
  {
    "id": "UUID",
    "productId": "UUID",
    "countryCode": "string",
    "name": "string",
    "rate": "number"
  }
]
```

---

### POST /admin/geo/tax
Create a new tax rate (admin).

**Auth:** ADMIN or SUPER_ADMIN

**Request Body:**
```json
{
  "productId": "UUID",      // optional
  "countryCode": "string",  // REQUIRED
  "name": "string",         // REQUIRED
  "rate": "number"          // REQUIRED
}
```

**Response:** `201 Created` — Tax rate object

---

### PUT /admin/geo/tax/{id}
Update a tax rate (admin).

**Auth:** ADMIN or SUPER_ADMIN

**Request Body:** Same as POST

**Response:** `200 OK` — Updated tax rate object

---

### DELETE /admin/geo/tax/{id}
Delete a tax rate (admin).

**Auth:** ADMIN or SUPER_ADMIN

**Response:** `204 No Content` — `void`

---

### PUT /admin/geo/currencies/{code}
Update currency exchange rate (admin).

**Auth:** ADMIN or SUPER_ADMIN

**Request Body:**
```json
{
  "exchangeRate": "number"  // REQUIRED
}
```

**Response:** `200 OK` — Updated currency object

---

## 22. Admin Management

### GET /admin
Get all admin users (super_admin only).

**Auth:** SUPER_ADMIN only

**Response:** `200 OK`
```json
[
  {
    "id": "UUID",
    "firstName": "string",
    "lastName": "string",
    "email": "string",
    "role": "string",
    "isActive": "boolean"
  }
]
```

---

### POST /admin
Create a new admin user (super_admin only).

**Auth:** SUPER_ADMIN only

**Request Body:**
```json
{
  "firstName": "string",  // REQUIRED
  "lastName": "string",   // REQUIRED
  "email": "string",      // REQUIRED
  "password": "string",  // REQUIRED, min 8 chars
  "role": "string"       // optional, default: "ADMIN"
}
```

**Response:** `201 Created` — Admin user object

---

### DELETE /admin/{id}
Delete an admin user (super_admin only).

**Auth:** SUPER_ADMIN only

**Response:** `204 No Content` — `void`

---

## 23. Webhooks

### POST /api/webhooks/razorpay
Receive payment status updates from Razorpay.

**Auth:** HMAC signature validation (no Bearer token)

**Request Body:** Razorpay webhook payload (JSON)

**Response:** `200 OK` — `void`

---

### POST /api/webhooks/fulfillment
Receive fulfillment/tracking updates from Shiprocket.

**Auth:** HMAC signature validation (no Bearer token)

**Request Body:** Shiprocket webhook payload (JSON)

**Response:** `200 OK` — `void`

---

## Admin Order Management

### GET /admin/orders?page={page}&size={size}
Get all orders (admin, paginated).

**Auth:** ADMIN or SUPER_ADMIN

**Response:** `200 OK`
```json
{
  "content": ["OrderResponse"],
  "totalElements": "number",
  "totalPages": "number",
  "number": "number",
  "size": "number",
  "last": "boolean",
  "first": "boolean",
  "empty": "boolean"
}
```

---

### GET /admin/orders/{id}
Get a specific order by ID (admin).

**Auth:** ADMIN or SUPER_ADMIN

**Response:** `200 OK` — `OrderResponse` object with full details

---

### PATCH /admin/orders/{id}/status
Update order status (admin).

**Auth:** ADMIN or SUPER_ADMIN

**Request Body:**
```json
{
  "status": "string"  // REQUIRED: PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED
}
```

**Response:** `200 OK` — Updated `OrderResponse` object

---

### POST /admin/orders/{id}/push-to-shiprocket
Push an order to Shiprocket (admin).

**Auth:** ADMIN or SUPER_ADMIN

**Response:** `200 OK` — Shiprocket order creation response

---

### POST /admin/orders/push-pending-to-shiprocket
Bulk push all pending orders to Shiprocket (admin).

**Auth:** ADMIN or SUPER_ADMIN

**Response:** `200 OK` — Summary of pushed orders

---

## Admin Payment Management

### GET /admin/payments?status={status}&provider={provider}&page={page}&size={size}
Get all payments (admin, filterable).

**Auth:** ADMIN or SUPER_ADMIN

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| status | string | optional | Filter by payment status |
| provider | string | optional | Filter by provider (razorpay, etc.) |
| page | integer | optional, default: 0 | Page number |
| size | integer | optional, default: 50 | Page size |

**Response:** `200 OK`
```json
{
  "content": [
    {
      "id": "UUID",
      "orderId": "UUID",
      "provider": "string",
      "method": "string",
      "status": "string",
      "amount": "number",
      "currency": "string",
      "providerOrderId": "string",
      "providerPaymentId": "string",
      "failureReason": "string",
      "paidAt": "string (ISO datetime)",
      "createdAt": "string (ISO datetime)"
    }
  ],
  "totalElements": "number",
  "totalPages": "number",
  "number": "number",
  "size": "number"
}
```

---

### GET /admin/payments/{id}
Get a payment by ID (admin).

**Auth:** ADMIN or SUPER_ADMIN

**Response:** `200 OK` — `Payment` object

---

### PATCH /admin/payments/{id}/status
Update payment status (admin).

**Auth:** ADMIN or SUPER_ADMIN

**Request Body:**
```json
{
  "status": "string",            // REQUIRED
  "providerPaymentId": "string", // optional
  "providerSignature": "string", // optional
  "failureReason": "string"     // optional
}
```

**Response:** `200 OK` — Updated `Payment` object

---

## Admin Refunds

### GET /admin/refunds
Get all refund-eligible orders (admin).

**Auth:** ADMIN or SUPER_ADMIN

**Response:** `200 OK` — Array of orders eligible for refund

---

### POST /admin/refunds/{orderId}/process
Process a refund via Razorpay (admin).

**Auth:** ADMIN or SUPER_ADMIN

**Request Body:**
```json
{
  "reason": "string"  // optional
}
```

**Response:** `200 OK` — Refund processing result

---

## Admin Product Management

### GET /admin/products
Get all products (admin view).

**Auth:** ADMIN or SUPER_ADMIN

**Response:** `200 OK` — Array of `Product` objects (includes inactive)

---

### POST /admin/products
Create a new product (admin).

**Auth:** ADMIN or SUPER_ADMIN

**Request Body:**
```json
{
  "productName": "string",             // REQUIRED
  "description": "string",              // optional
  "categoryId": "UUID",                 // REQUIRED
  "productCode": "string",             // optional
  "subCategory": "string",             // optional
  "unit": "string",                    // optional
  "location": "string",                // optional
  "monthlyProductionCapacity": "string", // optional
  "producedBy": "string",              // optional
  "returnApplicable": "boolean",       // optional
  "returnWindow": "string",            // optional
  "tax": "string",                     // optional
  "featured": "boolean",               // optional
  "leadTime": "string",                // optional
  "competitiveAdvantage": "string",    // optional
  "isActive": "boolean",               // optional, default: true
  "shiprocketPickupLocation": "string", // optional
  "variants": ["ProductVariantRequest"],
  "images": ["ProductImageRequest"]
}
```

`ProductVariantRequest`:
```json
{
  "sku": "string",              // REQUIRED
  "sellingPrice": "number",     // REQUIRED, >= 0
  "packaging": "string",        // optional
  "lengthMm": "number",         // optional, >= 0
  "breadthMm": "number",        // optional, >= 0
  "heightMm": "number",         // optional, >= 0
  "unitsPerBox": "number",      // optional, >= 0
  "weightKg": "number",         // optional, >= 0
  "mrp": "number",              // optional
  "bulkOrderPrice": "number",   // optional
  "moq": "number",             // optional
  "cogs": "number",             // optional
  "isActive": "boolean"        // optional, default: true
}
```

`ProductImageRequest`:
```json
{
  "imageUrl": "string",      // REQUIRED
  "isPrimary": "boolean"    // optional, default: false
}
```

**Response:** `201 Created` — Created `Product` object

---

### POST /admin/products/bulk
Bulk create products (admin).

**Auth:** ADMIN or SUPER_ADMIN

**Request Body:** Array of product objects (same as POST)

**Response:** `201 Created` — Array of created `Product` objects

---

### PUT /admin/products/{id}
Update a product (admin).

**Auth:** ADMIN or SUPER_ADMIN

**Request Body:** Same as POST (all fields optional except required ones for updates)

**Response:** `200 OK` — Updated `Product` object

---

### DELETE /admin/products/{id}
Delete a product (admin).

**Auth:** ADMIN or SUPER_ADMIN

**Response:** `204 No Content` — `void`

---

### PATCH /admin/products/{id}/featured
Toggle featured status of a product (admin).

**Auth:** ADMIN or SUPER_ADMIN

**Response:** `200 OK` — Updated `Product` object

---

### PATCH /admin/products/{id}/pickup-location?location={location}
Update the Shiprocket pickup location for a product (admin).

**Auth:** ADMIN or SUPER_ADMIN

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| location | string | ✅ | Pickup location code |

**Response:** `200 OK` — Updated `Product` object

---

### POST /admin/products/images
Add an image to a product (admin).

**Auth:** ADMIN or SUPER_ADMIN

**Request Body:**
```json
{
  "productId": "UUID",       // REQUIRED
  "imageUrl": "string",      // REQUIRED
  "isPrimary": "boolean"     // optional
}
```

**Response:** `201 Created` — Created image object

---

### DELETE /admin/products/images/{id}
Delete a product image (admin).

**Auth:** ADMIN or SUPER_ADMIN

**Response:** `204 No Content` — `void`

---

### POST /admin/products/variants
Create a product variant (admin).

**Auth:** ADMIN or SUPER_ADMIN

**Request Body:** `ProductVariantRequest` object

**Response:** `201 Created` — Created variant object

---

### PUT /admin/products/variants/{id}
Update a product variant (admin).

**Auth:** ADMIN or SUPER_ADMIN

**Request Body:** `ProductVariantRequest` object

**Response:** `200 OK` — Updated variant object

---

### DELETE /admin/products/variants/{id}
Delete a product variant (admin).

**Auth:** ADMIN or SUPER_ADMIN

**Response:** `204 No Content` — `void`

---

## Admin Category Management

### GET /admin/categories
Get all categories (admin).

**Auth:** ADMIN or SUPER_ADMIN

**Response:** `200 OK` — Array of `Category` objects (includes inactive)

---

### POST /admin/categories
Create a new category (admin).

**Auth:** ADMIN or SUPER_ADMIN

**Request Body:**
```json
{
  "name": "string",     // REQUIRED
  "parentId": "UUID",   // optional
  "imageUrl": "string", // optional
  "isActive": "boolean" // optional, default: true
}
```

**Response:** `201 Created` — `Category` object

---

### POST /admin/categories/bulk
Bulk create categories (admin).

**Auth:** ADMIN or SUPER_ADMIN

**Request Body:** Array of category names
```json
["Category 1", "Category 2", "Category 3"]
```

**Response:** `201 Created` — Array of created `Category` objects

---

### PUT /admin/categories/{id}
Update a category (admin).

**Auth:** ADMIN or SUPER_ADMIN

**Request Body:** Same as POST

**Response:** `200 OK` — Updated `Category` object

---

### DELETE /admin/categories/{id}
Delete a category (admin).

**Auth:** ADMIN or SUPER_ADMIN

**Response:** `204 No Content` — `void`

---

## Common Response Shapes

### Pagination Wrapper
Used by all list endpoints that support pagination:
```json
{
  "content": ["T[]"],
  "totalElements": "number",
  "totalPages": "number",
  "number": "number",
  "size": "number",
  "last": "boolean",
  "first": "boolean",
  "empty": "boolean",
  "pageable": {
    "offset": "number",
    "pageNumber": "number",
    "pageSize": "number",
    "paged": "boolean",
    "sort": { "sorted": "boolean", "unsorted": "boolean", "empty": "boolean" }
  }
}
```

### Error Response
```json
{
  "timestamp": "string (ISO datetime)",
  "status": "number",
  "error": "string",
  "message": "string",
  "path": "string"
}
```

---

## Authentication & Authorization

| Role | Access Level |
|------|-------------|
| `user` | Own profile, own orders, cart, wishlist, reviews |
| `admin` | Full access to admin endpoints (except super_admin only) |
| `super_admin` | Full access including admin user management |

### Passing the Token
Include in every authenticated request:
```
Authorization: Bearer <accessToken>
```

The token is a JWT containing user info and role.

### 401 Unauthorized
When the token is missing or expired, the API returns `401 Unauthorized`. The frontend catches this globally and dispatches a `syl:session-expired` custom event.

---

## Rate Limiting
No rate limiting is currently implemented on the API.

---

## Pagination Defaults
| Parameter | Default | Max |
|-----------|---------|-----|
| page | 0 | — |
| size | 10-50 (varies by endpoint) | 100 |