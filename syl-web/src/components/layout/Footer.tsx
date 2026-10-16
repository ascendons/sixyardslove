import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FOOTER_TAGLINE, NAV_ITEMS } from "@/content/brand";
import {
  Facebook,
  Instagram,
  Youtube,
  Mail,
  Phone,
  MapPin,
  Truck,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";
import { productService } from "@/services/productService";
import { Rangoli } from "@/components/common/Rangoli";
import logo from "@/assets/logo.png";

const platformLinks = NAV_ITEMS.filter((i) =>
  ["About Six Yards Love", "Shop", "Product Categories", "Contact"].includes(
    i.name,
  ),
);

const shopLinks = [
  { name: "All Sarees", href: "/shop" },
  { name: "Bulk & Wedding Orders", href: "/bulk-shop" },
  { name: "Gifting", href: "/contact" },
  { name: "My Account", href: "/account" },
];

const policyLinks = [
  { name: "Terms & Conditions", href: "/terms" },
  { name: "Privacy Policy", href: "/privacy" },
  { name: "Shipping Policy", href: "/shipping" },
  { name: "Returns & Refunds", href: "/returns" },
];

const categoryLinks = [
  { name: "Silk Sarees", href: "/categories/silk" },
  { name: "Cotton Sarees", href: "/categories/cotton" },
  { name: "Handloom", href: "/categories/handloom" },
  { name: "Designer & Party Wear", href: "/categories/designer" },
  { name: "Blouses & Accessories", href: "/categories/accessories" },
];

const socials = [
  { Icon: Instagram, href: "https://www.instagram.com/sixyardslove", label: "Instagram" },
  { Icon: Facebook, href: "https://www.facebook.com/sixyardslove", label: "Facebook" },
  { Icon: Youtube, href: "https://www.youtube.com/@sixyardslove", label: "YouTube" },
];

const badges = [
  { Icon: Truck, label: "Pan-India Delivery" },
  { Icon: ShieldCheck, label: "Secure Payments" },
  { Icon: RotateCcw, label: "Easy Returns" },
];

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { name: string; href: string }[];
}) {
  return (
    <div>
      <h4 className="font-sans text-[11px] font-medium tracking-[0.3em] uppercase text-secondary mb-6">
        {title}
      </h4>
      <ul className="space-y-3">
        {links.map((item) => (
          <li key={item.name}>
            <Link
              to={item.href}
              className="text-[15px] text-ivory/65 hover:text-ivory transition-colors"
            >
              {item.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  const [catLinks, setCatLinks] = useState(categoryLinks);

  useEffect(() => {
    productService
      .getCategories()
      .then((cats: { name: string; isActive?: boolean }[]) => {
        const activeCats = cats.filter((c) => c.isActive !== false);
        if (activeCats.length === 0) return;
        setCatLinks(
          activeCats.slice(0, 5).map((c) => ({
            name: c.name,
            href: `/shop?category=${encodeURIComponent(c.name)}`,
          })),
        );
      })
      .catch(() => {});
  }, []);

  return (
    <footer className="relative overflow-hidden bg-forest text-ivory">
      <Rangoli
        variant="lotus"
        speed={200}
        fillOpacity={0.05}
        className="absolute -right-48 -top-48 w-[620px] text-secondary/15"
      />

      {/* Promise strip */}
      <div className="relative border-b border-ivory/10">
        <div className="container-institutional grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-ivory/10">
          {badges.map(({ Icon, label }) => (
            <div
              key={label}
              className="flex items-center justify-center gap-3 py-6 text-ivory/80"
            >
              <Icon className="h-5 w-5 text-secondary" strokeWidth={1.5} />
              <span className="text-[11px] tracking-[0.3em] uppercase">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="container-institutional relative pt-20 pb-10">
        <div className="grid grid-cols-2 lg:grid-cols-12 gap-x-8 gap-y-12 mb-20">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-4">
            <Link to="/" className="inline-block mb-6" aria-label="Six Yards Love">
              <img src={logo} alt="Six Yards Love" className="h-20 w-auto" />
            </Link>
            <p className="font-display italic text-2xl text-ivory mb-3">
              Six Yards. Endless Love.
            </p>
            <p className="text-ivory/55 max-w-sm leading-relaxed text-[15px]">
              {FOOTER_TAGLINE}
            </p>

            <ul className="mt-8 space-y-3 text-[15px] text-ivory/65">
              <li className="flex items-start gap-3">
                <Mail className="h-4 w-4 mt-1 text-secondary shrink-0" strokeWidth={1.5} />
                <a
                  href="mailto:customer-support@sixyardslove.com"
                  className="hover:text-ivory transition-colors"
                >
                  customer-support@sixyardslove.com
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="h-4 w-4 mt-1 text-secondary shrink-0" strokeWidth={1.5} />
                <a href="tel:+910000000000" className="hover:text-ivory transition-colors">
                  +91 00000 00000
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="h-4 w-4 mt-1 text-secondary shrink-0" strokeWidth={1.5} />
                <span>
                  [SYL legal entity TBD]
                  <br />
                  [SYL address TBD]
                </span>
              </li>
            </ul>

            <div className="flex gap-3 mt-8" aria-label="Footer social links">
              {socials.map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-10 h-10 rounded-full border border-ivory/15 flex items-center justify-center text-ivory/70 hover:bg-secondary hover:border-secondary hover:text-forest transition-all"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2">
            <FooterColumn title="Explore" links={platformLinks} />
          </div>
          <div className="lg:col-span-2">
            <FooterColumn title="Collections" links={catLinks} />
          </div>
          <div className="lg:col-span-2">
            <FooterColumn title="Shop & Services" links={shopLinks} />
          </div>
          <div className="lg:col-span-2">
            <FooterColumn title="Policies" links={policyLinks} />
          </div>
        </div>

        {/* Bottom bar */}
        <div className="ornament-divider mb-8">
          <Rangoli variant="star" still className="w-6 h-6 text-secondary" />
        </div>
        <p className="text-center text-ivory/40 text-[11px] tracking-[0.3em] uppercase">
          © {new Date().getFullYear()} Six Yards Love. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
