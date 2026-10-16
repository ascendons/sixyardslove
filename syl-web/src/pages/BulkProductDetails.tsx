import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
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
import { BuyNowDialog } from "@/components/checkout/BuyNowDialog";

export default function BulkProductDetails() {
  const isBulk = true;
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
  const [isBuyNowDialogOpen, setIsBuyNowDialogOpen] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: "" });
  const [applicableCoupons, setApplicableCoupons] = useState<CouponResponse[]>(
    [],
  );
  const [couponsExpanded, setCouponsExpanded] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      setLoading(true);
      try {
        const productData = await productService.getProductByCode(id);
        setProduct(productData || null);

        if (productData) {
          const reviewData = await reviewService.getProductReviews(
            productData.id,
          );
          setReviews(reviewData);

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

          // Initial quantity based on MOQ if bulk
          if (isBulk && productData.skus && productData.skus[selectedVariant]) {
            const moq = Number(productData.skus[selectedVariant].moq) || 1;
            setQuantity(moq);
          }

          // Fetch applicable coupons for this product (only if not bulk)
          if (!isBulk) {
            try {
              const coupons = await couponService.getApplicableCoupons(
                productData.id,
                productData.categoryId,
              );
              setApplicableCoupons(coupons);
            } catch {
              // silently ignore coupon fetch failures
            }
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

    try {
      const variant = product.skus[selectedVariant];
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

  const handleBuyNow = () => {
    if (!authService.isAuthenticated()) {
      toast.error("Please login to buy items");
      return;
    }
    setIsBuyNowDialogOpen(true);
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
      setReviews([savedReview, ...reviews]);
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
            <Link to="/bulk-shop" className="text-primary hover:underline">
              ← Back to Bulk Shop
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const handleQuantityChange = (delta: number) => {
    const moq =
      isBulk && product?.skus[selectedVariant]?.moq
        ? Number(product.skus[selectedVariant].moq)
        : 1;
    setQuantity(Math.max(moq, quantity + delta));
  };

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
              <Link to="/bulk-shop" className="hover:text-primary">
                Bulk Shop
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
              </div>

              {/* Pricing Section */}
              <div className="flex flex-col md:flex-row md:items-baseline justify-between py-4 border-y border-border/50 gap-4">
                <div className="flex flex-wrap items-baseline gap-3">
                  <span className={cn("font-bold text-foreground", "text-4xl")}>
                    {(() => {
                      const variant = product.skus[selectedVariant];
                      const price =
                        isBulk && variant.bulkOrderPrice
                          ? variant.bulkOrderPrice
                          : variant.sellingPrice;
                      return typeof price === "number"
                        ? `₹${price}`
                        : price || "Contact for Price";
                    })()}
                  </span>
                  {(() => {
                    if (isBulk) return null; // No MRP comparison in bulk mode usually
                    const variant = product.skus[selectedVariant];
                    const mrp = variant.mrp;
                    const sellingPrice = variant.sellingPrice;

                    if (
                      mrp &&
                      typeof mrp === "number" &&
                      typeof sellingPrice === "number" &&
                      sellingPrice < mrp
                    ) {
                      return (
                        <span className="text-xl text-muted-foreground line-through">
                          ₹{mrp}
                        </span>
                      );
                    }
                    return null;
                  })()}
                </div>
                <div className="text-left md:text-right">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-tight">
                    Net MRP (Incl. of all taxes)
                  </p>
                  {(() => {
                    if (isBulk) return null;
                    const variant = product.skus[selectedVariant];
                    const mrp = variant.mrp;
                    const sellingPrice = variant.sellingPrice;

                    if (
                      mrp &&
                      typeof mrp === "number" &&
                      typeof sellingPrice === "number" &&
                      sellingPrice < mrp
                    ) {
                      return (
                        <span className="bg-secondary/15 text-primary text-xs font-bold px-2 py-0.5 rounded mt-1 inline-block">
                          SAVE ₹
                          {(mrp - sellingPrice).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>

              {/* Available Offers / Coupons - Hidden in bulk */}
              {!isBulk && applicableCoupons.length > 0 && (
                <div className="border border-primary/20 rounded-xl bg-primary/5 overflow-hidden">
                  <button
                    onClick={() => setCouponsExpanded(!couponsExpanded)}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold text-primary"
                  >
                    <div className="flex items-center gap-2">
                      <Ticket className="w-4 h-4" />
                      Available Offers
                      <span className="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {applicableCoupons.length}
                      </span>
                    </div>
                    {couponsExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                  {couponsExpanded && (
                    <div className="px-4 pb-4 space-y-2">
                      {applicableCoupons.map((coupon) => (
                        <div
                          key={coupon.id}
                          className="flex items-center justify-between bg-white border border-dashed border-primary/30 rounded-lg px-3 py-2.5 gap-3"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-bold text-primary text-sm bg-primary/10 px-2 py-0.5 rounded">
                                {coupon.code}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {coupon.discountType === "PERCENT"
                                  ? `${coupon.discountValue}% off`
                                  : coupon.discountType === "FIXED"
                                    ? `₹${coupon.discountValue} off`
                                    : "BOGO offer"}
                                {coupon.minCartValue > 0 &&
                                  ` on orders above ₹${coupon.minCartValue}`}
                              </span>
                            </div>
                            {coupon.description && (
                              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                {coupon.description}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(coupon.code);
                              toast.success(`Code "${coupon.code}" copied!`);
                            }}
                            className="flex items-center gap-1 text-xs text-primary font-bold hover:bg-primary/10 px-2 py-1.5 rounded-md transition-colors flex-shrink-0"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            Copy
                          </button>
                        </div>
                      ))}
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
                      onClick={() => setSelectedVariant(index)}
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
                            <span className="font-bold">
                              {(() => {
                                const price =
                                  isBulk && variant.bulkOrderPrice
                                    ? variant.bulkOrderPrice
                                    : variant.sellingPrice;
                                return typeof price === "number"
                                  ? `₹${price}`
                                  : price || "Contact for Price";
                              })()}
                            </span>
                            {!isBulk && mrpComparison(variant)}
                          </div>
                          {isBulk && variant.moq && (
                            <p className="text-xs text-amber-600 font-bold mt-1">
                              Minimum Order Quantity: {variant.moq}
                            </p>
                          )}
                        </div>
                        {selectedVariant === index && (
                          <CheckCircle2 className="w-6 h-6 text-primary" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Section */}
              <div className="space-y-4 pt-4">
                <div className="flex items-center gap-6">
                  {/* Quantity */}
                  <div className="flex items-center bg-muted/50 rounded-lg p-1">
                    <button
                      onClick={() => handleQuantityChange(-1)}
                      className="w-10 h-10 flex items-center justify-center hover:bg-white rounded-md transition-all shadow-sm"
                      disabled={
                        quantity <=
                        (isBulk && product?.skus[selectedVariant]?.moq
                          ? Number(product.skus[selectedVariant].moq)
                          : 1)
                      }
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center font-bold">
                      {quantity}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(1)}
                      className="w-10 h-10 flex items-center justify-center hover:bg-white rounded-md transition-all shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Add to Cart */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAddToCart}
                    className="flex-1 bg-primary text-white h-12 rounded-lg font-bold shadow-lg shadow-primary/20 hover:bg-primary/95 transition-all flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    Add to cart
                  </motion.button>
                </div>

                {/* Buy Now */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleBuyNow}
                  className="w-full bg-secondary text-secondary-foreground h-14 rounded-full font-medium tracking-wider uppercase text-sm shadow-lg hover:bg-ochre-light transition-all"
                >
                  Buy Now (Bulk)
                </motion.button>
              </div>
            </div>
          </div>

          {product && (
            <BuyNowDialog
              open={isBuyNowDialogOpen}
              onOpenChange={setIsBuyNowDialogOpen}
              product={product}
              selectedVariantIndex={selectedVariant}
              quantity={quantity}
              isBulk={isBulk}
            />
          )}

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
                <div className="prose max-w-none prose-p:text-muted-foreground prose-li:text-muted-foreground">
                  <p className="text-lg leading-relaxed mb-6">
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
        </div>
      </div>

      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        {/* Review Dialog Content */}
      </Dialog>
    </Layout>
  );
}

function mrpComparison(variant: any) {
  const mrp = variant.mrp;
  const sellingPrice = variant.sellingPrice;

  if (
    mrp &&
    typeof mrp === "number" &&
    typeof sellingPrice === "number" &&
    sellingPrice < mrp
  ) {
    return (
      <>
        <span className="text-sm text-muted-foreground line-through">
          ₹{mrp}
        </span>
        <span className="text-sm text-red-500 font-bold">
          {Math.round(((mrp - sellingPrice) / mrp) * 100)}% OFF
        </span>
      </>
    );
  }
  return null;
}
