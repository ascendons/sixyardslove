import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight, Package } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { productService } from "@/services/productService";
import { SectionHeading } from "@/components/common/SectionHeading";

interface Category {
  id: string;
  name: string;
  isActive: boolean;
  imageUrl: string | null;
  children: Category[];
}

const ICONS = [Package];

const CATEGORY_COLORS = [
  "#C29A5B", // Gold
  "#7A1F3D", // Maroon
  "#B5485D", // Rose
  "#2F4858", // Peacock Blue
  "#5B3256", // Plum
  "#8C5A2B", // Bronze
  "#1F5F5B", // Teal
  "#A23E48", // Sindoor Red
];

export function ExpansionHero() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    productService
      .getCategories()
      .then((cats) => {
        const active = cats.filter((c: Category) => c.isActive !== false);
        setCategories(active);
        if (active.length > 0) {
          setActiveId(active[0].id);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (isPaused || categories.length === 0) return;

    const interval = setInterval(() => {
      setActiveId((prev) => {
        if (!prev) return categories[0]?.id;
        const currentIndex = categories.findIndex((c) => c.id === prev);
        const nextIndex = (currentIndex + 1) % categories.length;
        return categories[nextIndex]?.id;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [isPaused, categories]);

  const getCategoryImage = (category: Category): string => {
    if (category.imageUrl) return category.imageUrl;
    return "/placeholder.svg";
  };

  if (categories.length === 0) return null;

  return (
    <section className="section-padding overflow-hidden">
      <div className="container-institutional">
        <SectionHeading
          eyebrow="The Collections"
          title={
            <>
              Shop by <span className="italic text-primary">Weave</span>
            </>
          }
          className="mb-14"
        />
        {/* Expansion Carousel with Horizontal Scroll */}
        <motion.div
          className="relative w-full max-w-[1600px] mx-auto"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          variants={{
            animate: {
              transition: {
                staggerChildren: 0.15,
              },
            },
          }}
        >
          {/* Scrollable Container */}
          <div
            ref={scrollContainerRef}
            className="overflow-x-auto overflow-y-hidden scrollbar-hide"
          >
            <div
              className="flex gap-4 h-[450px] min-w-full justify-center"
              style={{
                width: "max-content",
              }}
            >
              {categories.map((category, index) => {
                const isActive = activeId === category.id;
                const IconComponent = ICONS[index % ICONS.length];
                const color = CATEGORY_COLORS[index % CATEGORY_COLORS.length];

                return (
                  <motion.div
                    key={category.id}
                    layout
                    onClick={() => setActiveId(category.id)}
                    variants={{
                      initial: { opacity: 0, x: -20, y: 20 },
                      animate: {
                        opacity: 1,
                        x: 0,
                        y: 0,
                        transition: { duration: 0.6 },
                      },
                    }}
                    className={cn(
                      "relative rounded-t-[999px] rounded-b-3xl overflow-hidden cursor-pointer shadow-[0_20px_40px_-20px_hsl(var(--wine)/0.5)] ring-1 ring-secondary/30 transition-all duration-700 ease-out flex-shrink-0",
                      isActive
                        ? "w-[85vw] sm:w-[70vw] md:w-[45vw] lg:w-[500px]"
                        : "w-[85vw] sm:w-[70vw] md:w-[45vw] lg:w-[180px]",
                    )}
                    onMouseEnter={() => setActiveId(category.id)}
                  >
                    {/* Background Image & Overlay */}
                    <motion.div
                      className="absolute inset-0"
                      animate={{ scale: isActive ? 1.1 : 1 }}
                      transition={{ duration: 0.7 }}
                    >
                      <img
                        src={getCategoryImage(category)}
                        alt={category.name}
                        className="w-full h-full object-cover"
                      />
                      <div
                        className="absolute inset-0 opacity-60 mix-blend-multiply"
                        style={{ backgroundColor: color }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    </motion.div>

                    {/* Content Container */}
                    <div className="absolute inset-0 p-6 flex flex-col justify-between z-10 text-white">
                      {/* Top Index Number */}
                      <div
                        className={cn(
                          "flex justify-between items-start transition-all duration-500",
                          isActive
                            ? "opacity-100 translate-y-0"
                            : "lg:opacity-100 opacity-60",
                        )}
                      >
                        <span className="text-4xl font-display font-bold text-white/20">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <IconComponent
                          className={cn(
                            "w-8 h-8 text-white/80",
                            isActive ? "opacity-100" : "lg:hidden",
                          )}
                        />
                      </div>

                      {/* Wrapper for conditional vertical vs horizontal layout */}
                      <div className="relative flex-1 flex flex-col justify-end">
                        {/* Collapsed Vertical Title (Desktop Only) */}
                        {!isActive && (
                          <div className="hidden lg:flex absolute inset-0 items-center justify-center">
                            <h3 className="text-2xl font-display font-bold tracking-widest uppercase whitespace-nowrap -rotate-90 text-white/70 origin-center">
                              {category.name}
                            </h3>
                          </div>
                        )}

                        {/* Expanded Content */}
                        <AnimatePresence mode="wait">
                          {isActive && (
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 10 }}
                              transition={{ delay: 0.1, duration: 0.3 }}
                              className="flex flex-col items-start gap-4 max-w-xl"
                            >
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-white/80 bg-white/10 backdrop-blur px-3 py-1 rounded-full w-fit">
                                  <IconComponent className="w-4 h-4" />
                                  {category.name}
                                </div>
                                <h2 className="text-2xl md:text-4xl font-display font-bold leading-none">
                                  {category.name}
                                </h2>
                              </div>

                              <Link
                                to={`/shop?category=${encodeURIComponent(category.name)}`}
                              >
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  className="group flex items-center gap-2 bg-ivory text-forest px-6 py-3 rounded-full text-xs font-medium tracking-[0.2em] uppercase mt-2 hover:bg-secondary transition-colors"
                                >
                                  Explore Collection
                                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </motion.button>
                              </Link>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Mobile Title (Always visible if active or just simple generic on mobile collapsed) */}
                        {!isActive && (
                          <div className="lg:hidden absolute bottom-0 left-0">
                            <h3 className="text-2xl font-display font-bold text-white/90">
                              {category.name}
                            </h3>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
