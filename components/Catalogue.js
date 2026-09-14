// components/Catalogue.js
"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { Play, X, ImageIcon, Video } from "lucide-react";

/**
 * Extracts a YouTube video ID from any common YouTube URL form.
 * Returns null if not a YouTube URL.
 */
function getYouTubeId(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    const host = u.hostname.replace("www.", "").replace("m.", "");

    if (host === "youtube.com") {
      if (u.searchParams.get("v")) return u.searchParams.get("v");
      if (u.pathname.startsWith("/embed/")) return u.pathname.split("/")[2] || null;
      if (u.pathname.startsWith("/shorts/")) return u.pathname.split("/")[2] || null;
      if (u.pathname.startsWith("/live/")) return u.pathname.split("/")[2] || null;
    }
    if (host === "youtu.be") {
      return u.pathname.replace(/^\//, "").split("/")[0] || null;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Converts a video URL into an embeddable iframe src.
 * Supports YouTube (watch/short/embed/live), Vimeo, and direct video files.
 */
function getEmbedUrl(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    const host = u.hostname.replace("www.", "").replace("m.", "");

    const ytId = getYouTubeId(url);
    if (ytId) return `https://www.youtube.com/embed/${ytId}`;

    if (host === "vimeo.com") {
      const id = u.pathname.split("/").filter(Boolean)[0];
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
    // Direct file (.mp4/.webm) or unknown — return as-is
    return url;
  } catch {
    return url;
  }
}

function isDirectVideo(url) {
  if (!url) return false;
  return /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);
}

/**
 * Best-effort thumbnail for a catalogue item.
 * Prefers the explicit image_url, falls back to YouTube thumbnail,
 * falls back to null.
 */
function getThumbnail(item) {
  if (item?.image_url) return item.image_url;
  const ytId = getYouTubeId(item?.video_url);
  if (ytId) return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
  return null;
}

export default function Catalogue() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [lightbox, setLightbox] = useState(null);

  // Fetch catalogue items
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("catalogue")
        .select("*")
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (cancelled) return;

      if (error) {
        console.error("Catalogue fetch error:", error);
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

  // Lock body scroll when lightbox open
  useEffect(() => {
    if (typeof document === "undefined") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = lightbox ? "hidden" : "";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [lightbox]);

  // Close lightbox on ESC
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e) => {
      if (e.key === "Escape") setLightbox(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox]);

  const categories = useMemo(() => {
    const set = new Set();
    items.forEach((i) => {
      const c = (i.category || "").trim();
      if (c) set.add(c);
    });
    return ["All", ...Array.from(set)];
  }, [items]);

  const filtered = useMemo(() => {
    if (activeCategory === "All") return items;
    return items.filter(
      (i) => (i.category || "").trim() === activeCategory
    );
  }, [items, activeCategory]);

  const closeLightbox = useCallback(() => setLightbox(null), []);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16 text-red-400 text-sm">
        Failed to load catalogue: {error}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-16 text-white/40 text-sm">
        No catalogue items yet.
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Category filter */}
      <div className="flex flex-wrap gap-2 justify-center mb-6">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition border ${
              activeCategory === cat
                ? "bg-amber-500 text-black border-amber-500"
                : "bg-white/5 text-white/70 border-white/10 hover:border-amber-500/50 hover:text-white"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {filtered.map((item) => (
          <CatalogueCard
            key={item.id}
            item={item}
            onOpen={() => setLightbox(item)}
          />
        ))}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
          aria-label={lightbox.caption || "Media preview"}
        >
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition"
            onClick={closeLightbox}
            aria-label="Close"
          >
            <X size={28} />
          </button>

          <div
            className="max-w-5xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {lightbox.video_url ? (
              <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black">
                {isDirectVideo(lightbox.video_url) ? (
                  <video
                    src={lightbox.video_url}
                    controls
                    autoPlay
                    playsInline
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <iframe
                    src={getEmbedUrl(lightbox.video_url)}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    referrerPolicy="strict-origin-when-cross-origin"
                    title={lightbox.caption || "Video"}
                  />
                )}
              </div>
            ) : lightbox.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={lightbox.image_url}
                alt={lightbox.caption || "Catalogue image"}
                className="w-full max-h-[80vh] object-contain rounded-xl mx-auto"
              />
            ) : (
              <div className="text-center text-white/50 text-sm py-16">
                No media available for this item.
              </div>
            )}

            {lightbox.caption && (
              <p className="text-white/80 text-sm text-center mt-4">
                {lightbox.caption}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CatalogueCard({ item, onOpen }) {
  const hasVideo = Boolean(item.video_url);
  const thumbnail = getThumbnail(item);
  const categoryLabel = (item.category || "").trim();

  return (
    <button
      onClick={onOpen}
      type="button"
      className="group relative aspect-square rounded-xl overflow-hidden bg-white/5 border border-white/10 hover:border-amber-500/50 transition-all duration-200 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-amber-500/60"
      aria-label={item.caption || "Open catalogue item"}
    >
      {thumbnail ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumbnail}
          alt={item.caption || categoryLabel || "Catalogue item"}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-white/30">
          {hasVideo ? <Video size={28} /> : <ImageIcon size={28} />}
        </div>
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0 opacity-80 group-hover:opacity-100 transition" />

      {/* Play badge */}
      {hasVideo && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur flex items-center justify-center border border-white/20 group-hover:bg-amber-500 group-hover:border-amber-500 transition">
            <Play
              size={18}
              className="text-white group-hover:text-black ml-0.5"
              fill="currentColor"
            />
          </div>
        </div>
      )}

      {/* Category chip */}
      {categoryLabel && (
        <span className="absolute top-2 left-2 text-[10px] uppercase tracking-wide bg-black/60 backdrop-blur px-2 py-0.5 rounded-full text-white/80 border border-white/10">
          {categoryLabel}
        </span>
      )}

      {/* Caption */}
      {item.caption && (
        <p className="absolute bottom-0 left-0 right-0 p-3 text-xs text-white/90 text-left line-clamp-2">
          {item.caption}
        </p>
      )}
    </button>
  );
}