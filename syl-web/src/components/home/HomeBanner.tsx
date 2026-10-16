import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import mediaService, { MediaAsset } from "@/services/mediaService";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const HomeBanner: React.FC = () => {
  const [banners, setBanners] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const data = await mediaService.getAssetsByPlacement("Banner");
        setBanners(data.filter((a) => a.isActive !== false));
      } catch (error) {
        console.error("Failed to fetch banners", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBanners();
  }, []);

  const autoRotateRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (banners.length <= 1) return;
    autoRotateRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 6000);
    return () => {
      if (autoRotateRef.current) clearInterval(autoRotateRef.current);
    };
  }, [banners]);

  const stopAutoRotate = () => {
    if (autoRotateRef.current) {
      clearInterval(autoRotateRef.current);
      autoRotateRef.current = null;
    }
    setTimeout(() => {
      if (banners.length > 1) {
        autoRotateRef.current = setInterval(() => {
          setCurrentIndex((prev) => (prev + 1) % banners.length);
        }, 6000);
      }
    }, 8000);
  };

  const handleDotClick = (index: number) => {
    setCurrentIndex(index);
    stopAutoRotate();
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
    stopAutoRotate();
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
    stopAutoRotate();
  };

  if (loading) {
    return <Skeleton className="w-full aspect-[1104/704]" />;
  }

  if (banners.length === 0) return null;

  const currentBanner = banners[currentIndex];

  return (
    <div className="relative w-full aspect-[1104/704] overflow-hidden bg-ivory">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentBanner.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0"
        >
          <img
            src={currentBanner.imageUrl}
            alt={currentBanner.title || "Banner"}
            className="w-full h-full object-cover"
          />
          {(currentBanner.title || currentBanner.subtitle) && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center text-center p-6">
              <div className="max-w-4xl space-y-4">
                {currentBanner.title && (
                  <motion.h2
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-3xl md:text-5xl lg:text-7xl font-display font-bold text-white drop-shadow-lg"
                  >
                    {currentBanner.title}
                  </motion.h2>
                )}
                {currentBanner.subtitle && (
                  <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-lg md:text-2xl text-white/90 font-medium drop-shadow-md"
                  >
                    {currentBanner.subtitle}
                  </motion.p>
                )}
                {currentBanner.linkUrl && (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="pt-4"
                  >
                    <a
                      href={currentBanner.linkUrl}
                      className="inline-block bg-white text-forest hover:bg-forest hover:text-white px-8 py-3 rounded-full font-bold transition-all shadow-xl"
                    >
                      Explore Now
                    </a>
                  </motion.div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {banners.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-sm transition-all z-10"
          >
            <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-sm transition-all z-10"
          >
            <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
          </button>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => handleDotClick(i)}
                className={cn(
                  "w-2 h-2 md:w-3 md:h-3 rounded-full transition-all",
                  i === currentIndex
                    ? "bg-white scale-125"
                    : "bg-white/40 hover:bg-white/60",
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
