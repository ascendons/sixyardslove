You are a senior Java backend architect.
Build a production-ready, fully reusable Spring Boot backend using:

Java 17

Spring Boot 3.x

Spring Security

JPA (Hibernate)

PostgreSQL

The project must be generic and reusable across multiple e-commerce projects, not hardcoded for a single business.

Base package name:
com.ascendons

🎯 Project Scope

This is an authenticated-only e-commerce backend.

❌ No guest checkout

❌ No email, SMS, OTP, or social login

❌ No frontend code

The backend should support:

Normal consumer orders

Bulk orders (large quantity / wholesale-style orders)

Featured products for homepage or curated sections

🔐 Authentication & Authorization

Implement JWT-based authentication

Login via email + password

Use BCrypt for password hashing

JWT should contain:

user_id

role

Token expiration & refresh token support

Roles

Define roles:

USER

ADMIN

SUPER_ADMIN

Access Control

USER

Manage own profile

Manage cart

Place normal and bulk orders

View own orders

ADMIN

Manage products, categories, variants

Manage inventory

View and process all orders (including bulk)

Manage featured products

SUPER_ADMIN

Manage admins

Manage roles and system-level configuration

Enforce authorization using:

@PreAuthorize

Role-based route protection

🗂️ Architecture Requirements

Use clean layered architecture with reusable module boundaries:

com.ascendons
├── auth
├── user
├── catalog
├── inventory
├── cart
├── order
├── feature
├── admin
├── security
├── config
├── exception
└── util


Follow SOLID principles and DDD-friendly boundaries.

The design must avoid business-specific assumptions.

🧱 Database & ORM Rules

Use the existing PostgreSQL schemas exactly as provided

Do NOT auto-generate tables

Do NOT modify schemas

All entities must:

Use UUID as primary key

Contain:

createdAt

updatedAt

deletedAt

Soft Delete Rules

Never physically delete records

Implement soft deletes using:

@SQLDelete

@Where(clause = "deleted_at IS NULL")

🛡️ Security Implementation

Stateless JWT authentication

Custom JwtAuthenticationFilter

Custom UserDetailsService

Centralized exception handling for:

Invalid credentials

Unauthorized access

Token expiry

📦 Required Core Modules & APIs
Auth

Register user

Login

Refresh token

Users

Get current user profile

Update profile (non-sensitive fields only)

Catalog

Categories CRUD (ADMIN+)

Products CRUD (ADMIN+)

Product variants CRUD (ADMIN+)

Inventory

View inventory (ADMIN+)

Adjust stock levels (ADMIN+)

Cart

View cart (USER)

Add / update / remove cart items (USER)

Orders

Place order (USER)

Support bulk orders:

Large quantities per item

Flag orders as bulk or normal

Inventory validation for bulk quantities

View own orders (USER)

View all orders (ADMIN+)

Update order status (ADMIN+)

Featured Products

Implement APIs for curated/featured products:

Manage feature sections (ADMIN+)

Assign products to feature sections

Ordering / priority support

Optional scheduling (start/end time)

Fetch featured products for storefront use

This must be:

Decoupled from product core logic

Generic enough for homepage, campaigns, or collections

🧪 Quality & Developer Experience

Use Lombok

Use MapStruct for entity ↔ DTO mapping

Add Bean Validation

Return meaningful HTTP status codes

Global exception handler using @ControllerAdvice

⚙️ Configuration

Provide:

application.yml

JWT configuration (secret, expiry, refresh expiry)

CORS configuration

Environment-based profiles (dev, prod)

📁 Deliverables

Generate:

Complete project folder structure

Entity classes mapped to existing schema

Repositories

Services

Controllers

Security configuration

JWT utilities

Example request/response JSON

The project must be:

Ready to import into IntelliJ

Ready to run

Easy to extend for future e-commerce features

🚫 Explicitly Exclude

Email verification

OTP

Third-party authentication

Frontend/UI code

Think like a staff-level backend engineer.
Prioritize reusability, clarity, correctness, and security over shortcuts.