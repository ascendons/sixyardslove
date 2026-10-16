import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ShoppingCart,
  Heart,
  Share2,
  Minus,
  Plus,
  Package,
  Truck,
  Shield,
  Award,
  ChevronRight,
  Star,
  Coins,
  CheckCircle2,
  Users,
  Info,
  Loader2,
  Ticket,
  Copy,
  ChevronDown,
  ChevronUp,
  ArrowRight,
} from "lucide-react";
import { Product } from "@/data/products";
import { productService } from "@/services/productService";
import { cartService } from "@/services/cartService";
import { wishlistService } from "@/services/wishlistService";
import { reviewService, Review } from "@/services/reviewService";
import { authService } from "@/services/authService";
import couponService, { CouponResponse } from "@/services/couponService";
import { cn } from "@/lib/utils";
import { Layout } from "@/components/layout";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function ProductDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [activeTab, setActiveTab] = useState<
    "description" | "benefits" | "how-to-use" | "reviews"
  >("description");
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: "" });
  const [allCoupons, setAllCoupons] = useState<CouponResponse[]>([]);
  const [couponsExpanded, setCouponsExpanded] = useState(false);
  const navigate = useNavigate();

  const { data: cart } = useQuery({
    queryKey: ["cart"],
    queryFn: () => cartService.getCart(),
    enabled: authService.isAuthenticated(),
  });

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      setLoading(true);
      try {
        const productData = await productService.getProductByCode(id);
        setProduct(productData || null);

        if (productData) {
          // These three are all independent of each other — run in parallel
          const [reviewData, couponData] = await Promise.all([
            reviewService.getProductReviews(productData.id),
            couponService.getAllWithApplicability(
              productData.id,
              productData.categoryId,
            ),
          ]);
          setReviews(reviewData);
          setAllCoupons(couponData);

          const firstAvailableTab = (
            ["description", "benefits", "how-to-use"] as const
          ).find((tab) => {
            if (tab === "description") return !!productData.description?.trim();
            if (tab === "benefits") return !!productData.benefits?.trim();
            return !!productData.howToUse?.trim();
          });
          if (firstAvailableTab) {
            setActiveTab(firstAvailableTab);
          }

          if (authService.isAuthenticated()) {
            const wishStatus = await wishlistService.checkInWishlist(
              productData.id,
            );
            setIsWishlisted(wishStatus);
          }
        }
      } catch (error) {
        console.error("Failed to load product details:", error);
        toast.error("Failed to load product. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const handleAddToCart = async () => {
    if (!authService.isAuthenticated()) {
      toast.error("Please login to add items to cart");
      return;
    }
    if (!product) return;

    const variant = product.skus[selectedVariant];
    const stockQty = variant.stockQuantity ?? 0;

    if (quantity > stockQty) {
      toast.error(`Only ${stockQty} items available in stock`);
      setQuantity(stockQty);
      return;
    }

    try {
      await cartService.addItem(variant.id, quantity);
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast.success(`${product.productName} added to cart`);
    } catch (error) {
      toast.error("Failed to add to cart");
    }
  };

  const handleAddToWishlist = async () => {
    if (!authService.isAuthenticated()) {
      toast.error("Please login to manage wishlist");
      return;
    }
    if (!product) return;

    try {
      if (isWishlisted) {
        await wishlistService.removeItem(product.id);
        setIsWishlisted(false);
        toast.success("Removed from wishlist");
      } else {
        await wishlistService.addItem(product.id);
        setIsWishlisted(true);
        toast.success("Added to wishlist");
      }
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    } catch (error) {
      toast.error("Failed to update wishlist");
    }
  };

  const handleSubmitReview = async () => {
    if (!product) return;
    setSubmittingReview(true);
    try {
      const savedReview = await reviewService.addReview({
        productId: product.id,
        rating: newReview.rating,
        comment: newReview.comment,
      });
      setReviews((prev) => [savedReview, ...prev]);
      setIsReviewDialogOpen(false);
      setNewReview({ rating: 5, comment: "" });
      toast.success("Review submitted successfully");
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Failed to submit review";
      toast.error(message);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-display font-bold text-forest mb-4">
              Product Not Found
            </h1>
            <p className="text-muted-foreground mb-6">
              The product you're looking for doesn't exist.
            </p>
            <Link to="/shop" className="text-primary hover:underline">
              ← Back to Shop
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const handleQuantityChange = (delta: number) => {
    const variant = product?.skus[selectedVariant];
    const maxQty = variant?.stockQuantity ?? 999;
    setQuantity(Math.max(1, Math.min(maxQty, quantity + delta)));
  };

  const getEffectivePrice = (
    variant: (typeof product.skus)[0],
    qty: number,
  ) => {
    const bulk = Number(variant.bulkOrderPrice);
    const moq = Number(variant.moq);
    if (bulk && moq && qty >= moq) return bulk;
    return Number(variant.sellingPrice);
  };

  const isInCart = cart?.items.some(
    (item) => item.productVariantId === product.skus[selectedVariant].id,
  );

  return (
    <Layout>
      <div className="min-h-screen bg-ivory">
        {/* Breadcrumb */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link to="/" className="hover:text-primary">
                Home
              </Link>
              <ChevronRight className="w-4 h-4" />
              <Link to="/shop" className="hover:text-primary">
                Shop
              </Link>
              <ChevronRight className="w-4 h-4" />
              <Link
                to={`/categories/${product.categoryId}`}
                className="hover:text-primary"
              >
                {product.category}
              </Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-foreground">{product.productName}</span>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Left Column - Images */}
            <div className="space-y-6">
              {/* Main Image */}
              <motion.div
                className="aspect-square rounded-2xl overflow-hidden bg-white border border-border/50 shadow-sm"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <img
                  src={
                    (product.images && product.images[selectedImage]) ||
                    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800"
                  }
                  alt={product.productName}
                  className="w-full h-full object-contain p-4"
                />
              </motion.div>

              {/* Thumbnail Images */}
              {product.images && product.images.length > 1 && (
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={cn(
                        "w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all bg-white",
                        selectedImage === index
                          ? "border-primary shadow-md"
                          : "border-border/30 hover:border-primary/40",
                      )}
                    >
                      <img
                        src={image}
                        alt={`${product.productName} ${index + 1}`}
                        className="w-full h-full object-contain p-1"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column - Product Info */}
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-primary/10 text-primary px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider">
                    {product.producedBy}
                  </span>
                  <div className="flex items-center text-amber-500">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="ml-1 text-sm font-bold text-foreground">
                      {reviews.length > 0
                        ? (
                            reviews.reduce((acc, r) => acc + r.rating, 0) /
                            reviews.length
                          ).toFixed(1)
                        : "0.0"}
                    </span>
                    <span className="ml-1 text-xs text-muted-foreground">
                      ({reviews.length} reviews)
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-start mb-1">
                  <h1 className="text-3xl md:text-4xl font-display font-bold text-forest">
                    {product.productName}
                  </h1>
                  <button
                    onClick={handleAddToWishlist}
                    className={cn(
                      "p-3 rounded-full border transition-all",
                      isWishlisted
                        ? "bg-red-50 border-red-200 text-red-500"
                        : "bg-white border-border hover:border-primary/50 text-muted-foreground hover:text-primary",
                    )}
                  >
                    <Heart
                      className={cn("w-6 h-6", isWishlisted && "fill-current")}
                    />
                  </button>
                </div>
                {/* {product.skus && product.skus.length > 0 && (
                  <p className="text-xs text-muted-foreground font-mono">
                    SKU: {product.skus[selectedVariant].sku}
                  </p>
                )} */}
              </div>

              {/* Pricing Section */}
              <div className="flex flex-col md:flex-row md:items-baseline justify-between py-4 border-y border-border/50 gap-4">
                <div className="flex flex-wrap items-baseline gap-3">
                  {(() => {
                    const variant = product.skus[selectedVariant];
                    const effectivePrice = getEffectivePrice(variant, quantity);
                    const basePrice = Number(variant.sellingPrice);
                    const isBulk = effectivePrice < basePrice;
                    return (
                      <>
                        <span className="font-bold text-foreground text-4xl">
                          ₹{effectivePrice}
                        </span>
                        {isBulk && (
                          <span className="text-xl text-muted-foreground line-through">
                            ₹{basePrice}
                          </span>
                        )}
                        {!isBulk &&
                          variant.mrp &&
                          Number(variant.mrp) > basePrice && (
                            <span className="text-xl text-muted-foreground line-through">
                              ₹{Number(variant.mrp)}
                            </span>
                          )}
                      </>
                    );
                  })()}
                </div>
                <div className="text-left md:text-right">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-tight">
                    Net MRP (Incl. of all taxes)
                  </p>
                  {(() => {
                    const variant = product.skus[selectedVariant];
                    const effectivePrice = getEffectivePrice(variant, quantity);
                    const basePrice = Number(variant.sellingPrice);
                    const mrp = Number(variant.mrp);
                    const isBulk = effectivePrice < basePrice;
                    const comparePrice = isBulk ? basePrice : mrp;

                    if (comparePrice && effectivePrice < comparePrice) {
                      return (
                        <span className="bg-secondary/15 text-primary text-xs font-bold px-2 py-0.5 rounded mt-1 inline-block">
                          {isBulk ? "BULK PRICE — " : ""}SAVE ₹
                          {(comparePrice - effectivePrice).toLocaleString(
                            "en-IN",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            },
                          )}
                        </span>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>

              {/* Available Offers / Coupons */}
              {allCoupons.length > 0 && (
                <div className="border border-primary/20 rounded-xl bg-primary/5 overflow-hidden">
                  <button
                    onClick={() => setCouponsExpanded(!couponsExpanded)}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-primary"
                  >
                    <div className="flex items-center gap-2">
                      <Ticket className="w-3.5 h-3.5" />
                      Applicable Offers
                      <span className="bg-primary text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                        {
                          allCoupons.filter((c) => c.applicable !== false)
                            .length
                        }
                        /{allCoupons.length}
                      </span>
                    </div>
                    {couponsExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                  {couponsExpanded && (
                    <div className="px-3 pb-3 space-y-1.5">
                      {allCoupons.map((coupon) => {
                        const applicable = coupon.applicable !== false;
                        return (
                          <div
                            key={coupon.id}
                            className={`flex items-center justify-between rounded-lg px-2 py-1.5 gap-2 border border-dashed ${
                              applicable
                                ? "bg-white border-primary/30"
                                : "bg-gray-50 border-gray-200 opacity-60"
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span
                                  className={`font-mono font-bold text-[10px] px-1.5 py-0.5 rounded ${
                                    applicable
                                      ? "text-primary bg-primary/10"
                                      : "text-gray-400 bg-gray-100"
                                  }`}
                                >
                                  {coupon.code}
                                </span>
                                <span className="text-[10px] text-muted-foreground font-medium">
                                  {coupon.discountType === "PERCENT"
                                    ? `${coupon.discountValue}% off`
                                    : coupon.discountType === "FIXED"
                                      ? `₹${coupon.discountValue} off`
                                      : "BOGO offer"}
                                  {coupon.minCartValue > 0 &&
                                    ` on ₹${coupon.minCartValue}+`}
                                </span>
                              </div>
                              {coupon.description && (
                                <p className="text-[10px] text-muted-foreground/80 mt-0.5 truncate">
                                  {coupon.description}
                                </p>
                              )}
                            </div>
                            {applicable ? (
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(coupon.code);
                                  toast.success(
                                    `Code "${coupon.code}" copied!`,
                                  );
                                }}
                                className="flex items-center gap-1 text-[10px] text-primary font-bold hover:bg-primary/10 px-1.5 py-1 rounded-md transition-colors flex-shrink-0"
                              >
                                <Copy className="w-3 h-3" />
                                Copy
                              </button>
                            ) : (
                              <span className="text-[10px] text-gray-400 px-1.5 flex-shrink-0">
                                N/A
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Variant Selection */}
              <div>
                <p className="text-sm font-bold mb-3 uppercase tracking-wider text-muted-foreground">
                  Select Variant
                </p>
                <div className="space-y-3">
                  {product.skus.map((variant, index) => (
                    <button
                      key={variant.sku}
                      onClick={() => {
                        setSelectedVariant(index);
                        const nextStock = variant.stockQuantity ?? 0;
                        if (quantity > nextStock && nextStock > 0) {
                          setQuantity(nextStock);
                        } else if (nextStock === 0) {
                          setQuantity(1);
                        }
                      }}
                      className={cn(
                        "w-full p-4 rounded-xl border-2 text-left transition-all relative group",
                        selectedVariant === index
                          ? "border-primary bg-primary/5"
                          : "border-border/50 hover:border-primary/30",
                      )}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-bold text-lg">
                            {variant.packaging}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            {(() => {
                              const effectivePrice = getEffectivePrice(
                                variant,
                                quantity,
                              );
                              const basePrice = Number(variant.sellingPrice);
                              const mrp = Number(variant.mrp);
                              const isBulk = effectivePrice < basePrice;
                              const comparePrice = isBulk ? basePrice : mrp;
                              const discountPct = comparePrice
                                ? Math.round(
                                    ((comparePrice - effectivePrice) /
                                      comparePrice) *
                                      100,
                                  )
                                : 0;
                              return (
                                <>
                                  <span className="font-bold">
                                    ₹{effectivePrice}
                                  </span>
                                  {comparePrice > effectivePrice && (
                                    <>
                                      <span className="text-sm text-muted-foreground line-through">
                                        ₹{comparePrice}
                                      </span>
                                      <span className="text-sm text-red-500 font-bold">
                                        {discountPct}% OFF
                                      </span>
                                    </>
                                  )}
                                  {isBulk && (
                                    <span className="text-xs text-primary font-semibold">
                                      (Bulk Price)
                                    </span>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {(() => {
                            const qty = variant.stockQuantity;
                            if (qty === undefined || qty === null) return null;
                            if (qty === 0)
                              return (
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                                  Out of Stock
                                </span>
                              );
                            if (qty <= 5)
                              return (
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                                  Limited Stock
                                </span>
                              );
                            return (
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                                In Stock
                              </span>
                            );
                          })()}
                          {selectedVariant === index && (
                            <CheckCircle2 className="w-6 h-6 text-primary" />
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Section */}
              <div className="space-y-4 pt-4">
                {(() => {
                  const variant = product.skus[selectedVariant];
                  const bulk = Number(variant.bulkOrderPrice);
                  const moq = Number(variant.moq);
                  if (bulk && moq && quantity < moq) {
                    return (
                      <p className="text-xs text-primary font-medium bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
                        Buy {moq}+ units to unlock bulk price of ₹{bulk}/unit
                      </p>
                    );
                  }
                  return null;
                })()}
                <div className="flex items-center gap-6">
                  {/* Quantity */}
                  <div className="flex items-center bg-muted/50 rounded-lg p-1">
                    <button
                      onClick={() => handleQuantityChange(-1)}
                      className="w-10 h-10 flex items-center justify-center hover:bg-white rounded-md transition-all shadow-sm"
                      disabled={quantity <= 1}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center font-bold">
                      {quantity}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(1)}
                      className="w-10 h-10 flex items-center justify-center hover:bg-white rounded-md transition-all shadow-sm disabled:opacity-30 disabled:cursor-not-allowed"
                      disabled={
                        quantity >=
                        (product.skus[selectedVariant]?.stockQuantity ?? 999)
                      }
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Add to Cart / Go to Cart */}
                  {isInCart ? (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => navigate("/cart")}
                      className="flex-1 bg-secondary text-secondary-foreground h-12 rounded-lg font-bold shadow-lg shadow-black/10 hover:bg-secondary/95 transition-all flex items-center justify-center gap-2"
                    >
                      <ArrowRight className="w-5 h-5" />
                      Go to Cart
                    </motion.button>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleAddToCart}
                      disabled={
                        product.skus[selectedVariant]?.stockQuantity === 0
                      }
                      className="flex-1 bg-primary text-white h-12 rounded-lg font-bold shadow-lg shadow-primary/20 hover:bg-primary/95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      Add to cart
                    </motion.button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Product Highlights Section */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 px-4 py-8 bg-white rounded-2xl border border-border/30">
            {[
              {
                icon: Shield,
                label: "Handpicked Quality",
                sub: "Checked before dispatch",
              },
              {
                icon: Award,
                label: "Authentic Fabric",
                sub: "Honestly described",
              },
              {
                icon: Users,
                label: "Secure Payments",
                sub: "Safe & encrypted checkout",
              },
              {
                icon: CheckCircle2,
                label: "Easy Returns",
                sub: "Hassle-free process",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="flex flex-col items-center text-center space-y-2 p-2"
              >
                <div className="w-14 h-14 bg-parchment text-primary rounded-full flex items-center justify-center border border-primary/10">
                  <item.icon className="w-7 h-7" />
                </div>
                <h4 className="font-bold text-sm text-foreground">
                  {item.label}
                </h4>
                <p className="text-xs text-muted-foreground">{item.sub}</p>
              </div>
            ))}
          </div>

          {/* Product Details Tabs */}
          {(() => {
            const availableTabs = (
              ["description", "benefits", "how-to-use"] as const
            ).filter((tab) => {
              if (tab === "description") return !!product.description?.trim();
              if (tab === "benefits") return !!product.benefits?.trim();
              return !!product.howToUse?.trim();
            });
            if (availableTabs.length === 0) return null;
            return (
          <div className="mt-12 bg-white rounded-2xl border border-border/30 overflow-hidden shadow-sm">
            <div className="border-b border-border/50 bg-parchment">
              <div className="flex px-6">
                {availableTabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as typeof activeTab)}
                    className={cn(
                      "py-5 px-6 font-bold text-sm uppercase tracking-wider transition-all relative",
                      activeTab === tab
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {tab.replace(/-/g, " ")}
                    {activeTab === tab && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full"
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-8">
              {activeTab === "description" && (
                <div className="prose max-w-none prose-p:text-muted-foreground">
                  <p className="text-lg leading-relaxed whitespace-pre-line">
                    {product.description}
                  </p>
                </div>
              )}

              {activeTab === "benefits" && (
                <div>
                  <p className="text-base text-muted-foreground leading-relaxed whitespace-pre-line">
                    {product.benefits}
                  </p>
                </div>
              )}

              {activeTab === "how-to-use" && (
                <div>
                  <p className="text-base text-muted-foreground leading-relaxed whitespace-pre-line">
                    {product.howToUse}
                  </p>
                </div>
              )}
            </div>
          </div>
            );
          })()}

          {/* Customer Reviews Section */}
          <div className="mt-16 bg-white rounded-2xl border border-border/30 p-8 shadow-sm">
            <h3 className="text-2xl font-display font-bold text-forest mb-8 text-center">
              Customer Reviews
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center mb-12 py-8 border-y border-border/50">
              {/* Summary */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={cn(
                        "w-6 h-6",
                        s <=
                          Math.round(
                            reviews.reduce((acc, r) => acc + r.rating, 0) /
                              (reviews.length || 1),
                          )
                          ? "fill-amber-500 text-amber-500"
                          : "text-muted/30",
                      )}
                    />
                  ))}
                </div>
                <p className="text-4xl font-bold mb-1">
                  {reviews.length > 0
                    ? (
                        reviews.reduce((acc, r) => acc + r.rating, 0) /
                        reviews.length
                      ).toFixed(1)
                    : "0.0"}
                  <span className="text-lg text-muted-foreground font-normal ml-1">
                    out of 5
                  </span>
                </p>
                <p className="text-muted-foreground text-sm uppercase tracking-wider">
                  Based on {reviews.length} reviews
                </p>
              </div>

              {/* Histogram */}
              <div className="space-y-3">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = reviews.filter((r) => r.rating === star).length;
                  const perc =
                    reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-4">
                      <span className="text-sm font-bold w-4">{star}</span>
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${perc}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-8 text-right">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Write Review */}
              <div className="text-center">
                <button
                  onClick={() => {
                    if (!authService.isAuthenticated()) {
                      toast.error("Please login to write a review");
                      return;
                    }
                    setIsReviewDialogOpen(true);
                  }}
                  className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/10"
                >
                  Write a review
                </button>
              </div>
            </div>

            {/* Individual Reviews */}
            <div className="space-y-8">
              {reviews.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No reviews yet. Be the first to review this product!
                </div>
              ) : (
                reviews.map((review, i) => (
                  <div
                    key={review.id}
                    className="pb-8 border-b border-border/50 last:border-0"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-muted/50 rounded-full flex items-center justify-center font-bold text-primary">
                          {review.userName[0]}
                        </div>
                        <div>
                          <p className="font-bold text-sm">
                            {review.userName}{" "}
                            <span className="bg-green-100 text-green-700 text-[10px] px-1.5 py-0.5 rounded ml-2 uppercase tracking-tighter">
                              Verified
                            </span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={cn(
                              "w-3 h-3",
                              s <= review.rating
                                ? "fill-amber-500 text-amber-500"
                                : "text-muted/30",
                            )}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {review.comment}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent
          className="sm:max-w-[425px]"
          aria-describedby={undefined}
        >
          <DialogHeader>
            <DialogTitle>Write a Review</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Rating</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setNewReview({ ...newReview, rating: star })}
                    className="focus:outline-none"
                  >
                    <Star
                      className={cn(
                        "w-8 h-8 transition-all",
                        star <= newReview.rating
                          ? "fill-amber-500 text-amber-500"
                          : "text-muted/30 hover:text-amber-200",
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="comment">Comment</Label>
              <Textarea
                id="comment"
                placeholder="Share your thoughts about this product..."
                value={newReview.comment}
                onChange={(e) =>
                  setNewReview({ ...newReview, comment: e.target.value })
                }
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsReviewDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitReview}
              disabled={submittingReview || !newReview.comment.trim()}
            >
              {submittingReview ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Review"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
