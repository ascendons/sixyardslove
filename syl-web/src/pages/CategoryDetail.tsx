import { useEffect, useState } from "react";
import { Layout } from "@/components/layout";
import { useParams, Link } from "react-router-dom";
import { ArrowRight, Package, Zap, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard } from "@/components/product/ProductCard";
import { productService } from "@/services/productService";
import { Product } from "@/data/products";
import { CATEGORY_DISCLAIMER } from "@/content/brand";

interface Category {
  id: string;
  name: string;
  isActive: boolean;
  imageUrl: string | null;
}

const CategoryDetail = () => {
  const { categoryId } = useParams<{ categoryId: string }>();

  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingCat, setLoadingCat] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!categoryId) return;

    setLoadingCat(true);
    setLoadingProducts(true);
    setError(false);

    productService
      .getCategories()
      .then((cats: Category[]) => {
        const slug = categoryId.toLowerCase();
        const found =
          cats.find((c) => c.id === categoryId) ??
          cats.find((c) => {
            const n = c.name.toLowerCase();
            return n.includes(slug) || slug.includes(n.split(/\s+/)[0]);
          }) ??
          null;
        setCategory(found);
        setLoadingCat(false);
        return productService.getProductsByCategory(found?.id ?? categoryId);
      })
      .then(setProducts)
      .catch(() => {
        setError(true);
        setLoadingCat(false);
      })
      .finally(() => setLoadingProducts(false));
  }, [categoryId]);

  const categoryName = category?.name ?? "";

  return (
    <Layout>
      {/* Hero */}
      {category?.imageUrl && (
        <section className="relative h-56 md:h-72 overflow-hidden">
          <img
            src={category.imageUrl}
            alt={categoryName}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </section>
      )}

      <section className="bg-secondary py-10 md:py-14">
        <div className="container-institutional">
          <div className="max-w-5xl">
            <Link
              to="/categories"
              className="inline-flex items-center gap-1 text-primary text-sm font-medium mb-6 hover:underline"
            >
              ← All Categories
            </Link>

            {loadingCat ? (
              <Skeleton className="h-12 w-64 mb-4" />
            ) : error || !category ? (
              <h1 className="text-secondary-foreground mb-4">
                Category not found
              </h1>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-4 bg-white/10 backdrop-blur-md w-fit px-4 py-2 rounded-full border border-white/20">
                  <Package className="h-5 w-5 text-primary" />
                  <span className="text-sm font-bold uppercase tracking-widest text-secondary-foreground">
                    {categoryName}
                  </span>
                </div>
                <h1 className="text-secondary-foreground mb-6">
                  {categoryName}
                </h1>
              </>
            )}

            <Link to={`/shop?categoryId=${categoryId}`}>
              <Button
                size="lg"
                className="bg-primary hover:bg-ochre-dark text-white rounded-full px-8"
              >
                Explore All Products
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="section-padding bg-background">
        <div className="container-institutional">
          <h2 className="text-2xl font-display font-bold mb-8">
            Products in {loadingCat ? "…" : categoryName}
          </h2>

          {loadingProducts && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-2xl" />
              ))}
            </div>
          )}

          {!loadingProducts && !error && products.length === 0 && (
            <p className="text-muted-foreground text-center py-16">
              No products found in this category yet.
            </p>
          )}

          {!loadingProducts && products.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((product) => (
                <ProductCard key={product.productCode} product={product} />
              ))}
            </div>
          )}

          {error && (
            <p className="text-center text-muted-foreground py-16">
              Could not load products. Please try again later.
            </p>
          )}
        </div>
      </section>

      {/* Quality assurance callout */}
      <section className="section-padding bg-secondary/5">
        <div className="container-institutional">
          <div className="max-w-5xl mx-auto">
            <div className="p-8 rounded-2xl bg-card border border-primary/10">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-display font-bold mb-3">
                    Our Quality Promise
                  </h3>
                  <p className="text-muted-foreground leading-relaxed mb-2">
                    {CATEGORY_DISCLAIMER}
                  </p>
                  <Link
                    to="/shop"
                    className="inline-flex items-center text-primary font-medium hover:underline text-sm"
                  >
                    Shop the Collection
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Browse CTA */}
      <section className="section-padding bg-accent/20 border-t border-border/50">
        <div className="container-institutional text-center py-12">
          <Zap className="h-12 w-12 text-primary mx-auto mb-6" />
          <h2 className="text-3xl font-display font-bold mb-4 text-forest">
            Looking for more?
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-8">
            Browse our full shop for products across all categories.
          </p>
          <Link to="/shop">
            <Button size="lg" className="rounded-full px-8 h-12 text-lg">
              Go to Shop &rarr;
            </Button>
          </Link>
        </div>
      </section>
    </Layout>
  );
};

export default CategoryDetail;
