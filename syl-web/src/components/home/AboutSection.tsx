import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { WEBSITE_ARTICULATION } from "@/content/brand";
import { RevealOnScroll } from "@/components/common/RevealOnScroll";
import { Rangoli } from "@/components/common/Rangoli";
import mediaService, { MediaAsset } from "@/services/mediaService";
import logo from "@/assets/logo.png";

export function AboutSection() {
  const [asset, setAsset] = useState<MediaAsset | null>(null);

  useEffect(() => {
    mediaService
      .getAssetsByPlacement("About Us")
      .then((assets) => {
        if (assets.length > 0) setAsset(assets[0]);
      })
      .catch(() => {
        // silent — show placeholder
      });
  }, []);

  return (
    <section className="section-padding relative overflow-hidden">
      <div className="container-institutional">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Visual */}
          <RevealOnScroll className="relative mx-auto w-full max-w-md">
            <Rangoli
              variant="star"
              speed={100}
              className="absolute -top-16 -left-16 w-56 text-secondary/40"
            />
            <div className="relative aspect-[4/5] rounded-t-full overflow-hidden bg-parchment ring-1 ring-secondary/50 ring-offset-8 ring-offset-ivory">
              {asset?.imageUrl ? (
                <img
                  src={asset.imageUrl}
                  alt={asset.title || "About Six Yards Love"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary">
                  <Rangoli
                    variant="lotus"
                    speed={70}
                    className="absolute w-[130%] text-secondary/30"
                  />
                  <img src={logo} alt="" className="relative w-1/2" />
                </div>
              )}
            </div>
            <div className="absolute -bottom-6 -right-4 md:-right-10 bg-ivory rounded-2xl px-6 py-5 shadow-[0_20px_40px_-20px_hsl(var(--wine)/0.4)] border border-border">
              <p className="font-display text-4xl text-primary leading-none">
                6 yards
              </p>
              <p className="text-xs tracking-[0.2em] uppercase text-forest/60 mt-2">
                of pure grace
              </p>
            </div>
          </RevealOnScroll>

          {/* Copy */}
          <div>
            <RevealOnScroll>
              <p className="section-label mb-5">Our Story</p>
              <h2 className="text-forest mb-6">
                Love in <span className="italic text-primary">Every</span>{" "}
                Drape
              </h2>
            </RevealOnScroll>
            <RevealOnScroll delay={100}>
              <p className="text-lg text-forest/75 leading-relaxed mb-6 font-light">
                {WEBSITE_ARTICULATION}
              </p>
            </RevealOnScroll>
            <RevealOnScroll delay={200}>
              <div className="border-l-2 border-secondary pl-6 mb-10">
                <h3 className="font-display text-2xl text-forest mb-2">
                  What is Six Yards Love
                </h3>
                <p className="text-forest/65 leading-relaxed">
                  A saree label celebrating India's weaving traditions with a
                  contemporary eye, so every woman finds a drape she loves.
                </p>
              </div>
            </RevealOnScroll>
            <RevealOnScroll delay={300}>
              <Link
                to="/about"
                className="group inline-flex items-center gap-3 text-xs font-medium tracking-[0.25em] uppercase text-primary"
              >
                <span className="border-b border-primary/30 group-hover:border-primary pb-1 transition-colors">
                  Read Our Story
                </span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </RevealOnScroll>
          </div>
        </div>
      </div>
    </section>
  );
}
