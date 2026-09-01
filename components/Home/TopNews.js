// components/home/TopNews.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Share2, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import Image from 'next/image';

// Simple date formatter
const formatTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
};

const getCategoryColor = (category) => {
  const colors = {
    'EXCLUSIVE': 'bg-purple-500',
    'NEWS': 'bg-blue-500',
    'INSIGHT': 'bg-green-500',
    'INTERVIEW': 'bg-yellow-500',
    'BEHIND THE SCENES': 'bg-pink-500'
  };
  return colors[category] || 'bg-gray-500';
};

// Fallback image
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400';

export default function TopNews() {
  const router = useRouter();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState({});

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    fetchTopNews();
  }, []);

  const fetchTopNews = async () => {
    try {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .order('published_at', { ascending: false })
        .limit(4);

      if (error) throw error;
      setNews(data || []);
    } catch (error) {
      console.error('Error fetching top news:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageError = (id) => {
    setImageErrors((prev) => ({ ...prev, [id]: true }));
  };

  const handleShare = async (newsItem) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: newsItem.title,
          text: newsItem.excerpt || '',
          url: `${window.location.origin}/updates/${newsItem.id}`,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/updates/${newsItem.id}`);
      alert('Link copied to clipboard!');
    }
  };

  const handleReadMore = (id) => {
    router.push(`/updates/${id}`);
  };

  const handleViewAll = () => {
    router.push('/updates');
  };

  if (loading) {
    return (
      <section className="container mx-auto px-4 py-8 md:py-12">
        {/* Section header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-orange-400 text-sm font-medium tracking-wider mb-1">TOP NEWS</div>
            <h2 className="text-xl md:text-2xl font-bold text-white">Latest News</h2>
          </div>
          <button 
            onClick={handleViewAll}
            className="text-white/70 hover:text-white text-xs font-medium flex items-center gap-1 transition-colors"
          >
            <span>VIEW ALL</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        
        {/* Loading skeleton - 4 columns on desktop, 2 on mobile */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gradient-to-br from-gray-900/50 to-black/50 rounded-2xl overflow-hidden border border-white/10 animate-pulse">
              <div className="aspect-[4/3] bg-gray-800"></div>
              <div className="p-3 md:p-4 space-y-2">
                <div className="h-3 bg-gray-800 rounded w-1/3"></div>
                <div className="h-4 bg-gray-800 rounded w-3/4"></div>
                <div className="h-3 bg-gray-800 rounded w-full"></div>
                <div className="h-3 bg-gray-800 rounded w-2/3"></div>
                <div className="flex items-center justify-between pt-1">
                  <div className="h-3 bg-gray-800 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-800 rounded w-1/4"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (news.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-8 md:py-12">
      {/* Section header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-orange-400 text-sm font-medium tracking-wider mb-1">TOP NEWS</div>
          <h2 className="text-xl md:text-2xl font-bold text-white">Latest News</h2>
        </div>
        <button 
          onClick={handleViewAll}
          className="text-white/70 hover:text-white text-xs font-medium flex items-center gap-1 transition-colors"
        >
          <span>VIEW ALL</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
      
      {/* News grid - 2 columns on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
        {news.map((item) => (
          <div 
            key={item.id} 
            className="group cursor-pointer bg-gradient-to-br from-gray-900/50 to-black/50 rounded-2xl overflow-hidden border border-white/10 hover:border-orange-500/30 transition-all duration-300 flex flex-col"
            onClick={() => handleReadMore(item.id)}
          >
            {/* News image */}
            <div className="relative aspect-[4/3] overflow-hidden flex-shrink-0 bg-gray-800">
              {imageErrors[item.id] ? (
                <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 md:w-12 md:h-12 text-white/20" />
                </div>
              ) : (
                <img
                  src={item.image_url || FALLBACK_IMAGE}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={() => handleImageError(item.id)}
                />
              )}
              
              {/* Category badge */}
              <div className="absolute top-2 left-2 md:top-3 md:left-3">
                <span className={`px-1.5 py-0.5 md:px-2 md:py-0.5 rounded-full ${getCategoryColor(item.category)} text-white text-[8px] md:text-[10px] font-medium`}>
                  {item.category}
                </span>
              </div>
              
              {/* Share button */}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleShare(item);
                }}
                className="absolute top-2 right-2 md:top-3 md:right-3 p-1 md:p-1.5 rounded-full bg-black/50 hover:bg-black/70 transition-colors backdrop-blur-sm"
              >
                <Share2 className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" />
              </button>
            </div>
            
            {/* News content */}
            <div className="p-3 md:p-4 flex flex-col flex-grow">
              <h3 className="text-xs md:text-sm font-bold text-white mb-1 md:mb-2 group-hover:text-orange-400 transition-colors line-clamp-2">
                {item.title}
              </h3>
              
              {/* Excerpt - hidden on mobile, shown on desktop */}
              <p className="hidden md:block text-white/60 text-xs mb-2 line-clamp-2 flex-grow">
                {item.excerpt || ''}
              </p>
              
              {/* Bottom row */}
              <div className="flex items-center justify-between mt-auto pt-1 md:pt-2 border-t border-white/5">
                <div className="flex items-center gap-1 text-white/40 text-[8px] md:text-[10px]">
                  <Calendar className="w-2 h-2 md:w-2.5 md:h-2.5" />
                  <span className="truncate max-w-[50px] md:max-w-[80px]">
                    {formatTimeAgo(item.published_at)}
                  </span>
                </div>
                
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReadMore(item.id);
                  }}
                  className="inline-flex items-center gap-0.5 text-[8px] md:text-[10px] font-medium text-orange-400 hover:text-orange-300 transition-colors group/btn"
                >
                  <span>READ</span>
                  <ChevronRight className="w-2 h-2 md:w-2.5 md:h-2.5 group-hover/btn:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}