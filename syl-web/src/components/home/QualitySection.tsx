import { Sparkles, Gem, Truck, RotateCcw } from "lucide-react";
import { Rangoli } from "@/components/common/Rangoli";
import { SectionHeading } from "@/components/common/SectionHeading";
import { RevealOnScroll } from "@/components/common/RevealOnScroll";

const qualityPillars = [
  {
    icon: Sparkles,
    title: "Handpicked Collection",
    description:
      "Every saree is personally selected for its weave, colour, and drape.",
  },
  {
    icon: Gem,
    title: "Authentic Fabrics",
    description:
      "Genuine silks, cottons, and handlooms, described honestly, fabric by fabric.",
  },
  {
    icon: Truck,
    title: "Delivered Across India",
    description:
      "Carefully packed and shipped to your doorstep with live order tracking.",
  },
  {
    icon: RotateCcw,
    title: "Easy Returns",
    description:
      "Shop with confidence with simple returns and secure payments.",
  },
];

export function QualitySection() {
  return (
    <section className="relative overflow-hidden bg-forest section-padding">
      <Rangoli
        variant="mandala"
        speed={180}
        fillOpacity={0.06}
        className="absolute -right-40 top-1/2 -translate-y-1/2 w-[640px] text-secondary/25"
      />
      <Rangoli
        variant="star"
        speed={120}
        className="absolute -left-24 -bottom-24 w-72 text-secondary/15"
      />

      <div className="container-institutional relative">
        <SectionHeading
          inverted
          eyebrow="Our Promise"
          title={
            <>
              Why <span className="italic text-gold-foil">Six Yards Love</span>
            </>
          }
          subtitle="Sarees chosen with love, checked with care, and delivered with a promise of quality."
          className="mb-16"
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-secondary/20 rounded-3xl overflow-hidden border border-secondary/20">
          {qualityPillars.map((pillar, i) => (
            <RevealOnScroll
              key={pillar.title}
              delay={i * 100}
              className="bg-forest p-8 md:p-10 group hover:bg-forest-light transition-colors duration-500"
            >
              <div className="w-14 h-14 mb-6 rounded-full border border-secondary/40 flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-forest transition-colors duration-500">
                <pillar.icon className="w-6 h-6" strokeWidth={1.5} />
              </div>
              <h3 className="font-display text-2xl text-ivory mb-3">
                {pillar.title}
              </h3>
              <p className="text-ivory/60 text-[15px] leading-relaxed font-light">
                {pillar.description}
              </p>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
