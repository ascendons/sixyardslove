import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles, Truck, RotateCcw } from "lucide-react";
import { Rangoli } from "@/components/common/Rangoli";
import mediaService, { MediaAsset } from "@/services/mediaService";
import logo from "@/assets/logo.png";

const promises = [
  { icon: Sparkles, label: "Handpicked" },
  { icon: Truck, label: "Pan-India Delivery" },
  { icon: RotateCcw, label: "Easy Returns" },
];

export function RangoliHero() {
  const [slides, setSlides] = useState<MediaAsset[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    mediaService
      .getAssetsByPlacement("Carousel1")
      .then((assets) => setSlides(assets.filter((a) => a.isActive !== false)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, [slides]);

  const current = slides[index];

  return (
    <section className="relative overflow-hidden hero-pattern">
      {/* Ambient rangolis */}
      <Rangoli
        variant="star"
        speed={140}
        className="absolute -top-40 -left-40 w-80 md:w-[420px] text-secondary/15"
      />
      <Rangoli
        variant="mandala"
        speed={160}
        className="absolute -bottom-32 left-1/3 w-64 text-primary/10 hidden lg:block"
      />

      <div className="container-institutional relative">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center py-14 md:py-20 lg:py-24">
          {/* Copy */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 text-center lg:text-left"
          >
            <p className="section-label mb-6">The Saree Edit</p>
            <h1 className="text-forest mb-6">
              Six Yards of{" "}
              <span className="italic text-gold-foil">Timeless</span> Grace
            </h1>
            <p className="text-lg md:text-xl text-forest/70 max-w-xl mx-auto lg:mx-0 mb-10 font-light">
              Handpicked sarees for every occasion — from everyday cottons to
              heirloom silks. Every drape tells a story. Find yours.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link
                to="/shop"
                className="group inline-flex items-center justify-center gap-3 h-14 px-9 rounded-full bg-primary text-primary-foreground text-xs font-medium tracking-[0.25em] uppercase hover:bg-wine-light transition-colors shadow-[0_18px_40px_-16px_hsl(var(--wine)/0.6)]"
              >
                Shop the Collection
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/bulk-shop"
                className="inline-flex items-center justify-center h-14 px-9 rounded-full border border-forest/20 text-forest text-xs font-medium tracking-[0.25em] uppercase hover:border-secondary hover:bg-secondary/10 transition-colors"
              >
                Wedding & Bulk
              </Link>
            </div>

            <ul className="mt-12 flex flex-wrap justify-center lg:justify-start gap-x-8 gap-y-3">
              {promises.map(({ icon: Icon, label }) => (
                <li
                  key={label}
                  className="flex items-center gap-2 text-sm text-forest/70"
                >
                  <Icon className="h-4 w-4 text-ochre" strokeWidth={1.5} />
                  {label}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Arch visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
            className="relative mx-auto w-full max-w-[520px] aspect-square flex items-center justify-center"
          >
            <Rangoli
              variant="lotus"
              speed={80}
              fillOpacity={0.1}
              className="absolute inset-0 w-full text-secondary"
            />
            <div className="relative w-[58%] aspect-[3/4] rounded-t-full rounded-b-[2rem] overflow-hidden bg-primary ring-1 ring-secondary/60 ring-offset-8 ring-offset-ivory shadow-[0_30px_60px_-20px_hsl(var(--wine)/0.55)]">
              <AnimatePresence mode="wait">
                {current?.imageUrl ? (
                  <motion.img
                    key={current.id}
                    src={current.imageUrl}
                    alt={current.title || "Six Yards Love saree"}
                    initial={{ opacity: 0, scale: 1.08 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.1 }}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <motion.div
                    key="fallback"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <Rangoli
                      variant="mandala"
                      speed={60}
                      fillOpacity={0.15}
                      className="absolute w-[150%] text-secondary/40"
                    />
                    <img
                      src={logo}
                      alt=""
                      className="relative w-1/2 drop-shadow-lg"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="absolute inset-0 bg-gradient-to-t from-forest/50 via-transparent to-transparent" />
              {current?.title && (
                <p className="absolute bottom-6 inset-x-4 text-center font-display italic text-xl text-ivory">
                  {current.title}
                </p>
              )}
            </div>

            {slides.length > 1 && (
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
                {slides.map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => setIndex(i)}
                    aria-label={`Show slide ${i + 1}`}
                    className={`h-1.5 rounded-full transition-all ${i === index ? "w-8 bg-primary" : "w-1.5 bg-forest/25"}`}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
