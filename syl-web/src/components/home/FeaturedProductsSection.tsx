import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Product } from "@/data/products";
import { productService } from "@/services/productService";
import { ProductCard } from "@/components/product/ProductCard";
import { RevealOnScroll } from "@/components/common/RevealOnScroll";
import { SectionHeading } from "@/components/common/SectionHeading";

export function FeaturedProductsSection() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFeatured() {
      setLoading(true);
      try {
        const data = await productService.getFeaturedProducts();
        setFeaturedProducts(data);
      } catch (error) {
        console.error("Failed to load featured products:", error);
      } finally {
        setLoading(false);
      }
    }
    loadFeatured();
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (featuredProducts.length === 0) return null;

  return (
    <section className="section-padding relative overflow-hidden">

      <div className="container-institutional relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <SectionHeading
            align="left"
            eyebrow="Curated Selection"
            title={
              <>
                Handpicked <span className="italic text-primary">for You</span>
              </>
            }
            subtitle="Discover our latest sarees, handpicked for every occasion."
          />

          <RevealOnScroll delay={200} className="flex gap-4">
            <button
              onClick={() => scroll("left")}
              className="w-12 h-12 rounded-full border border-forest/15 flex items-center justify-center text-forest hover:bg-primary hover:border-primary hover:text-primary-foreground transition-all duration-300 group"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => scroll("right")}
              className="w-12 h-12 rounded-full border border-forest/15 flex items-center justify-center text-forest hover:bg-primary hover:border-primary hover:text-primary-foreground transition-all duration-300 group"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </button>
          </RevealOnScroll>
        </div>

        <div className="relative">
          {/* Horizontal Scroll Container */}
          <div
            ref={scrollContainerRef}
            className="flex gap-5 md:gap-8 overflow-x-auto pb-6 pt-2 hide-scrollbar snap-x snap-mandatory"
            style={{ msOverflowStyle: "none", scrollbarWidth: "none" }}
          >
            {featuredProducts.map((product, index) => (
              <motion.div
                key={product.productCode}
                initial={{ opacity: 1, y: 0 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 50 }}
                className="w-[200px] sm:w-[230px] lg:w-[260px] shrink-0 snap-start"
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>

          {/* Ambient shadows for scroll cues on desktop */}
          {/* <div className="hidden md:block absolute top-0 left-0 h-[calc(100%-48px)] w-32 bg-gradient-to-r from-white via-white/40 to-transparent pointer-events-none z-10" />
                    <div className="hidden md:block absolute top-0 right-0 h-[calc(100%-48px)] w-32 bg-gradient-to-l from-white via-white/40 to-transparent pointer-events-none z-10" /> */}
        </div>
      </div>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}
