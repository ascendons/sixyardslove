import React, { useRef, useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import shortsService, { ShortResponse } from "@/services/shortsService";
import {
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  X,
  Share2,
  Maximize2,
  Play,
  Pause,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { SectionHeading } from "@/components/common/SectionHeading";
import { AnimatePresence, motion } from "framer-motion";

// ── Brand SVG icons ──────────────────────────────────────────────────────────

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.791-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
  </svg>
);

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
  </svg>
);

const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

// ── Share helpers ─────────────────────────────────────────────────────────────

function buildShareUrl(short: ShortResponse): string {
  // Prefer the social URL; fall back to the page with an anchor
  return (
    short.socialUrl ||
    `${window.location.origin}${window.location.pathname}#shorts`
  );
}

function shareText(short: ShortResponse): string {
  return short.caption
    ? `${short.caption} — Six Yards Love`
    : "Check out this reel on Six Yards Love!";
}

function openShare(href: string) {
  window.open(href, "_blank", "noopener,noreferrer,width=600,height=500");
}

function handleFacebook(short: ShortResponse) {
  openShare(
    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(buildShareUrl(short))}`,
  );
}

function handleWhatsApp(short: ShortResponse) {
  openShare(
    `https://wa.me/?text=${encodeURIComponent(`${shareText(short)} ${buildShareUrl(short)}`)}`,
  );
}

function handleLinkedIn(short: ShortResponse) {
  openShare(
    `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(buildShareUrl(short))}`,
  );
}

function handleInstagram(short: ShortResponse) {
  // Instagram has no web share URL — copy to clipboard and let user paste in the app
  navigator.clipboard
    .writeText(buildShareUrl(short))
    .then(() => {
      toast.success("Link copied! Open Instagram and paste to share.");
    })
    .catch(() => {
      toast.error("Could not copy link.");
    });
}

// ── Share button row ──────────────────────────────────────────────────────────

const ShareButtons: React.FC<{ short: ShortResponse; className?: string }> = ({
  short,
  className,
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={cn("flex items-center gap-2", className)}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        title="Share"
        onClick={() => setOpen((o) => !o)}
        className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center hover:bg-white/30 transition-colors"
      >
        <Share2 className="w-3.5 h-3.5" />
      </button>

      {open && (
        <>
          <button
            title="Share on Facebook"
            onClick={() => handleFacebook(short)}
            className="w-7 h-7 rounded-full bg-[#1877F2] text-white flex items-center justify-center hover:opacity-80 transition-opacity animate-in fade-in zoom-in-75 duration-150"
          >
            <FacebookIcon />
          </button>
          <button
            title="Share on WhatsApp"
            onClick={() => handleWhatsApp(short)}
            className="w-7 h-7 rounded-full bg-[#25D366] text-white flex items-center justify-center hover:opacity-80 transition-opacity animate-in fade-in zoom-in-75 duration-150"
          >
            <WhatsAppIcon />
          </button>
          <button
            title="Share on Instagram (copy link)"
            onClick={() => handleInstagram(short)}
            className="w-7 h-7 rounded-full bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white flex items-center justify-center hover:opacity-80 transition-opacity animate-in fade-in zoom-in-75 duration-150"
          >
            <InstagramIcon />
          </button>
          <button
            title="Share on LinkedIn"
            onClick={() => handleLinkedIn(short)}
            className="w-7 h-7 rounded-full bg-[#0A66C2] text-white flex items-center justify-center hover:opacity-80 transition-opacity animate-in fade-in zoom-in-75 duration-150"
          >
            <LinkedInIcon />
          </button>
        </>
      )}
    </div>
  );
};

// ── Play/Pause toggle icon (reads live video state) ───────────────────────────

const PlayPauseIcon: React.FC<{
  videoRef: React.RefObject<HTMLVideoElement>;
}> = ({ videoRef }) => {
  const [paused, setPaused] = useState(true);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onPlay = () => setPaused(false);
    const onPause = () => setPaused(true);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    setPaused(v.paused);
    return () => {
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
    };
  }, [videoRef]);

  return paused ? (
    <Play className="w-3.5 h-3.5 ml-0.5" />
  ) : (
    <Pause className="w-3.5 h-3.5" />
  );
};

// ── Lightbox ──────────────────────────────────────────────────────────────────

const SLIDE_VARIANTS = {
  enter: (dir: number) => ({
    x: dir > 0 ? 120 : -120,
    opacity: 0,
    scale: 0.92,
  }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -120 : 120, opacity: 0, scale: 0.92 }),
};

const Lightbox: React.FC<{
  shorts: ShortResponse[];
  index: number;
  onClose: () => void;
  onNav: (idx: number) => void;
}> = ({ shorts, index, onClose, onNav }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [direction, setDirection] = useState(0);
  const short = shorts[index];
  const prev = index > 0 ? shorts[index - 1] : null;
  const next = index < shorts.length - 1 ? shorts[index + 1] : null;

  const goNext = useCallback(() => {
    if (next) {
      setDirection(1);
      onNav(index + 1);
    }
  }, [next, index, onNav]);
  const goPrev = useCallback(() => {
    if (prev) {
      setDirection(-1);
      onNav(index - 1);
    }
  }, [prev, index, onNav]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.load();
    v.play().catch(() => {});
  }, [index]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goPrev, goNext, onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/90 backdrop-blur-sm overflow-y-auto pt-52 pb-16"
      onClick={onClose}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Three-panel row */}
      <div className="flex items-center justify-center w-full px-4 gap-20 sm:gap-28 md:gap-40">
        {/* ← Arrow + prev thumbnail */}
        <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            disabled={!prev}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="w-24 sm:w-28 md:w-32">
            {prev && (
              <motion.div
                key={`prev-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="rounded-xl overflow-hidden aspect-[9/16] bg-black cursor-pointer opacity-60 hover:opacity-90 transition-opacity shadow-lg"
                onClick={(e) => {
                  e.stopPropagation();
                  goPrev();
                }}
              >
                <video
                  src={prev.fileUrl}
                  className="w-full h-full object-cover"
                  preload="metadata"
                  muted
                  playsInline
                />
              </motion.div>
            )}
          </div>
        </div>

        {/* Centre — active video with slide animation */}
        <div
          className="flex-shrink-0 w-[200px] sm:w-[240px] md:w-[270px] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <AnimatePresence mode="popLayout" custom={direction}>
            <motion.div
              key={index}
              custom={direction}
              variants={SLIDE_VARIANTS}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
              className="w-full"
            >
              <div className="relative w-full rounded-2xl overflow-hidden aspect-[9/16] bg-black shadow-2xl">
                <video
                  ref={videoRef}
                  src={short.fileUrl}
                  className="w-full h-full object-cover"
                  loop
                  playsInline
                />

                {/* Top action bar */}
                <div
                  className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/70 to-transparent pt-3 pb-6 px-3 flex items-center gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => {
                      const v = videoRef.current;
                      if (!v) return;
                      v.paused ? v.play() : v.pause();
                    }}
                    className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center hover:bg-white/30 transition-colors"
                  >
                    <PlayPauseIcon videoRef={videoRef} />
                  </button>
                  <button
                    onClick={() => videoRef.current?.requestFullscreen?.()}
                    className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center hover:bg-white/30 transition-colors"
                    title="Full screen"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                  <ShareButtons short={short} />
                  {short.socialUrl && (
                    <a
                      href={short.socialUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1.5 text-white/70 hover:text-white text-xs transition-colors w-fit pointer-events-auto"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                {/* Bottom overlay */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent pt-16 pb-4 px-4 flex flex-col gap-2 pointer-events-none">
                  {short.caption && (
                    <p className="text-white text-sm font-medium line-clamp-2 leading-snug">
                      {short.caption}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Counter */}
          <p className="text-center text-white/40 text-xs mt-3">
            {index + 1} / {shorts.length}
          </p>
        </div>

        {/* Next thumbnail + → Arrow */}
        <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
          <div className="w-24 sm:w-28 md:w-32">
            {next && (
              <motion.div
                key={`next-${index}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="rounded-xl overflow-hidden aspect-[9/16] bg-black cursor-pointer opacity-60 hover:opacity-90 transition-opacity shadow-lg"
                onClick={(e) => {
                  e.stopPropagation();
                  goNext();
                }}
              >
                <video
                  src={next.fileUrl}
                  className="w-full h-full object-cover"
                  preload="metadata"
                  muted
                  playsInline
                />
              </motion.div>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            disabled={!next}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main section ──────────────────────────────────────────────────────────────

const ShortsSection: React.FC = () => {
  const { data: shorts = [] } = useQuery({
    queryKey: ["shorts-public"],
    queryFn: shortsService.getActive,
    staleTime: 60_000,
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({
      left: dir === "left" ? -220 : 220,
      behavior: "smooth",
    });
  };

  const handleNav = useCallback((idx: number) => setLightboxIdx(idx), []);
  const handleClose = useCallback(() => setLightboxIdx(null), []);

  if (shorts.length === 0) return null;

  return (
    <>
      <section id="shorts" className="section-padding bg-parchment/60">
        <div className="container-institutional">
          <div className="flex items-end justify-between mb-10 gap-6">
            <SectionHeading
              align="left"
              eyebrow="From Our Studio"
              title={
                <>
                  Shorts <span className="italic text-primary">&</span> Reels
                </>
              }
            />
            <div className="flex gap-2">
              <Button
                size="icon"
                variant="outline"
                onClick={() => scroll("left")}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={() => scroll("right")}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide pt-2 pb-2 snap-x snap-mandatory"
          >
            {shorts.map((s, idx) => (
              <div key={s.id} className="flex-none w-44 sm:w-52 snap-start">
                {/* Video card — all info overlaid */}
                <div
                  className="relative rounded-2xl overflow-hidden aspect-[9/16] bg-black shadow-lg cursor-pointer group"
                  onClick={() => setLightboxIdx(idx)}
                >
                  <video
                    src={s.fileUrl}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                    preload="metadata"
                  />

                  {/* Bottom gradient + content */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pt-12 pb-3 px-3 flex flex-col gap-2">
                    {s.caption && (
                      <p className="text-white text-xs font-medium line-clamp-2 leading-snug">
                        {s.caption}
                      </p>
                    )}
                    {s.socialUrl && (
                      <a
                        href={s.socialUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 text-white/70 hover:text-white text-[10px] transition-colors w-fit"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    <ShareButtons short={s} />
                  </div>

                  {/* Play icon (centre, fades on hover) */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <div className="w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[14px] border-l-white ml-1" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {lightboxIdx !== null && (
        <Lightbox
          shorts={shorts}
          index={lightboxIdx}
          onClose={handleClose}
          onNav={handleNav}
        />
      )}
    </>
  );
};

export default ShortsSection;
