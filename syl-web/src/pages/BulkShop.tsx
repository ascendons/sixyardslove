import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Product } from "@/data/products";
import { productService } from "@/services/productService";
import { ProductCard } from "@/components/product/ProductCard";
import { Filter, Search, Loader2 } from "lucide-react";
import { Layout } from "@/components/layout";
import { PageHero } from "@/components/common/PageHero";
import { useSearchParams } from "react-router-dom";

export default function BulkShop() {
  const isBulk = true;
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

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

  const filteredProducts = products.filter((product) => {
    // Allow partial match (e.g. "Food" matches "Food & Snacks")
    const matchesCategory =
      selectedCategory === "all" ||
      product.category === selectedCategory ||
      product.category.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchesSearch =
      product.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

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
          eyebrow="Weddings & Gifting"
          title="Bulk & Wedding Orders"
          subtitle="Sarees in bulk for weddings, family functions, and corporate gifting — with special pricing."
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
                    <option key={catValue || Math.random()} value={catValue}>
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
            featuredProducts.length > 0 && (
              <div className="mb-12">
                <h2 className="text-3xl font-display font-bold text-forest mb-6">
                  Featured Products
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {featuredProducts.map((product) => (
                    <ProductCard
                      key={product.productCode}
                      product={product}
                      isBulk={isBulk}
                    />
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
                  <ProductCard
                    key={product.productCode}
                    product={product}
                    isBulk={isBulk}
                  />
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
