// components/Catalogue.js
'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { supabase } from "../lib/supabase";
import {
  Play,
  X,
  ImageIcon,
  Video,
  Search,
  Heart,
  Share2,
  Download,
} from 'lucide-react';

/* ---------- helpers ---------- */

function getYouTubeId(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    const host = u.hostname.replace('www.', '').replace('m.', '');
    if (host === 'youtube.com') {
      if (u.searchParams.get('v')) return u.searchParams.get('v');
      if (u.pathname.startsWith('/embed/')) return u.pathname.split('/')[2] || null;
      if (u.pathname.startsWith('/shorts/')) return u.pathname.split('/')[2] || null;
      if (u.pathname.startsWith('/live/')) return u.pathname.split('/')[2] || null;
    }
    if (host === 'youtu.be') {
      return u.pathname.replace(/^\//, '').split('/')[0] || null;
    }
    return null;
  } catch {
    return null;
  }
}

function getEmbedUrl(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    const host = u.hostname.replace('www.', '').replace('m.', '');
    const ytId = getYouTubeId(url);
    if (ytId) return `https://www.youtube.com/embed/${ytId}`;
    if (host === 'vimeo.com') {
      const id = u.pathname.split('/').filter(Boolean)[0];
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
    return url;
  } catch {
    return url;
  }
}

function isDirectVideo(url) {
  if (!url) return false;
  return /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);
}

function getThumbnail(item) {
  if (item?.image_url) return item.image_url;
  const ytId = getYouTubeId(item?.video_url);
  if (ytId) return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
  return null;
}

/* ---------- main component ---------- */

export default function Catalogue() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [lightbox, setLightbox] = useState(null);
  const [liked, setLiked] = useState({});

  /* fetch from supabase */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('catalogue')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (cancelled) return;

      if (error) {
        console.error('Catalogue fetch error:', error);
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

  /* lock body scroll when lightbox is open */
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = lightbox ? 'hidden' : '';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [lightbox]);

  /* ESC closes lightbox */
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e) => e.key === 'Escape' && setLightbox(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox]);

  /* categories from items */
  const categories = useMemo(() => {
    const set = new Set();
    items.forEach((i) => {
      const c = (i.category || '').trim();
      if (c) set.add(c);
    });
    return ['All', ...Array.from(set)];
  }, [items]);

  /* apply category + search filters */
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((i) => {
      const matchCategory =
        activeCategory === 'All' ||
        (i.category || '').trim() === activeCategory;
      const haystack = `${i.caption || ''} ${i.category || ''}`.toLowerCase();
      const matchSearch = !q || haystack.includes(q);
      return matchCategory && matchSearch;
    });
  }, [items, activeCategory, searchQuery]);

  const handleLike = (id, e) => {
    e?.stopPropagation();
    setLiked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDownload = (url, title, e) => {
    e?.stopPropagation();
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = title || 'download';
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleShare = async (url, title, e) => {
    e?.stopPropagation();
    if (!url) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: `Check this out from Who Wins: ${title}`,
          url,
        });
      } catch {
        /* user cancelled */
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
      } catch {
        alert('Unable to share. Copy the link manually.');
      }
    }
  };

  /* ---------- render states ---------- */

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
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

  return (
    <div className="w-full">
      {/* Search bar */}
      <div className="max-w-4xl mx-auto mb-4">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-yellow-400 rounded-lg blur opacity-10 md:opacity-20" />
          <div className="relative flex items-center bg-black/80 backdrop-blur-sm rounded-lg border border-orange-500/30">
            <Search className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400 ml-2.5 md:ml-3" />
            <input
              type="text"
              placeholder="Search catalogue..."
              className="flex-1 bg-transparent border-none outline-none px-3 py-2 text-sm text-white placeholder-gray-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="p-1.5 hover:bg-white/10 rounded transition-colors"
                aria-label="Clear search"
              >
                <X className="w-3 h-3 text-gray-400" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Category pills */}
      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2 justify-center mb-6">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition border ${
                activeCategory === cat
                  ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white border-orange-500/50'
                  : 'bg-white/5 text-white/70 border-white/10 hover:border-orange-500/50 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Grid or empty state */}
      {items.length === 0 ? (
        <div className="text-center py-16 text-white/40 text-sm">
          No catalogue items yet.
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-3">📷</div>
          <h3 className="text-xl font-semibold mb-2">No Items Found</h3>
          <p className="text-gray-400 text-sm">Try adjusting your search or filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {filtered.map((item) => (
            <CatalogueCard
              key={item.id}
              item={item}
              liked={!!liked[item.id]}
              onLike={(e) => handleLike(item.id, e)}
              onShare={(e) => handleShare(item.video_url || item.image_url, item.caption, e)}
              onDownload={(e) => handleDownload(item.video_url || item.image_url, item.caption, e)}
              onOpen={() => setLightbox(item)}
            />
          ))}
        </div>
      )}

      {/* Lightbox — two-column layout matching ImageGallery */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative max-w-4xl max-h-[90vh] w-full bg-gradient-to-br from-gray-900 to-black rounded-xl border border-gray-800 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setLightbox(null)}
              className="absolute top-2 right-2 z-10 p-1.5 bg-black/60 backdrop-blur-sm rounded-full hover:bg-black/80 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-white" />
            </button>

            <div className="grid md:grid-cols-2 h-full">
              {/* Media side */}
              <div className="relative h-64 md:h-auto bg-black">
                {lightbox.video_url ? (
                  isDirectVideo(lightbox.video_url) ? (
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
                      title={lightbox.caption || 'Video'}
                    />
                  )
                ) : lightbox.image_url ? (
                  <Image
                    src={lightbox.image_url}
                    alt={lightbox.caption || 'Catalogue image'}
                    fill
                    className="object-contain"
                    unoptimized
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/40 text-sm">
                    No media available
                  </div>
                )}
              </div>

              {/* Details side */}
              <div className="p-4 md:p-6 flex flex-col">
                <div className="mb-4">
                  <h2 className="text-xl md:text-2xl font-bold mb-2">
                    {lightbox.caption || 'Catalogue Item'}
                  </h2>
                  {lightbox.category && (
                    <span className="inline-block px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded-full text-xs">
                      {lightbox.category}
                    </span>
                  )}
                </div>

                <div className="flex-1">
                  <p className="text-gray-300 mb-4 text-sm">
                    {lightbox.description ||
                      'A memorable moment from the Who Wins archive.'}
                  </p>
                </div>

                {/* Stats and actions */}
                <div className="pt-4 border-t border-gray-800">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={(e) => handleLike(lightbox.id, e)}
                        className="flex items-center space-x-1.5 hover:text-red-500 transition-colors text-sm"
                      >
                        <Heart
                          className={`w-4 h-4 ${
                            liked[lightbox.id]
                              ? 'fill-red-500 text-red-500'
                              : 'text-gray-400'
                          }`}
                        />
                        <span>{liked[lightbox.id] ? 1 : 0}</span>
                      </button>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) =>
                          handleDownload(
                            lightbox.video_url || lightbox.image_url,
                            lightbox.caption,
                            e
                          )
                        }
                        className="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-400 hover:to-yellow-400 text-black rounded-lg font-medium transition-all duration-300 hover:-translate-y-0.5 flex items-center space-x-1.5 text-sm"
                      >
                        <Download className="w-3 h-3" />
                        <span>Download</span>
                      </button>
                      <button
                        onClick={(e) =>
                          handleShare(
                            lightbox.video_url || lightbox.image_url,
                            lightbox.caption,
                            e
                          )
                        }
                        className="px-3 py-1.5 bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 rounded-lg font-medium transition-all duration-300 hover:-translate-y-0.5 flex items-center space-x-1.5 text-sm"
                      >
                        <Share2 className="w-3 h-3" />
                        <span>Share</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- card ---------- */

function CatalogueCard({ item, liked, onLike, onShare, onDownload, onOpen }) {
  const hasVideo = Boolean(item.video_url);
  const thumbnail = getThumbnail(item);
  const categoryLabel = (item.category || '').trim();

  return (
    <div
      className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-900 to-black border border-gray-800 hover:border-orange-500/50 transition-all duration-500 hover:-translate-y-0.5 cursor-pointer"
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onOpen()}
    >
      {/* Media */}
      <div className="relative aspect-square overflow-hidden bg-black/40">
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt={item.caption || categoryLabel || 'Catalogue item'}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            unoptimized
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/30">
            {hasVideo ? <Video size={28} /> : <ImageIcon size={28} />}
          </div>
        )}

        {/* Hover gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Quick actions */}
        <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={onLike}
            className="p-1.5 bg-black/60 backdrop-blur-sm rounded-full hover:bg-black/80 transition-colors"
            aria-label="Like"
          >
            <Heart
              className={`w-3 h-3 ${
                liked ? 'fill-red-500 text-red-500' : 'text-white'
              }`}
            />
          </button>
        </div>

        {/* Play badge */}
        {hasVideo && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur flex items-center justify-center border border-white/20 group-hover:bg-orange-500 group-hover:border-orange-500 transition">
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
      </div>

      {/* Caption */}
      <div className="p-3">
        {item.caption && (
          <h3 className="font-semibold text-sm line-clamp-1 mb-2">
            {item.caption}
          </h3>
        )}

        <div className="flex items-center justify-end space-x-1 pt-2 border-t border-gray-800">
          <button
            onClick={onDownload}
            className="p-1 hover:bg-white/10 rounded transition-colors"
            aria-label="Download"
          >
            <Download className="w-3 h-3 text-gray-400" />
          </button>
          <button
            onClick={onShare}
            className="p-1 hover:bg-white/10 rounded transition-colors"
            aria-label="Share"
          >
            <Share2 className="w-3 h-3 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );
}