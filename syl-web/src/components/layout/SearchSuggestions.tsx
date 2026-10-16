import React, { useState, useEffect, useRef } from "react";
import { Search, Loader2, X, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { productService } from "@/services/productService";
import { Product } from "@/data/products";
import { cn } from "@/lib/utils";
import { Link, useNavigate } from "react-router-dom";

interface SearchSuggestionsProps {
  isMobile?: boolean;
  onClose?: () => void;
}

export function SearchSuggestions({
  isMobile,
  onClose,
}: SearchSuggestionsProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.length < 3) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      setLoading(true);
      setIsOpen(true);
      try {
        const data = await productService.searchProducts(
          query,
          controller.signal,
        );
        setResults(data);
      } catch (error: any) {
        if (error.name !== "CanceledError" && error.name !== "AbortError") {
          console.error("Search failed", error);
        }
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [query]);

  const handleSelect = (productCode: string) => {
    if (!productCode) return;
    setIsOpen(false);
    setQuery("");
    navigate(`/product/${productCode}`);
    if (onClose) onClose();
  };

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full", isMobile ? "" : "max-w-2xl flex-1")}
    >
      <div className="relative group">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 3 && setIsOpen(true)}
          placeholder={
            isMobile ? "Search products..." : "Search trusted products..."
          }
          className={cn(
            "w-full bg-accent/30 border border-border/60 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50 border-transparent hover:border-primary/30",
            isMobile ? "px-4 py-2.5" : "px-6 py-3",
          )}
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {loading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-muted-foreground hover:text-primary"
            >
              <X className={cn(isMobile ? "h-4 w-4" : "h-5 w-5")} />
            </button>
          )}
          {!loading && !query && (
            <Search
              className={cn(
                "text-muted-foreground",
                isMobile ? "hidden" : "hidden md:block",
                isMobile ? "h-4 w-4" : "h-5 w-5",
              )}
            />
          )}
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className={cn(
              "absolute left-0 right-0 mt-2 bg-white rounded-2xl border border-border shadow-2xl overflow-hidden z-[1100]",
              isMobile
                ? "max-h-[60vh] overflow-y-auto"
                : "max-h-[400px] overflow-y-auto",
            )}
          >
            {results.length > 0 ? (
              <div className="p-2">
                <div className="px-4 py-2 text-[10px] uppercase font-black tracking-widest text-muted-foreground border-b border-border/40">
                  Products Found ({results.length})
                </div>
                {results.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleSelect(product.productCode)}
                    className="w-full flex items-center gap-4 p-3 hover:bg-accent/30 transition-colors rounded-xl text-left group"
                  >
                    <div className="h-12 w-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      <img
                        src={
                          (product.images && product.images[0]) ||
                          "/placeholder.png"
                        }
                        alt={product.productName}
                        className="h-full w-full object-cover group-hover:scale-110 transition-transform"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-forest truncate">
                        {product.productName}
                      </h4>
                      <p className="text-xs text-muted-foreground truncate">
                        {product.category}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-primary">
                        ₹{product.skus[0]?.sellingPrice || 0}
                      </div>
                      <div className="text-[9px] text-muted-foreground">
                        Starting from
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : !loading && query.length >= 3 ? (
              <div className="p-8 text-center">
                <div className="bg-accent/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Search className="h-6 w-6 text-muted-foreground/40" />
                </div>
                <p className="text-sm font-bold text-forest mb-1">
                  No results found
                </p>
                <p className="text-xs text-muted-foreground text-balance">
                  We couldn't find anything matching "{query}"
                </p>
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
