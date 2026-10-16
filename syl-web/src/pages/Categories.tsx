import { useEffect, useState } from "react";
import { Layout } from "@/components/layout";
import { PageHero } from "@/components/common/PageHero";
import { Link } from "react-router-dom";
import { ArrowRight, Package } from "lucide-react";
import { CATEGORY_DISCLAIMER } from "@/content/brand";
import { productService } from "@/services/productService";
import { Skeleton } from "@/components/ui/skeleton";

interface Category {
  id: string;
  name: string;
  isActive: boolean;
  imageUrl: string | null;
  children: Category[];
}

const Categories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    productService
      .getCategories()
      .then((data) => setCategories(data.filter((c: Category) => c.isActive)))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <PageHero
        eyebrow="Product Categories"
        title={
          <>
            Sarees for <span className="italic text-gold-foil">Every Occasion</span>
          </>
        }
        subtitle="Explore our collections — from luxurious silks to breezy cottons, every saree handpicked for quality."
      />

      {/* Categories Grid */}
      <section className="section-padding bg-background">
        <div className="container-institutional">
          {error && (
            <p className="text-center text-muted-foreground py-16">
              Could not load categories. Please try again later.
            </p>
          )}

          {loading && (
            <div className="space-y-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-28 w-full rounded-2xl" />
              ))}
            </div>
          )}

          {!loading && !error && categories.length === 0 && (
            <p className="text-center text-muted-foreground py-16">
              No categories found.
            </p>
          )}

          {!loading && !error && categories.length > 0 && (
            <div className="space-y-8">
              {categories.map((category, index) => (
                <Link
                  key={category.id}
                  to={`/categories/${category.id}`}
                  className="block group"
                >
                  <div
                    className={`bg-card rounded-2xl p-6 md:p-8 border border-border hover:border-primary/50 hover:shadow-lg transition-all ${
                      index % 2 === 0 ? "" : "lg:flex-row-reverse"
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row gap-6 lg:gap-12 items-start lg:items-center">
                      {/* Image or fallback icon */}
                      <div className="flex-shrink-0">
                        {category.imageUrl ? (
                          <img
                            src={category.imageUrl}
                            alt={category.name}
                            className="w-20 h-20 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-xl bg-secondary flex items-center justify-center group-hover:bg-primary transition-colors">
                            <Package className="h-10 w-10 text-secondary-foreground group-hover:text-primary-foreground transition-colors" />
                          </div>
                        )}
                      </div>

                      {/* Name */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h2 className="text-2xl font-display font-semibold text-foreground group-hover:text-primary transition-colors">
                            {category.name}
                          </h2>
                          <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Category disclaimer */}
      <section className="section-padding bg-secondary/5">
        <div className="container-institutional">
          <div className="max-w-5xl mx-auto">
            <div className="category-disclaimer">
              <h3 className="text-xl font-display font-semibold text-foreground mb-3">
                Our Quality Promise
              </h3>
              <p className="mb-6">{CATEGORY_DISCLAIMER}</p>
              <Link to="/shop">
                <span className="inline-flex items-center text-primary font-medium hover:underline">
                  Shop the Collection
                  <ArrowRight className="ml-2 h-4 w-4" />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Categories;
