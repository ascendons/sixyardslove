import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Product } from "@/data/products";
import { productService } from "@/services/productService";
import { wishlistService } from "@/services/wishlistService";
import { cartService } from "@/services/cartService";
import { authService } from "@/services/authService";
import { ProductCard } from "@/components/product/ProductCard";
import { Filter, Search, Loader2 } from "lucide-react";
import { Layout } from "@/components/layout";
import { PageHero } from "@/components/common/PageHero";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

export default function Shop() {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const isAuthenticated = authService.isAuthenticated();

  const { data: wishlist, isError: wishlistError } = useQuery({
    queryKey: ["wishlist"],
    queryFn: () => wishlistService.getWishlist(),
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: cart, isError: cartError } = useQuery({
    queryKey: ["cart"],
    queryFn: () => cartService.getCart(),
    enabled: isAuthenticated,
    retry: false,
  });

  const wishlistIds = new Set(wishlist?.items.map((i) => i.productId) || []);
  const cartVariantIds = new Set(
    cart?.items.map((i) => i.productVariantId) || [],
  );

  const productsWithFlags = products.map((p) => ({
    ...p,
    inWishlist: wishlistIds.has(p.id),
    inCart:
      cartVariantIds.has(p.id) ||
      cartVariantIds.has(p.skus[0]?.variantId) ||
      cartVariantIds.has(p.skus[0]?.id),
  }));

  const featuredProductsWithFlags = featuredProducts.map((p) => ({
    ...p,
    inWishlist: wishlistIds.has(p.id),
    inCart:
      cartVariantIds.has(p.id) ||
      cartVariantIds.has(p.skus[0]?.variantId) ||
      cartVariantIds.has(p.skus[0]?.id),
  }));

  useEffect(() => {
    if (wishlistError) toast.error("Failed to load wishlist");
  }, [wishlistError]);

  useEffect(() => {
    if (cartError) toast.error("Failed to load cart");
  }, [cartError]);

  useEffect(() => {
    async function initShop() {
      setLoading(true);
      try {
        const [allProducts, allCategories, allFeatured] = await Promise.all([
          productService.getProducts(),
          productService.getCategories(),
          productService.getFeaturedProducts(),
        ]);
        setProducts(allProducts);
        setCategories(allCategories);
        setFeaturedProducts(allFeatured);
      } catch (error) {
        console.error("Failed to load shop data:", error);
        toast.error("Failed to load products. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    initShop();
  }, []);

  // Initialize category from URL parameter
  useEffect(() => {
    const categoryParam = searchParams.get("category");
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, [searchParams]);

  const filteredProducts = useMemo(
    () =>
      productsWithFlags.filter((product) => {
        const matchesCategory =
          selectedCategory === "all" ||
          product.category === selectedCategory ||
          product.category
            .toLowerCase()
            .includes(selectedCategory.toLowerCase());
        const matchesSearch =
          product.productName
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          product.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
      }),
    [productsWithFlags, selectedCategory, searchQuery],
  );

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-ivory">
        <PageHero
          eyebrow="The Collection"
          title="Shop Sarees"
          subtitle="Handpicked sarees for every occasion, delivered across India."
        />

        <div className="container mx-auto px-4 py-8">
          {/* Filters & Search */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-border focus:border-primary focus:outline-none"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-muted-foreground" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-3 rounded-xl border-2 border-border focus:border-primary focus:outline-none bg-white"
              >
                <option value="all">All Categories</option>
                {categories.map((category: any) => {
                  const catName =
                    typeof category === "string" ? category : category.name;
                  const catValue =
                    typeof category === "string" ? category : category.name;
                  return (
                    <option key={catValue} value={catValue}>
                      {catName}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Featured Products */}
          {selectedCategory === "all" &&
            !searchQuery &&
            featuredProductsWithFlags.length > 0 && (
              <div className="mb-12">
                <h2 className="text-3xl font-display font-bold text-forest mb-6">
                  Featured Products
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {featuredProductsWithFlags.map((product) => (
                    <ProductCard key={product.productCode} product={product} />
                  ))}
                </div>
              </div>
            )}

          {/* All Products */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-display font-bold text-forest">
                {selectedCategory === "all" ? "All Products" : selectedCategory}
              </h2>
              <p className="text-muted-foreground">
                {filteredProducts.length}{" "}
                {filteredProducts.length === 1 ? "product" : "products"}
              </p>
            </div>

            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.productCode} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-xl text-muted-foreground">
                  No products found matching your criteria
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
