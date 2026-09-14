// components/ContentScroll.js
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Play, Loader, ChevronLeft, ChevronRight } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const AUTO_SCROLL_PX_PER_SEC = 24;      // gentle pace
const RESUME_AFTER_MS        = 5000;    // idle delay before auto-scroll resumes
const ITEMS_FETCH_LIMIT      = 40;      // how many items to pull

export default function ContentScroll() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lightbox, setLightbox] = useState(null);
  const [isPaused, setIsPaused] = useState(false);

  const trackRef = useRef(null);
  const rafRef = useRef(null);
  const lastTsRef = useRef(0);
  const resumeTimerRef = useRef(null);
  const isPausedRef = useRef(false);
  const singleSetWidthRef = useRef(0);

  // ------------------- fetch -------------------
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('content_scroll')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false })
        .limit(ITEMS_FETCH_LIMIT);

      if (cancelled) return;

      if (error) {
        console.error('ContentScroll fetch error:', error);
        setError(error.message);
        setItems([]);
      } else {
        setItems(data || []);
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // ------------------- pause / resume helpers -------------------
  const pauseAutoScroll = useCallback(() => {
    isPausedRef.current = true;
    setIsPaused(true);
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
  }, []);

  const scheduleResume = useCallback(() => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      isPausedRef.current = false;
      setIsPaused(false);
    }, RESUME_AFTER_MS);
  }, []);

  // ------------------- auto-scroll loop -------------------
  useEffect(() => {
    const track = trackRef.current;
    if (!track || items.length === 0) return;

    // measure the width of ONE full set of items (first half of the doubled list)
    const measure = () => {
      const total = track.scrollWidth;
      // we render items twice, so one logical "set" = half the scrollWidth
      singleSetWidthRef.current = total / 2;
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(track);

    const step = (ts) => {
      if (!lastTsRef.current) lastTsRef.current = ts;
      const dt = (ts - lastTsRef.current) / 1000; // seconds
      lastTsRef.current = ts;

      if (!isPausedRef.current && track) {
        track.scrollLeft += AUTO_SCROLL_PX_PER_SEC * dt;

        // seamless loop: when we've scrolled one full set, jump back by that set's width
        if (
          singleSetWidthRef.current > 0 &&
          track.scrollLeft >= singleSetWidthRef.current
        ) {
          track.scrollLeft -= singleSetWidthRef.current;
        }
      }

      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTsRef.current = 0;
      ro.disconnect();
    };
  }, [items]);

  // ------------------- user interaction pause -------------------
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const onInteract = () => {
      pauseAutoScroll();
      scheduleResume();
    };

    // wheel + touch + pointer + scroll all count as "user is controlling"
    track.addEventListener('wheel', onInteract, { passive: true });
    track.addEventListener('touchstart', onInteract, { passive: true });
    track.addEventListener('touchmove', onInteract, { passive: true });
    track.addEventListener('pointerdown', onInteract);
    track.addEventListener('scroll', () => {
      // if the scroll change wasn't caused by our RAF step, treat it as user input
      if (!isPausedRef.current) {
        pauseAutoScroll();
        scheduleResume();
      }
    }, { passive: true });

    return () => {
      track.removeEventListener('wheel', onInteract);
      track.removeEventListener('touchstart', onInteract);
      track.removeEventListener('touchmove', onInteract);
      track.removeEventListener('pointerdown', onInteract);
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, [pauseAutoScroll, scheduleResume]);

  // ------------------- lightbox keyboard + scroll lock -------------------
  useEffect(() => {
    if (!lightbox) return;
    document.body.style.overflow = 'hidden';

    const onKey = (e) => {
      if (e.key === 'Escape') setLightbox(null);
      if (e.key === 'ArrowRight') moveLightbox(1);
      if (e.key === 'ArrowLeft') moveLightbox(-1);
    };
    window.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [lightbox]);

  const moveLightbox = (dir) => {
    if (!lightbox) return;
    const idx = items.findIndex((i) => i.id === lightbox.id);
    if (idx === -1) return;
    const next = (idx + dir + items.length) % items.length;
    setLightbox(items[next]);
  };

  // ------------------- early returns -------------------
  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader className="w-6 h-6 text-amber-500 animate-spin" />
      </div>
    );
  }

  if (error || items.length === 0) {
    return null; // silent — the section just disappears if there's nothing
  }

  // render each item twice for the seamless loop
  const loopItems = [...items, ...items];

  return (
    <>
      <section className="w-full py-3">
        <div
          ref={trackRef}
          className="
            flex gap-3 md:gap-4 overflow-x-auto
            [scrollbar-width:none] [-ms-overflow-style:none]
            [&::-webkit-scrollbar]:hidden
            px-4 md:px-6
            select-none
          "
          style={{ touchAction: 'pan-x' }}
        >
          {loopItems.map((item, i) => (
            <ContentCard
              key={`${item.id}-${i}`}
              item={item}
              onClick={() => setLightbox(item)}
            />
          ))}
        </div>

        {/* subtle "paused" hint */}
        <AnimatePresence>
          {isPaused && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="flex justify-center mt-1"
            >
              <span className="text-[10px] text-white/30">
                Auto-scroll resumes in a few seconds…
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ---------- Lightbox ---------- */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setLightbox(null)}
            role="dialog"
            aria-modal="true"
          >
            <button
              onClick={() => setLightbox(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              aria-label="Close"
            >
              <X className="w-6 h-6 text-white" />
            </button>

            {items.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); moveLightbox(-1); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                  aria-label="Previous"
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); moveLightbox(1); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                  aria-label="Next"
                >
                  <ChevronRight className="w-6 h-6 text-white" />
                </button>
              </>
            )}

            <motion.div
              key={lightbox.id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative max-w-5xl w-full max-h-[85vh] flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              {lightbox.type === 'video' ? (
                <video
                  src={lightbox.media_url}
                  controls
                  autoPlay
                  playsInline
                  className="max-h-[80vh] w-auto max-w-full rounded-xl"
                />
              ) : (
                <img
                  src={lightbox.media_url}
                  alt={lightbox.caption || ''}
                  className="max-h-[80vh] w-auto max-w-full object-contain rounded-xl"
                />
              )}

              {lightbox.caption && (
                <p className="text-white/80 text-sm text-center mt-4 px-4">
                  {lightbox.caption}
                </p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ------------------- Card -------------------
function ContentCard({ item, onClick }) {
  return (
    <button
      onClick={onClick}
      className="
        group relative flex-shrink-0 overflow-hidden rounded-xl
        bg-white/5 border border-white/10
        hover:border-amber-500/60 transition-colors
        w-[44vw] sm:w-[30vw] md:w-[calc((100%-3rem)/5)] lg:w-[calc((100%-4rem)/5)]
        aspect-[3/4]
      "
    >
      {item.type === 'video' ? (
        <>
          <video
            src={item.media_url}
            muted
            playsInline
            preload="metadata"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-black/60 backdrop-blur flex items-center justify-center border border-white/20 group-hover:bg-amber-500 group-hover:border-amber-500 transition">
              <Play className="w-4 h-4 md:w-5 md:h-5 text-white group-hover:text-black ml-0.5" fill="currentColor" />
            </div>
          </div>
        </>
      ) : (
        <img
          src={item.media_url}
          alt={item.caption || ''}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      {item.caption && (
        <p className="absolute bottom-0 left-0 right-0 p-2 text-[10px] md:text-xs text-white/90 text-left line-clamp-2">
          {item.caption}
        </p>
      )}
    </button>
  );
}