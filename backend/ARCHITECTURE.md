# ECOM Backend - Architecture Index

> Spring Boot 3.2.5 / Java 17 / PostgreSQL / JPA-Hibernate
> Base package: `com.ascendons` | Port: `8081`

---

## Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack & Dependencies](#tech-stack--dependencies)
- [Module Map](#module-map)
- [File Index](#file-index)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Security & Filter Chain](#security--filter-chain)
- [Cross-Cutting Patterns](#cross-cutting-patterns)
- [Configuration](#configuration)

---

## Project Overview

A production-ready, modular e-commerce REST API with 12 domain modules and 148 Java source files. Supports user authentication (JWT), product catalog with variants, shopping cart, order placement with inventory deduction, featured product sections, admin management, and international orders (multi-currency, IP geolocation, country-level tax).

```
src/main/java/com/ascendons/
  EcomApplication.java            # @SpringBootApplication entry point
  admin/                          # Admin user management & audit logs
  auth/                           # Registration, login, token refresh
  cart/                           # Shopping cart CRUD
  catalog/                        # Categories, products, variants, images
  config/                         # CORS, OpenAPI/Swagger
  exception/                      # Global error handling
  feature/                        # Featured product sections (homepage)
  geo/                            # Geolocation, currencies, tax rates
  inventory/                      # Stock levels & movement tracking
  order/                          # Orders, payments, refunds, shipments
  security/                       # JWT filter, UserDetailsService, SecurityConfig
  user/                           # User profiles & addresses
  util/                           # (reserved)

src/main/resources/
  application.yml                 # Main config (JWT, CORS, geo)
  application-dev.yml             # Dev profile (local PG, DEBUG logging)
  application-prod.yml            # Prod profile (env vars, HikariCP tuning)
  schema.sql                      # Core DDL (20 tables)
  schema-international.sql        # Geo DDL (3 tables + ALTER orders + seed data)
```

---

## Tech Stack & Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| Spring Boot Starter Web | 3.2.5 | REST controllers, embedded Tomcat |
| Spring Boot Starter Data JPA | 3.2.5 | Hibernate 6.4, Spring Data repos |
| Spring Boot Starter Security | 3.2.5 | Auth filter chain, method security |
| Spring Boot Starter Validation | 3.2.5 | `@Valid` / `@NotNull` request validation |
| PostgreSQL Driver | (managed) | JDBC runtime driver |
| jjwt-api / impl / jackson | 0.12.5 | JWT creation & validation |
| Lombok | (managed) | Boilerplate reduction |
| MapStruct | 1.5.5.Final | DTO-entity mapping (+ lombok-mapstruct-binding 0.2.0) |
| springdoc-openapi-starter-webmvc-ui | 2.5.0 | Swagger UI at `/swagger-ui/index.html` |
| MaxMind GeoIP2 | 4.2.0 | IP-to-country resolution (GeoLite2-Country.mmdb) |

---

## Module Map

### 1. `auth` (6 files)

Authentication: register, login, JWT token refresh.

| Layer | File | Description |
|-------|------|-------------|
| Controller | `AuthController.java` | `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/refresh` |
| DTO | `RegisterRequest.java` | firstName, lastName, email, phone, password |
| DTO | `LoginRequest.java` | email, password |
| DTO | `RefreshTokenRequest.java` | refreshToken |
| DTO | `AuthResponse.java` | accessToken, refreshToken, userId, email, role |
| Service | `AuthService.java` | `register()`, `login()`, `refresh()` &mdash; creates User + UserAuth, issues JWT pair |

### 2. `user` (15 files)

User profiles and addresses.

| Layer | File | Description |
|-------|------|-------------|
| Controller | `UserController.java` | `GET /api/users/me`, `PUT /api/users/me`, `GET/POST/PUT/DELETE /api/users/me/addresses/**` |
| DTO | `UserProfileResponse.java` | id, firstName, lastName, email, phone, role |
| DTO | `UpdateProfileRequest.java` | firstName, lastName, phone |
| DTO | `UserAddressRequest.java` | label, addressLine1, city, state, country, postalCode, isDefault |
| DTO | `UserAddressResponse.java` | all address fields + id |
| Entity | `User.java` | Table `users` &mdash; UUID PK, email (unique), phone (unique), role (enum), isActive |
| Entity | `UserAuth.java` | Table `user_auth` &mdash; PK = userId (MapsId), passwordHash, lastLoginAt |
| Entity | `UserAddress.java` | Table `user_addresses` &mdash; UUID PK, ManyToOne user |
| Entity | `Role.java` | Enum: `USER`, `ADMIN`, `SUPER_ADMIN` |
| Mapper | `UserMapper.java` | User &harr; UserProfileResponse |
| Mapper | `UserAddressMapper.java` | UserAddress &harr; UserAddressResponse/Request |
| Repository | `UserRepository.java` | `findByEmail()`, `existsByEmail()` |
| Repository | `UserAuthRepository.java` | standard JPA |
| Repository | `UserAddressRepository.java` | `findByUserId()`, `findByUserIdAndIsDefaultTrue()` |
| Service | `UserService.java` | `getProfile()`, `updateProfile()`, address CRUD, `setDefaultAddress()` |

### 3. `catalog` (28 files)

Product catalog: categories, products, variants, images.

| Layer | File | Description |
|-------|------|-------------|
| **Controllers** | | |
| Controller | `CategoryController.java` | `GET /api/categories` (public), `POST/PUT/DELETE` (ADMIN) |
| Controller | `ProductController.java` | `GET /api/products`, `GET /api/products/{id}` (public), CRUD (ADMIN) |
| Controller | `ProductVariantController.java` | `GET /api/products/{id}/variants` (public), CRUD (ADMIN) |
| Controller | `ProductImageController.java` | `GET /api/products/{id}/images` (public), CRUD (ADMIN) |
| **DTOs** | | |
| DTO | `CategoryRequest.java` | name, parentId, isActive |
| DTO | `CategoryResponse.java` | id, name, parentId, isActive |
| DTO | `ProductRequest.java` | name, description, categoryId, isActive |
| DTO | `ProductResponse.java` | id, name, description, categoryId, isActive, variants, images |
| DTO | `ProductVariantRequest.java` | sku, price, isActive |
| DTO | `ProductVariantResponse.java` | id, sku, price, isActive |
| DTO | `ProductImageRequest.java` | imageUrl, isPrimary |
| DTO | `ProductImageResponse.java` | id, imageUrl, isPrimary |
| **Entities** | | |
| Entity | `Category.java` | Table `categories` &mdash; UUID PK, self-referencing parent, OneToMany children + products |
| Entity | `Product.java` | Table `products` &mdash; UUID PK, ManyToOne category, OneToMany variants + images |
| Entity | `ProductVariant.java` | Table `product_variants` &mdash; UUID PK, sku (unique), price, ManyToOne product |
| Entity | `ProductImage.java` | Table `product_images` &mdash; UUID PK, imageUrl, isPrimary, ManyToOne product |
| **Mappers** | | |
| Mapper | `CategoryMapper.java` | Category &harr; DTO |
| Mapper | `ProductMapper.java` | Product &harr; DTO (uses VariantMapper, ImageMapper) |
| Mapper | `ProductVariantMapper.java` | Variant &harr; DTO |
| Mapper | `ProductImageMapper.java` | Image &harr; DTO |
| **Repositories** | | |
| Repository | `CategoryRepository.java` | `findByParentIdIsNull()` |
| Repository | `ProductRepository.java` | `findByCategoryId()`, `findByIsActiveTrue()` |
| Repository | `ProductVariantRepository.java` | `findByProductId()` |
| Repository | `ProductImageRepository.java` | `findByProductId()` |
| **Services** | | |
| Service | `CategoryService.java` | CRUD + `getRootCategories()` |
| Service | `ProductService.java` | CRUD + search/filter, `getActiveProducts()` |
| Service | `ProductVariantService.java` | CRUD scoped to product |
| Service | `ProductImageService.java` | CRUD scoped to product |

### 4. `inventory` (11 files)

Stock tracking and movement history.

| Layer | File | Description |
|-------|------|-------------|
| Controller | `InventoryController.java` | `GET /api/inventory/{variantId}`, `POST /api/inventory/adjust` (ADMIN) |
| DTO | `InventoryResponse.java` | productVariantId, quantity |
| DTO | `AdjustStockRequest.java` | productVariantId, changeQty, reason |
| DTO | `InventoryMovementResponse.java` | id, variantId, changeQty, reason, createdAt |
| Entity | `Inventory.java` | Table `inventory` &mdash; PK = productVariantId (MapsId), quantity |
| Entity | `InventoryMovement.java` | Table `inventory_movements` &mdash; UUID PK, changeQty, reason |
| Mapper | `InventoryMapper.java` | Inventory &harr; DTO |
| Mapper | `InventoryMovementMapper.java` | Movement &harr; DTO |
| Repository | `InventoryRepository.java` | standard JPA (PK = variant ID) |
| Repository | `InventoryMovementRepository.java` | `findByProductVariantId()` |
| Service | `InventoryService.java` | `getStock()`, `adjustStock()`, `getMovements()` |

### 5. `cart` (11 files)

Shopping cart per user.

| Layer | File | Description |
|-------|------|-------------|
| Controller | `CartController.java` | `GET /api/cart`, `POST /api/cart/items`, `PUT /api/cart/items/{id}`, `DELETE /api/cart/items/{id}`, `DELETE /api/cart` |
| DTO | `CartResponse.java` | id, userId, items, totalAmount, currency |
| DTO | `CartItemRequest.java` | productVariantId, quantity |
| DTO | `CartItemResponse.java` | id, variantId, sku, price, quantity |
| Entity | `Cart.java` | Table `carts` &mdash; UUID PK, ManyToOne user, OneToMany items |
| Entity | `CartItem.java` | Table `cart_items` &mdash; UUID PK, ManyToOne cart + productVariant, quantity |
| Mapper | `CartMapper.java` | Cart &harr; CartResponse (ignores totalAmount, currency &mdash; set manually) |
| Mapper | `CartItemMapper.java` | CartItem &harr; CartItemResponse |
| Repository | `CartRepository.java` | `findByUserId()` |
| Repository | `CartItemRepository.java` | `findByCartId()`, `findByCartIdAndProductVariantId()` |
| Service | `CartService.java` | `getCart()` (currency-aware), `addItem()`, `updateItem()`, `removeItem()`, `clearCart()` |

### 6. `order` (19 files)

Order lifecycle: placement, status updates, payments, refunds, shipments.

| Layer | File | Description |
|-------|------|-------------|
| Controller | `OrderController.java` | `POST /api/orders`, `GET /api/orders`, `GET /api/orders/{id}`, `PATCH /api/orders/{id}/status` (ADMIN) |
| DTO | `PlaceOrderRequest.java` | addressId, isBulk, currencyCode (optional) |
| DTO | `OrderResponse.java` | id, userId, addressId, status, isBulk, totalAmount, currency, exchangeRate, taxAmount, taxRate, items, createdAt |
| DTO | `OrderItemResponse.java` | id, variantId, sku, price, quantity |
| DTO | `UpdateOrderStatusRequest.java` | status |
| Entity | `Order.java` | Table `orders` &mdash; UUID PK, status (enum), totalAmount, currency, exchangeRate, taxAmount, taxRate |
| Entity | `OrderItem.java` | Table `order_items` &mdash; UUID PK, ManyToOne order + productVariant, price, quantity |
| Entity | `OrderStatus.java` | Enum: `PENDING`, `CONFIRMED`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`, `REFUNDED` |
| Entity | `Payment.java` | Table `payments` &mdash; UUID PK, ManyToOne order, provider, status, amount |
| Entity | `Refund.java` | Table `refunds` &mdash; UUID PK, ManyToOne payment, amount, reason |
| Entity | `Shipment.java` | Table `shipments` &mdash; UUID PK, ManyToOne order, partner, trackingNumber |
| Mapper | `OrderMapper.java` | Order &harr; OrderResponse |
| Mapper | `OrderItemMapper.java` | OrderItem &harr; OrderItemResponse |
| Repository | `OrderRepository.java` | `findByUserId(pageable)` |
| Repository | `OrderItemRepository.java` | standard JPA |
| Repository | `PaymentRepository.java` | standard JPA |
| Repository | `RefundRepository.java` | standard JPA |
| Repository | `ShipmentRepository.java` | standard JPA |
| Service | `OrderService.java` | `placeOrder()` (validates cart, deducts inventory, converts currency, calculates tax), `getUserOrders()`, `getAllOrders()`, `getOrderById()`, `updateOrderStatus()` |

### 7. `feature` (14 files)

Homepage featured product sections with time-based scheduling.

| Layer | File | Description |
|-------|------|-------------|
| Controller | `FeatureSectionController.java` | `GET /api/featured/sections` (public), CRUD (ADMIN) |
| Controller | `FeaturedProductController.java` | `GET /api/featured/sections/{id}/products` (public), CRUD (ADMIN) |
| DTO | `FeatureSectionRequest.java` | name, description, isActive |
| DTO | `FeatureSectionResponse.java` | id, name, description, isActive |
| DTO | `FeaturedProductRequest.java` | productId, displayOrder, startsAt, endsAt, isActive |
| DTO | `FeaturedProductResponse.java` | id, sectionId, productId, displayOrder, startsAt, endsAt, isActive |
| Entity | `FeatureSection.java` | Table `feature_sections` &mdash; UUID PK, name, description, OneToMany featuredProducts |
| Entity | `FeaturedProduct.java` | Table `featured_products` &mdash; UUID PK, ManyToOne section + product, displayOrder, startsAt/endsAt, unique(section,product) |
| Mapper | `FeatureSectionMapper.java` | FeatureSection &harr; DTO |
| Mapper | `FeaturedProductMapper.java` | FeaturedProduct &harr; DTO |
| Repository | `FeatureSectionRepository.java` | `findByIsActiveTrue()` |
| Repository | `FeaturedProductRepository.java` | `findByFeatureSectionId()` |
| Service | `FeatureSectionService.java` | CRUD + `getActiveSections()` |
| Service | `FeaturedProductService.java` | CRUD scoped to section |

### 8. `admin` (9 files)

Admin user creation and audit logging.

| Layer | File | Description |
|-------|------|-------------|
| Controller | `AdminController.java` | `GET /admin/list` (SUPER_ADMIN), `POST /admin/create` (SUPER_ADMIN), `DELETE /admin/{id}` (SUPER_ADMIN) |
| DTO | `CreateAdminRequest.java` | firstName, lastName, email, password, role |
| DTO | `AdminResponse.java` | id, email, createdAt |
| Entity | `Admin.java` | Table `admins` &mdash; UUID PK, email (unique). Metadata-only; admins auth via `users` + `user_auth` |
| Entity | `AuditLog.java` | Table `audit_logs` &mdash; UUID PK, actorId, actorType, action, entity, entityId |
| Mapper | `AdminMapper.java` | Admin &harr; AdminResponse |
| Repository | `AdminRepository.java` | standard JPA |
| Repository | `AuditLogRepository.java` | standard JPA |
| Service | `AdminService.java` | `getAllAdmins()`, `createAdmin()` (creates User + UserAuth + Admin), `deleteAdmin()` |

### 9. `geo` (20 files)

International support: IP geolocation, multi-currency, country tax rates.

| Layer | File | Description |
|-------|------|-------------|
| **Context & Filter** | | |
| Context | `GeoContext.java` | Request-scoped bean: countryCode, countryName, currencyCode, ipAddress |
| Filter | `GeoLocationFilter.java` | `OncePerRequestFilter` after JWT filter &mdash; resolves IP to country/currency, populates GeoContext |
| **Controllers** | | |
| Controller | `GeoController.java` | `GET /api/geo/detect` (public) &mdash; returns detected country, currency, tax rate |
| Controller | `CurrencyController.java` | `GET /api/currencies` (public), `PUT /api/currencies/{code}` (ADMIN) |
| Controller | `TaxRateController.java` | `GET /api/tax/calculate?country=XX&amount=100` (public), `GET/POST/PUT/DELETE /api/tax/**` (ADMIN) |
| **DTOs** | | |
| DTO | `GeoLocation.java` | countryCode, countryName |
| DTO | `GeoDetectResponse.java` | countryCode, countryName, currencyCode, currencySymbol, taxRate |
| DTO | `CurrencyResponse.java` | code, name, symbol, exchangeRate, isBase |
| DTO | `TaxRateRequest.java` | countryCode, name, rate |
| DTO | `TaxRateResponse.java` | id, countryCode, name, rate, isActive |
| DTO | `TaxBreakdown.java` | taxName, taxRate, taxAmount, subtotal, total |
| **Entities** | | |
| Entity | `Currency.java` | Table `currencies` &mdash; PK = `code` (TEXT), exchangeRate, isBase, isActive |
| Entity | `CountryCurrencyMap.java` | Table `country_currency_map` &mdash; PK = `country_code` (TEXT), currencyCode |
| Entity | `TaxRate.java` | Table `tax_rates` &mdash; UUID PK, countryCode, name, rate, isActive |
| **Repositories** | | |
| Repository | `CurrencyRepository.java` | `findByIsBaseTrue()`, `findByIsActiveTrue()` |
| Repository | `CountryCurrencyMapRepository.java` | `findByCountryCode()` |
| Repository | `TaxRateRepository.java` | `findByCountryCodeAndIsActiveTrue()` |
| **Services** | | |
| Service | `GeoLocationService.java` | Loads GeoLite2-Country.mmdb, `resolve(ip)` &rarr; GeoLocation; defaults to configured country for private IPs |
| Service | `CurrencyService.java` | `getBaseCurrency()`, `getCurrencyByCode()`, `getCurrencyForCountry()`, `convert(amount, from, to)`, `getAllActiveCurrencies()` |
| Service | `TaxService.java` | `calculateTax(countryCode, subtotal)` &rarr; TaxBreakdown, `getEffectiveTaxRate(countryCode)` |

### 10. `security` (4 files)

JWT authentication and authorization infrastructure.

| File | Description |
|------|-------------|
| `SecurityConfig.java` | Filter chain: CSRF disabled, stateless sessions, public/protected endpoint rules, JWT filter + GeoLocation filter registration |
| `JwtAuthenticationFilter.java` | `OncePerRequestFilter` &mdash; extracts Bearer token, validates, sets `SecurityContextHolder` |
| `JwtUtil.java` | `generateAccessToken(userId, role)`, `generateRefreshToken(userId)`, `extractClaims()`, `isTokenValid()` |
| `CustomUserDetailsService.java` | `loadUserByUsername(idOrEmail)` &mdash; loads User from DB, returns Spring Security `UserDetails` with `ROLE_` authority |

### 11. `config` (2 files)

| File | Description |
|------|-------------|
| `CorsConfig.java` | Configurable CORS via `app.cors.*` properties |
| `OpenApiConfig.java` | Swagger/OpenAPI with Bearer JWT security scheme |

### 12. `exception` (8 files)

| File | HTTP Status | Description |
|------|-------------|-------------|
| `GlobalExceptionHandler.java` | &mdash; | `@RestControllerAdvice` routing all exceptions to JSON responses |
| `ErrorResponse.java` | &mdash; | Standard error envelope: `{ status, message, errors?, timestamp }` |
| `ResourceNotFoundException.java` | 404 | Entity not found by field |
| `BadRequestException.java` | 400 | Invalid request data |
| `UnauthorizedException.java` | 401 | Authentication failure |
| `ForbiddenException.java` | 403 | Insufficient permissions |
| `ConflictException.java` | 409 | Duplicate resource (e.g. email) |
| `InsufficientStockException.java` | 422 | Not enough inventory |

---

## Database Schema

### Tables (23 total)

```
                    ┌──────────────┐
                    │    users     │
                    │  (UUID PK)   │
                    └──────┬───────┘
                 ┌─────────┼──────────┐
                 v         v          v
          ┌──────────┐ ┌────────┐ ┌──────────────┐
          │user_auth │ │ carts  │ │user_addresses│
          │(MapsId)  │ │(UUID)  │ │  (UUID PK)   │
          └──────────┘ └───┬────┘ └──────────────┘
                           v
                     ┌───────────┐
                     │cart_items │
                     │ (UUID PK) │
                     └─────┬─────┘
                           │ references
                           v
┌────────────┐    ┌──────────────────┐    ┌───────────────┐
│ categories │───>│    products      │───>│product_images │
│ (UUID PK)  │    │    (UUID PK)     │    │  (UUID PK)    │
│ self-ref   │    └────────┬─────────┘    └───────────────┘
└────────────┘             v
                  ┌──────────────────┐    ┌─────────────────────┐
                  │product_variants  │───>│     inventory        │
                  │   (UUID PK)      │    │(MapsId = variant PK) │
                  └────────┬─────────┘    └─────────────────────┘
                           │                        │
                           v                        v
                  ┌──────────────────┐    ┌─────────────────────┐
                  │   order_items    │    │inventory_movements  │
                  │   (UUID PK)      │    │    (UUID PK)        │
                  └────────┬─────────┘    └─────────────────────┘
                           v
                     ┌───────────┐
                     │  orders   │
                     │ (UUID PK) │
                     └─────┬─────┘
              ┌────────────┼────────────┐
              v            v            v
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │ payments │ │shipments │ │          │
        │(UUID PK) │ │(UUID PK) │ │          │
        └────┬─────┘ └──────────┘ │          │
             v                     │          │
        ┌──────────┐              │          │
        │ refunds  │              │          │
        │(UUID PK) │              │          │
        └──────────┘              │          │

┌──────────────────┐  ┌──────────────────┐  ┌───────────────────┐
│feature_sections  │  │featured_products │  │     admins        │
│   (UUID PK)      │──│   (UUID PK)      │  │   (UUID PK)       │
└──────────────────┘  └──────────────────┘  └───────────────────┘

┌──────────────────┐
│   audit_logs     │
│   (UUID PK)      │
└──────────────────┘

┌──────────────────┐  ┌─────────────────────┐  ┌──────────────────┐
│   currencies     │  │ country_currency_map │  │   tax_rates      │
│  (TEXT PK=code)  │←─│  (TEXT PK=country)   │  │   (UUID PK)      │
└──────────────────┘  └─────────────────────┘  └──────────────────┘
```

### Column Details by Table

| Table | PK | Key Columns | FK References |
|-------|-----|------------|---------------|
| `users` | UUID `id` | email (unique), phone (unique), role, is_active | &mdash; |
| `user_auth` | UUID `user_id` | password_hash, last_login_at | users(id) |
| `user_addresses` | UUID `id` | label, address_line1, city, state, country, postal_code, is_default | users(id) |
| `categories` | UUID `id` | name, is_active | categories(id) self-ref |
| `products` | UUID `id` | name, description, is_active | categories(id) |
| `product_variants` | UUID `id` | sku (unique), price | products(id) |
| `product_images` | UUID `id` | image_url, is_primary | products(id) |
| `inventory` | UUID `product_variant_id` | quantity | product_variants(id) |
| `inventory_movements` | UUID `id` | change_qty, reason | product_variants(id) |
| `carts` | UUID `id` | &mdash; | users(id) |
| `cart_items` | UUID `id` | quantity | carts(id), product_variants(id) |
| `orders` | UUID `id` | status, is_bulk, total_amount, currency, exchange_rate, tax_amount, tax_rate | users(id), user_addresses(id) |
| `order_items` | UUID `id` | price, quantity | orders(id), product_variants(id) |
| `payments` | UUID `id` | provider, status, amount | orders(id) |
| `refunds` | UUID `id` | amount, reason | payments(id) |
| `shipments` | UUID `id` | partner, tracking_number | orders(id) |
| `feature_sections` | UUID `id` | name, description, is_active | &mdash; |
| `featured_products` | UUID `id` | display_order, starts_at, ends_at, is_active | feature_sections(id), products(id) |
| `admins` | UUID `id` | email (unique) | &mdash; |
| `audit_logs` | UUID `id` | actor_id, actor_type, action, entity, entity_id | &mdash; |
| `currencies` | TEXT `code` | name, symbol, exchange_rate, is_base, is_active | &mdash; |
| `country_currency_map` | TEXT `country_code` | currency_code | currencies(code) |
| `tax_rates` | UUID `id` | country_code, name, rate, is_active | &mdash; |

> Every table has `created_at`, `updated_at`, `deleted_at` (TIMESTAMPTZ) columns for audit and soft delete.

---

## API Endpoints

### Public (no auth required)

| Method | Path | Module | Description |
|--------|------|--------|-------------|
| POST | `/api/auth/register` | auth | Register new user |
| POST | `/api/auth/login` | auth | Login, returns JWT pair |
| POST | `/api/auth/refresh` | auth | Refresh access token |
| GET | `/api/categories/**` | catalog | Browse categories |
| GET | `/api/products/**` | catalog | Browse products, variants, images |
| GET | `/api/featured/**` | feature | Featured sections & products |
| GET | `/api/geo/detect` | geo | Detect country/currency/tax from IP |
| GET | `/api/currencies` | geo | List active currencies |
| GET | `/api/tax/calculate` | geo | Calculate tax: `?country=XX&amount=100` |

### Authenticated (Bearer JWT required)

| Method | Path | Role | Module | Description |
|--------|------|------|--------|-------------|
| GET | `/api/users/me` | USER+ | user | Get profile |
| PUT | `/api/users/me` | USER+ | user | Update profile |
| GET | `/api/users/me/addresses` | USER+ | user | List addresses |
| POST | `/api/users/me/addresses` | USER+ | user | Add address |
| PUT | `/api/users/me/addresses/{id}` | USER+ | user | Update address |
| DELETE | `/api/users/me/addresses/{id}` | USER+ | user | Delete address |
| GET | `/api/cart` | USER+ | cart | View cart (currency-aware) |
| POST | `/api/cart/items` | USER+ | cart | Add to cart |
| PUT | `/api/cart/items/{id}` | USER+ | cart | Update cart item quantity |
| DELETE | `/api/cart/items/{id}` | USER+ | cart | Remove cart item |
| DELETE | `/api/cart` | USER+ | cart | Clear cart |
| POST | `/api/orders` | USER+ | order | Place order (currency conversion + tax) |
| GET | `/api/orders` | USER+ | order | List user's orders |
| GET | `/api/orders/{id}` | USER+ | order | Get order details |

### Admin (ADMIN or SUPER_ADMIN role)

| Method | Path | Role | Module | Description |
|--------|------|------|--------|-------------|
| POST | `/api/categories` | ADMIN+ | catalog | Create category |
| PUT | `/api/categories/{id}` | ADMIN+ | catalog | Update category |
| DELETE | `/api/categories/{id}` | ADMIN+ | catalog | Delete category |
| POST | `/api/products` | ADMIN+ | catalog | Create product |
| PUT | `/api/products/{id}` | ADMIN+ | catalog | Update product |
| DELETE | `/api/products/{id}` | ADMIN+ | catalog | Delete product |
| POST | `/api/products/{id}/variants` | ADMIN+ | catalog | Add variant |
| PUT | `/api/products/{pid}/variants/{vid}` | ADMIN+ | catalog | Update variant |
| DELETE | `/api/products/{pid}/variants/{vid}` | ADMIN+ | catalog | Delete variant |
| POST | `/api/products/{id}/images` | ADMIN+ | catalog | Add image |
| DELETE | `/api/products/{pid}/images/{iid}` | ADMIN+ | catalog | Delete image |
| GET | `/api/inventory/{variantId}` | ADMIN+ | inventory | View stock |
| POST | `/api/inventory/adjust` | ADMIN+ | inventory | Adjust stock |
| PATCH | `/api/orders/{id}/status` | ADMIN+ | order | Update order status |
| POST | `/api/featured/sections` | ADMIN+ | feature | Create section |
| PUT | `/api/featured/sections/{id}` | ADMIN+ | feature | Update section |
| DELETE | `/api/featured/sections/{id}` | ADMIN+ | feature | Delete section |
| POST | `/api/featured/sections/{id}/products` | ADMIN+ | feature | Add featured product |
| PUT | `/api/featured/products/{id}` | ADMIN+ | feature | Update featured product |
| DELETE | `/api/featured/products/{id}` | ADMIN+ | feature | Remove featured product |
| PUT | `/api/currencies/{code}` | ADMIN+ | geo | Update exchange rate |
| GET | `/api/tax` | ADMIN+ | geo | List all tax rates |
| POST | `/api/tax` | ADMIN+ | geo | Create tax rate |
| PUT | `/api/tax/{id}` | ADMIN+ | geo | Update tax rate |
| DELETE | `/api/tax/{id}` | ADMIN+ | geo | Delete tax rate |

### Super Admin Only

| Method | Path | Module | Description |
|--------|------|--------|-------------|
| GET | `/admin/list` | admin | List all admins |
| POST | `/admin/create` | admin | Create admin (User + UserAuth + Admin) |
| DELETE | `/admin/{id}` | admin | Soft-delete admin |

---

## Security & Filter Chain

```
Request
  │
  ▼
CorsFilter (Spring bean from CorsConfig)
  │
  ▼
JwtAuthenticationFilter (before UsernamePasswordAuthenticationFilter)
  │  Extracts "Authorization: Bearer <token>"
  │  Validates JWT, sets SecurityContextHolder
  │
  ▼
GeoLocationFilter (after JwtAuthenticationFilter)
  │  Extracts IP from X-Forwarded-For or remoteAddr
  │  Resolves IP → country (MaxMind GeoLite2)
  │  Looks up currency via country_currency_map
  │  Populates request-scoped GeoContext bean
  │
  ▼
Spring Security authorization rules
  │  Public endpoints: /api/auth/**, /api/geo/**, /api/currencies, etc.
  │  Authenticated: everything else
  │  Method-level: @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
  │
  ▼
Controller → Service → Repository
```

**JWT structure:**
- Access token (1 hour): subject = userId, claim "role" = role name
- Refresh token (7 days): subject = userId only
- Signed with HMAC-SHA (Base64-encoded secret from `app.jwt.secret`)

---

## Cross-Cutting Patterns

### Entity conventions
- All JPA entities use `@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder`
- UUID primary keys (auto-generated in `@PrePersist`) &mdash; except `Currency` (TEXT PK) and `CountryCurrencyMap` (TEXT PK)
- Soft delete: `@SQLDelete(sql = "UPDATE ... SET deleted_at = NOW() WHERE id = ?")` + `@Where(clause = "deleted_at IS NULL")`
- Audit fields: `created_at`, `updated_at` (OffsetDateTime), managed via `@PrePersist` / `@PreUpdate`
- Lazy-loaded relationships: `@ManyToOne(fetch = FetchType.LAZY)`

### Mapper pattern (MapStruct)
- All mappers use `@Mapper(componentModel = "spring")`
- Entity &rarr; Response DTO and Request DTO &rarr; Entity
- Some mappers compose others via `uses = { ... }`
- Compilation requires `lombok-mapstruct-binding` in annotation processor paths

### Service pattern
- `@Service @RequiredArgsConstructor` for constructor injection
- `@Transactional` on write operations
- Throw domain exceptions (ResourceNotFoundException, BadRequestException, etc.)
- Never return entities directly &mdash; always map to DTOs

### Soft delete caveat
- Spring Data derived `deleteByXxx()` methods do **not** trigger `@SQLDelete`
- Must use `repository.delete(entity)` for soft delete to work
- `@Where` clause automatically filters soft-deleted rows from all queries

---

## Configuration

### `application.yml` (main)

```yaml
spring:
  application.name: ecom-backend
  profiles.active: dev
  jpa:
    hibernate.ddl-auto: none
    show-sql: false

server:
  port: 8081

app:
  jwt:
    secret: ${JWT_SECRET}
    expiration-ms: 3600000          # 1 hour
    refresh-expiration-ms: 604800000 # 7 days
  geo:
    db-path: ${GEOIP_DB_PATH:classpath:GeoLite2-Country.mmdb}
    default-country: IN
  cors:
    allowed-origins: ${CORS_ORIGINS:http://localhost:3000,http://localhost:4200}
    allowed-methods: GET,POST,PUT,PATCH,DELETE,OPTIONS
    allowed-headers: "*"
    allow-credentials: true
```

### `application-dev.yml`

- Datasource: `jdbc:postgresql://localhost:5432/ecom_dev`
- Logging: `com.ascendons: DEBUG`, `org.springframework.security: DEBUG`

### `application-prod.yml`

- Datasource: env vars `$DB_URL`, `$DB_USERNAME`, `$DB_PASSWORD`
- HikariCP: max-pool 20, min-idle 5
- Logging: `com.ascendons: INFO`, `org.springframework.security: WARN`

### Build

```bash
# Must use JDK 17 (system default may differ)
JAVA_HOME=$(/usr/libexec/java_home -v 17) mvn compile
JAVA_HOME=$(/usr/libexec/java_home -v 17) mvn spring-boot:run
```

Swagger UI: `http://localhost:8081/swagger-ui/index.html`
