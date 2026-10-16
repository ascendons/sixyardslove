import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Menu,
  X,
  Search,
  ShoppingBag,
  User,
  Heart,
  Store,
  Sparkle,
  Gift,
  Home,
  Info,
  PhoneCall,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.png";
import { AuthDialog } from "../auth/AuthDialog";
import { authService } from "@/services/authService";
import { useQuery } from "@tanstack/react-query";
import { cartService } from "@/services/cartService";
import { wishlistService } from "@/services/wishlistService";
import { SearchSuggestions } from "./SearchSuggestions";
import { Rangoli } from "@/components/common/Rangoli";

const tickerItems = [
  "Free shipping on orders across India",
  "Handpicked sarees for every occasion",
  "Easy returns & secure payments",
];

const topNavLinks = [
  { name: "Home", href: "/", icon: Home },
  { name: "Shop", href: "/shop", icon: Store },
  { name: "Bulk Orders", href: "/bulk-shop", icon: Gift },
  { name: "About", href: "/about", icon: Info },
  { name: "Contact", href: "/contact", icon: PhoneCall },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const location = useLocation();
  const isAuthenticated = authService.isAuthenticated();

  const { data: cart } = useQuery({
    queryKey: ["cart"],
    queryFn: () => cartService.getCart(),
    enabled: isAuthenticated,
  });

  const { data: wishlist } = useQuery({
    queryKey: ["wishlist"],
    queryFn: () => wishlistService.getWishlist(),
    enabled: isAuthenticated,
  });

  const cartCount =
    cart?.items.reduce((acc, item) => acc + item.quantity, 0) || 0;
  const wishlistCount = wishlist?.items.length || 0;

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("login") === "true") {
      setIsAuthDialogOpen(true);
      // Clean up the URL
      const newParams = new URLSearchParams(location.search);
      newParams.delete("login");
      const newSearch = newParams.toString();
      const newPath = location.pathname + (newSearch ? `?${newSearch}` : "");
      window.history.replaceState({}, "", newPath);
    }
  }, [location, isAuthenticated]);

  return (
    <>
      <header className="sticky top-0 z-[1001] bg-ivory/90 backdrop-blur-xl border-b border-border/60 transition-all duration-300">
        {/* Announcement bar */}
        <div className="w-full h-9 bg-forest flex items-center overflow-hidden ticker-container">
          <div className="flex whitespace-nowrap ticker-content">
            {[...tickerItems, ...tickerItems, ...tickerItems].map((item, index) => (
              <span
                key={index}
                className="mx-10 text-ochre-light text-[11px] font-normal tracking-[0.25em] uppercase flex items-center gap-3"
              >
                <Sparkle className="h-3 w-3 text-ochre-light" />
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* Main row: logo / search / actions */}
        <nav className="container-institutional" aria-label="Global">
          <div className="flex items-center justify-between gap-4 md:gap-10 py-3">
            {/* Left: mobile menu + logo */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                className="lg:hidden -ml-2 p-2 text-forest hover:text-primary transition-colors"
                onClick={() => setMobileMenuOpen(true)}
              >
                <span className="sr-only">Open main menu</span>
                <Menu className="h-6 w-6" aria-hidden="true" />
              </button>
              <Link
                to="/"
                className="flex items-center group"
                aria-label="Six Yards Love home"
              >
                <img
                  src={logo}
                  alt="Six Yards Love"
                  className="h-12 md:h-16 w-auto transition-transform duration-500 group-hover:scale-105"
                />
              </Link>
            </div>

            {/* Center: search (desktop) */}
            <div className="hidden lg:flex flex-1 justify-center">
              <div className="w-full max-w-xl">
                <SearchSuggestions />
              </div>
            </div>

            {/* Right: actions */}
            <div className="flex items-center justify-end gap-1 md:gap-2 shrink-0">
              {isAuthenticated ? (
                <>
                  {authService.isAdmin() && (
                    <Link
                      to="/admin/dashboard"
                      className="hidden md:inline-flex items-center text-[11px] font-medium uppercase tracking-[0.2em] text-primary border border-primary/20 hover:bg-primary hover:text-primary-foreground transition-colors px-3 py-1.5 rounded-full mr-2"
                    >
                      Admin
                    </Link>
                  )}
                  <Link
                    to="/account"
                    className="hidden md:flex text-forest hover:text-primary transition-colors p-2.5 rounded-full hover:bg-secondary/15"
                    aria-label="Account"
                  >
                    <User className="h-5 w-5" strokeWidth={1.5} />
                  </Link>
                  <Link
                    to="/account/wishlist"
                    className="hidden md:flex text-forest hover:text-primary transition-colors p-2.5 rounded-full hover:bg-secondary/15 relative"
                    aria-label="Wishlist"
                  >
                    <Heart className="h-5 w-5" strokeWidth={1.5} />
                    {wishlistCount > 0 && (
                      <span className="absolute top-1 right-1 bg-primary text-primary-foreground text-[9px] min-w-4 h-4 px-1 rounded-full flex items-center justify-center font-medium">
                        {wishlistCount}
                      </span>
                    )}
                  </Link>
                  <Link
                    to="/cart"
                    className="flex text-forest hover:text-primary transition-colors p-2.5 rounded-full hover:bg-secondary/15 relative"
                    aria-label="Cart"
                  >
                    <ShoppingBag className="h-5 w-5" strokeWidth={1.5} />
                    {cartCount > 0 && (
                      <span className="absolute top-1 right-1 bg-secondary text-secondary-foreground text-[9px] min-w-4 h-4 px-1 rounded-full flex items-center justify-center font-medium">
                        {cartCount}
                      </span>
                    )}
                  </Link>
                </>
              ) : (
                <>
                  <button
                    className="hidden md:inline-flex text-[11px] font-medium tracking-[0.2em] uppercase text-forest hover:text-primary transition-colors px-3 py-2"
                    onClick={() => setIsAuthDialogOpen(true)}
                  >
                    Sign In
                  </button>
                  <button
                    className="md:hidden p-2.5 text-forest"
                    aria-label="Sign in"
                    onClick={() => setIsAuthDialogOpen(true)}
                  >
                    <User className="h-5 w-5" strokeWidth={1.5} />
                  </button>
                  <Link
                    to="/shop"
                    className="hidden md:inline-flex text-[11px] font-medium tracking-[0.2em] uppercase bg-primary text-primary-foreground hover:bg-wine-light transition-colors px-5 py-2.5 rounded-full"
                  >
                    Shop Now
                  </Link>
                </>
              )}
            </div>
          </div>
        </nav>

        {/* Navigation row */}
        <div className="hidden lg:block border-t border-border/50">
          <nav className="container-institutional">
            <ul className="flex items-center justify-center gap-x-12 h-12">
              {topNavLinks.map((item) => {
                const active = location.pathname === item.href;
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className={cn(
                        "relative py-2 text-[12px] font-medium tracking-[0.22em] uppercase transition-colors whitespace-nowrap group",
                        active
                          ? "text-primary"
                          : "text-forest/75 hover:text-primary",
                      )}
                    >
                      {item.name}
                      <span
                        className={cn(
                          "absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-px bg-secondary transition-all duration-300",
                          active ? "w-full" : "w-0 group-hover:w-full",
                        )}
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </header>

      {/* Mobile Sidebar Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-[1100]">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-forest/60 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-[1100] w-full max-w-xs shadow-2xl overflow-hidden bg-ivory"
            >
              <Rangoli
                variant="mandala"
                speed={120}
                className="absolute -bottom-24 -right-24 w-72 text-secondary/20"
              />
              <div className="flex items-center justify-between p-6 border-b border-border/40">
                <Link to="/" onClick={() => setMobileMenuOpen(false)}>
                  <img src={logo} alt="Six Yards Love" className="h-10 w-auto" />
                </Link>
                <button
                  type="button"
                  className="p-2 rounded-full hover:bg-accent transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="sr-only">Close menu</span>
                  <X className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>

              <div className="flex flex-col py-6 overflow-y-auto max-h-[calc(100vh-80px)]">
                <div className="px-6 pb-4">
                  <SearchSuggestions
                    isMobile
                    onClose={() => setMobileMenuOpen(false)}
                  />
                </div>
                {topNavLinks.map((item, idx) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      "text-sm font-bold tracking-widest uppercase px-8 py-4 transition-colors flex items-center justify-between group",
                      location.pathname === item.href
                        ? "text-primary bg-primary/10"
                        : "text-primary hover:bg-primary/5",
                    )}
                    style={{ animationDelay: `${idx * 50}ms` }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="h-5 w-5 text-primary/60 group-hover:text-primary transition-colors" />
                      {item.name}
                    </div>
                    <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </Link>
                ))}

                <div className="mt-auto p-8 border-t border-border/40 grid grid-cols-3 gap-4">
                  {isAuthenticated ? (
                    <>
                      <Link
                        to="/account"
                        className="flex flex-col items-center justify-center gap-2 p-4 border border-border/60 rounded-2xl hover:bg-accent/30 transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <User className="h-6 w-6 text-primary" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">
                          Account
                        </span>
                      </Link>
                      <Link
                        to="/account/wishlist"
                        className="relative flex flex-col items-center justify-center gap-2 p-4 border border-border/60 rounded-2xl hover:bg-accent/30 transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Heart className="h-6 w-6 text-primary" />
                        {wishlistCount > 0 && (
                          <span className="absolute top-2 right-2 bg-primary text-primary-foreground text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                            {wishlistCount}
                          </span>
                        )}
                        <span className="text-[10px] font-bold uppercase tracking-widest">
                          Wishlist
                        </span>
                      </Link>
                      <Link
                        to="/cart"
                        className="relative flex flex-col items-center justify-center gap-2 p-4 border border-border/60 rounded-2xl hover:bg-accent/30 transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <ShoppingBag className="h-6 w-6 text-primary" />
                        {cartCount > 0 && (
                          <span className="absolute top-2 right-2 bg-secondary text-secondary-foreground text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                            {cartCount}
                          </span>
                        )}
                        <span className="text-[10px] font-bold uppercase tracking-widest">
                          Cart
                        </span>
                      </Link>
                    </>
                  ) : (
                    <button
                      className="col-span-2 flex flex-row items-center justify-center gap-2 p-4 rounded-full bg-primary text-primary-foreground border hover:bg-primary/90 transition-colors shadow-sm"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setIsAuthDialogOpen(true);
                      }}
                    >
                      <User className="h-5 w-5" />
                      <span className="text-[11px] font-bold uppercase tracking-widest">
                        Login / Sign Up
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AuthDialog
        isOpen={isAuthDialogOpen}
        onClose={() => setIsAuthDialogOpen(false)}
      />
    </>
  );
}

// Helper component for Arrow icon
function ArrowRight({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
