import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShoppingCart, Heart } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Product } from "@/data/products";
import { cn } from "@/lib/utils";
import { wishlistService } from "@/services/wishlistService";
import { cartService } from "@/services/cartService";
import { authService } from "@/services/authService";
import { toast } from "sonner";

interface ProductCardProps {
  product: Product;
  isBulk?: boolean;
}

export function ProductCard({ product, isBulk = false }: ProductCardProps) {
  const queryClient = useQueryClient();
  const isAuthenticated = authService.isAuthenticated();

  const wishlistMutation = useMutation({
    mutationFn: () =>
      product.inWishlist
        ? wishlistService.removeItem(product.id)
        : wishlistService.addItem(product.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      toast.success(
        product.inWishlist ? "Removed from wishlist" : "Added to wishlist",
      );
    },
    onError: () => {
      toast.error("Failed to update wishlist");
    },
  });

  const cartMutation = useMutation({
    mutationFn: () => {
      const variantId =
        product.skus[0]?.variantId || product.skus[0]?.id || product.id;
      return cartService.addItem(variantId, 1);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Added to cart");
    },
    onError: () => {
      toast.error("Failed to add to cart");
    },
  });

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error("Please login to manage wishlist");
      return;
    }
    wishlistMutation.mutate();
  };

  const handleCartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error("Please login to add items to cart");
      return;
    }
    cartMutation.mutate();
  };

  const defaultSku = product.skus[0];

  const getPriceDisplay = () => {
    if (isBulk) {
      if (defaultSku && defaultSku.bulkOrderPrice) {
        return typeof defaultSku.bulkOrderPrice === "number"
          ? `₹${defaultSku.bulkOrderPrice}`
          : defaultSku.bulkOrderPrice;
      }
      return "Contact for Bulk Price";
    }
    return defaultSku && typeof defaultSku.sellingPrice === "number"
      ? `₹${defaultSku.sellingPrice}`
      : defaultSku?.sellingPrice || "Contact for Price";
  };

  const getDiscountPercentage = () => {
    if (
      defaultSku &&
      typeof defaultSku.mrp === "number" &&
      typeof defaultSku.sellingPrice === "number"
    ) {
      return Math.round(
        ((defaultSku.mrp - defaultSku.sellingPrice) / defaultSku.mrp) * 100,
      );
    }
    return null;
  };

  const discount = getDiscountPercentage();
  const stockQty = product.skus.reduce(
    (acc, sku) => acc + sku.stockQuantity,
    0,
  );

  const stockStatus =
    stockQty === 0 ? "Sold Out" : stockQty <= 5 ? "Only a few left" : null;

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="group flex flex-col h-full"
    >
      <Link
        to={
          isBulk
            ? `/bulk-product/${product.productCode}`
            : `/product/${product.productCode}`
        }
        className="flex flex-col h-full"
      >
        {/* Image */}
        <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-parchment ring-1 ring-border/70 group-hover:ring-secondary/60 transition-all duration-500 shadow-[0_10px_30px_-18px_hsl(var(--wine)/0.45)]">
          <img
            src={(product.images && product.images[0]) || "/placeholder.svg"}
            alt={product.productName}
            className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-700 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-forest/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start z-10">
            {discount ? (
              <span className="bg-primary text-primary-foreground px-2.5 py-1 rounded-full text-[10px] font-medium tracking-wider uppercase">
                {discount}% off
              </span>
            ) : null}
            {product.featured && (
              <span className="bg-secondary text-secondary-foreground px-2.5 py-1 rounded-full text-[10px] font-medium tracking-wider uppercase">
                Featured
              </span>
            )}
          </div>

          {stockStatus && (
            <span
              className={cn(
                "absolute top-3 right-3 z-10 px-2.5 py-1 rounded-full text-[10px] font-medium tracking-wider uppercase backdrop-blur-md",
                stockQty === 0
                  ? "bg-forest/80 text-ivory"
                  : "bg-white/85 text-primary",
              )}
            >
              {stockStatus}
            </span>
          )}

          {/* Quick Actions */}
          <div className="absolute inset-x-3 bottom-3 flex gap-2 z-10 translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
            <button
              onClick={handleCartClick}
              disabled={cartMutation.isPending}
              className="flex-1 flex items-center justify-center gap-2 h-10 rounded-full bg-white/95 text-forest text-xs font-medium tracking-wider uppercase backdrop-blur hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50"
            >
              <ShoppingCart
                className="w-4 h-4"
                fill={product.inCart ? "currentColor" : "none"}
              />
              {product.inCart ? "In Bag" : "Add"}
            </button>
            <button
              onClick={handleWishlistClick}
              disabled={wishlistMutation.isPending}
              aria-label="Wishlist"
              className={cn(
                "w-10 h-10 flex items-center justify-center rounded-full backdrop-blur transition-colors disabled:opacity-50",
                product.inWishlist
                  ? "bg-primary text-primary-foreground"
                  : "bg-white/95 text-forest hover:bg-primary hover:text-primary-foreground",
              )}
            >
              <Heart
                className="w-4 h-4"
                fill={product.inWishlist ? "currentColor" : "none"}
              />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="pt-4 px-1 space-y-1 flex flex-col flex-grow">
          <span className="text-[10px] sm:text-[11px] tracking-[0.2em] uppercase text-ochre line-clamp-1">
            {product.category}
          </span>

          <h3 className="font-display font-semibold text-lg sm:text-xl text-forest line-clamp-2 group-hover:text-primary transition-colors leading-snug">
            {product.productName}
          </h3>

          <div className="flex items-baseline gap-2 pt-1 mt-auto">
            <span className="text-base sm:text-lg font-medium text-forest">
              {getPriceDisplay()}
            </span>
            {defaultSku &&
              typeof defaultSku.mrp === "number" &&
              discount ? (
              <span className="text-xs sm:text-sm text-muted-foreground line-through">
                ₹{defaultSku.mrp}
              </span>
            ) : null}
          </div>

          {isBulk && defaultSku?.moq && (
            <div className="pt-1">
              <span className="text-[11px] bg-secondary/15 text-secondary px-2.5 py-0.5 rounded-full font-medium">
                MOQ: {defaultSku.moq}
              </span>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
