import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Rangoli } from "./Rangoli";
import { RevealOnScroll } from "./RevealOnScroll";

interface SectionHeadingProps {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  align?: "center" | "left";
  /** Light text for dark sections. */
  inverted?: boolean;
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
  inverted = false,
  className,
}: SectionHeadingProps) {
  const centered = align === "center";
  return (
    <RevealOnScroll
      className={cn(
        "max-w-3xl",
        centered ? "mx-auto text-center" : "text-left",
        className,
      )}
    >
      <Rangoli
        variant="lotus"
        speed={40}
        strokeWidth={2.5}
        fillOpacity={0.2}
        className={cn(
          "w-10 h-10 mb-5 text-secondary",
          centered ? "mx-auto" : "",
        )}
      />
      {eyebrow && (
        <p
          className={cn(
            "section-label mb-4",
            inverted && "text-ochre-light",
          )}
        >
          {eyebrow}
        </p>
      )}
      <h2 className={cn("mb-5", inverted ? "text-ivory" : "text-forest")}>
        {title}
      </h2>
      {subtitle && (
        <p
          className={cn(
            "text-lg font-light leading-relaxed",
            inverted ? "text-ivory/70" : "text-forest/65",
          )}
        >
          {subtitle}
        </p>
      )}
    </RevealOnScroll>
  );
}
