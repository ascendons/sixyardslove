import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Rangoli } from "./Rangoli";

interface PageHeroProps {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Extra content under the subtitle (badges, meta, etc). */
  children?: ReactNode;
}

/** Shared banner for inner pages: ink band, gold eyebrow, rotating rangoli. */
export function PageHero({ eyebrow, title, subtitle, children }: PageHeroProps) {
  return (
    <section className="relative overflow-hidden bg-forest">
      <Rangoli
        variant="lotus"
        speed={120}
        fillOpacity={0.06}
        className="absolute -right-24 top-1/2 -translate-y-1/2 w-[420px] md:w-[520px] text-secondary/30"
      />
      <Rangoli
        variant="star"
        speed={160}
        className="absolute -left-16 -bottom-20 w-56 text-secondary/10"
      />
      <div className="container-institutional relative py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-3xl"
        >
          {eyebrow && (
            <p className="section-label !text-ochre-light mb-5">{eyebrow}</p>
          )}
          <h1 className="text-ivory mb-5">{title}</h1>
          {subtitle && (
            <p className="text-lg md:text-xl text-ivory/70 leading-relaxed font-light">
              {subtitle}
            </p>
          )}
          {children}
        </motion.div>
      </div>
    </section>
  );
}
