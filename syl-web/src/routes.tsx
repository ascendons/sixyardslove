import { Routes, Route } from "react-router-dom";
import {
  Index,
  About,
  Categories,
  Contact,
  NotFound,
  CategoryDetail,
  Terms,
  Privacy,
  Shipping,
  Returns,
  Refunds,
  GeneralPolicy,
  ProductDetailsPage,
  BulkProductDetails,
  Shop,
  BulkShop,
  AdminDashboard,
  VerifyEmailPage,
  UserDashboard,
  ProfilePage,
  OrdersPage,
  OrderDetailsPage,
  AddressesPage,
  WishlistPage,
  CartPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  CheckoutPage,
} from "@/pages";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

/**
 * Central route config. To add a route:
 * 1. Create the page in src/pages and add to src/pages/index.ts
 * 2. Add <Route path="..." element={<Page />} /> below (keep * above the catch-all)
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/about" element={<About />} />
      <Route path="/categories" element={<Categories />} />
      <Route path="/categories/:categoryId" element={<CategoryDetail />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/product/:id" element={<ProductDetailsPage />} />
      <Route path="/bulk-product/:id" element={<BulkProductDetails />} />
      <Route path="/shop" element={<Shop />} />
      <Route path="/bulk-shop" element={<BulkShop />} />

      {/* Admin Routes */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute requireAdmin>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* Account Routes */}
      <Route
        path="/account"
        element={
          <ProtectedRoute>
            <UserDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/account/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/account/orders"
        element={
          <ProtectedRoute>
            <OrdersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/account/orders/:id"
        element={
          <ProtectedRoute>
            <OrderDetailsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/account/addresses"
        element={
          <ProtectedRoute>
            <AddressesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/account/wishlist"
        element={
          <ProtectedRoute>
            <WishlistPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/cart"
        element={
          <ProtectedRoute>
            <CartPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/checkout"
        element={
          <ProtectedRoute>
            <CheckoutPage />
          </ProtectedRoute>
        }
      />

      {/* Auth Routes */}
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Policy Routes */}
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/shipping" element={<Shipping />} />
      <Route path="/returns" element={<Returns />} />
      <Route path="/policy" element={<GeneralPolicy />} />
      <Route path="/termsandconditions" element={<Terms />} />
      <Route path="/refundspolicy" element={<Refunds />} />

      {/* Add new routes above the catch-all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
