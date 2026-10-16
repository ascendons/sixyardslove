import { Facebook, Instagram, Youtube } from "lucide-react";
import { motion } from "framer-motion";

const socials = [
  {
    name: "Instagram",
    icon: Instagram,
    href: "https://www.instagram.com/sixyardslove",
  },
  {
    name: "Facebook",
    icon: Facebook,
    href: "https://www.facebook.com/sixyardslove",
  },
  {
    name: "YouTube",
    icon: Youtube,
    href: "https://www.youtube.com/@sixyardslove",
  },
];

export function FloatingSocials() {
  return (
    <div className="fixed left-0 top-1/2 -translate-y-1/2 z-50 hidden md:flex flex-col gap-1 p-1.5 bg-forest/90 backdrop-blur-md rounded-r-2xl border border-l-0 border-secondary/30 shadow-[0_12px_30px_-12px_hsl(var(--forest)/0.6)]">
      {socials.map((social, index) => (
        <motion.a
          key={social.name}
          href={social.href}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ x: -30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          whileHover={{ x: 3 }}
          transition={{ delay: index * 0.08 + 0.4, duration: 0.5 }}
          className="group relative flex items-center justify-center p-2.5 rounded-xl text-secondary hover:bg-secondary hover:text-forest transition-colors duration-300"
          aria-label={social.name}
        >
          <social.icon size={18} strokeWidth={1.5} />
          <span className="absolute left-full ml-3 px-3 py-1.5 bg-forest text-ivory text-[11px] tracking-[0.2em] uppercase rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 whitespace-nowrap">
            {social.name}
          </span>
        </motion.a>
      ))}
    </div>
  );
}
