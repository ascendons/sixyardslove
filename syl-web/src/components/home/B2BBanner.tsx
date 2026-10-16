import { Link } from "react-router-dom";
import { ArrowRight, Gift, Sparkles, HeartHandshake } from "lucide-react";
import { RevealOnScroll } from "@/components/common/RevealOnScroll";
import { Rangoli } from "@/components/common/Rangoli";

const perks = [
  { icon: Gift, title: "Special Pricing", text: "Better rates on bulk orders" },
  {
    icon: Sparkles,
    title: "Personal Curation",
    text: "Help choosing colours & weaves",
  },
  {
    icon: HeartHandshake,
    title: "Dedicated Support",
    text: "From first call to delivery",
  },
];

export function B2BBanner() {
  return (
    <section className="py-16 md:py-24">
      <div className="container-institutional">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-primary px-6 py-16 md:px-16 md:py-20">
          <Rangoli
            variant="lotus"
            speed={120}
            className="absolute -right-32 -top-32 w-[460px] text-secondary/30"
          />
          <Rangoli
            variant="mandala"
            speed={150}
            className="absolute -left-20 -bottom-28 w-72 text-secondary/20"
          />

          <RevealOnScroll className="relative max-w-3xl">
            <p className="section-label !text-ochre-light mb-6">
              Weddings & Gifting
            </p>
            <h2 className="text-ivory mb-6">
              Planning a wedding or{" "}
              <span className="italic text-gold-foil">gifting in bulk?</span>
            </h2>
            <p className="text-ivory/75 text-lg md:text-xl mb-10 max-w-2xl font-light leading-relaxed">
              From bridal trousseaus to family functions and corporate gifting,
              we curate sarees in bulk with special pricing.
            </p>

            <div className="grid sm:grid-cols-3 gap-6 mb-12">
              {perks.map(({ icon: Icon, title, text }) => (
                <div key={title} className="flex items-start gap-3">
                  <div className="w-10 h-10 shrink-0 rounded-full border border-secondary/50 flex items-center justify-center text-secondary">
                    <Icon className="w-4 h-4" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h4 className="font-display text-lg text-ivory">{title}</h4>
                    <p className="text-sm text-ivory/60">{text}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/contact"
                className="group inline-flex items-center justify-center gap-3 h-14 px-9 rounded-full bg-secondary text-secondary-foreground text-xs font-medium tracking-[0.25em] uppercase hover:bg-ochre-light transition-colors"
              >
                Enquire Now
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/bulk-shop"
                className="inline-flex items-center justify-center h-14 px-9 rounded-full border border-ivory/30 text-ivory text-xs font-medium tracking-[0.25em] uppercase hover:bg-ivory/10 transition-colors"
              >
                Browse Bulk Orders
              </Link>
            </div>
          </RevealOnScroll>
        </div>
      </div>
    </section>
  );
}
