// app/updates/page.js
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Search, 
  Calendar, 
  Clock, 
  Eye, 
  Flame,
  X,
  ChevronRight
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

// Simplified date formatter - memoized for performance
const formatDate = (() => {
  const cache = new Map();
  return (dateString) => {
    if (cache.has(dateString)) return cache.get(dateString);
    const date = new Date(dateString);
    const formatted = date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
    cache.set(dateString, formatted);
    return formatted;
  };
})();

export default function UpdatesPage() {
  const router = useRouter();
  const [news, setNews] = useState([]);
  const [filteredNews, setFilteredNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);

  // Optimized fetch with caching
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchNews = async () => {
      try {
        // Only fetch necessary fields
        const { data, error } = await supabase
          .from('news')
          .select('id, title, excerpt, image_url, category, published_at, read_time, views_count, is_trending')
          .order('published_at', { ascending: false })
          .limit(20); // Limit to 20 items for performance

        if (error) throw error;
        
        if (isMounted) {
          setNews(data || []);
          setFilteredNews(data || []);
          
          // Extract unique categories efficiently
          const uniqueCategories = [...new Set(data?.map(item => item.category) || [])];
          setCategories(uniqueCategories);
        }
      } catch (error) {
        if (isMounted) console.error('Error fetching news:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchNews();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [supabase]);

  // Memoized filtered results for performance
  useEffect(() => {
    // Use requestIdleCallback for non-critical filtering
    const filterNews = () => {
      let filtered = news;
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(item => 
          item.title.toLowerCase().includes(query) ||
          item.excerpt?.toLowerCase().includes(query)
        );
      }
      
      if (selectedCategory !== 'all') {
        filtered = filtered.filter(item => item.category === selectedCategory);
      }
      
      setFilteredNews(filtered);
    };

    // Debounce filtering for search
    const timeoutId = setTimeout(filterNews, 100);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedCategory, news]);

  // Memoized category colors
  const getCategoryStyle = useCallback((category) => {
    const styles = {
      'EXCLUSIVE': { bg: 'bg-purple-500', text: 'text-purple-400', light: 'bg-purple-500/10' },
      'NEWS': { bg: 'bg-blue-500', text: 'text-blue-400', light: 'bg-blue-500/10' },
      'INSIGHT': { bg: 'bg-green-500', text: 'text-green-400', light: 'bg-green-500/10' },
      'INTERVIEW': { bg: 'bg-yellow-500', text: 'text-yellow-400', light: 'bg-yellow-500/10' },
      'BEHIND THE SCENES': { bg: 'bg-pink-500', text: 'text-pink-400', light: 'bg-pink-500/10' }
    };
    return styles[category] || { bg: 'bg-gray-500', text: 'text-gray-400', light: 'bg-gray-500/10' };
  }, []);

  // Memoized trending news
  const trendingNews = useMemo(() => 
    news.filter(item => item.is_trending).slice(0, 3), 
    [news]
  );

  // Optimized loading skeleton - 4 columns desktop, 2 mobile
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
        <div className="container mx-auto px-4 py-8 md:py-12">
          {/* Hero skeleton - minimal */}
          <div className="text-center mb-8">
            <div className="h-10 w-48 bg-gray-800/50 rounded-lg animate-pulse mx-auto mb-3"></div>
            <div className="h-4 w-64 bg-gray-800/50 rounded-lg animate-pulse mx-auto"></div>
          </div>
          
          {/* Search skeleton */}
          <div className="max-w-xl mx-auto mb-8">
            <div className="h-12 bg-gray-800/50 rounded-xl animate-pulse"></div>
          </div>
          
          {/* Category filters skeleton */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-8 w-20 bg-gray-800/50 rounded-full animate-pulse"></div>
            ))}
          </div>
          
          {/* Content skeleton - 4 columns desktop, 2 mobile */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-gray-800/30 rounded-xl overflow-hidden animate-pulse">
                <div className="aspect-[4/5] bg-gray-700/50"></div>
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-gray-700/50 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-700/50 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-700/50 rounded w-1/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
      {/* Simple Header - no heavy gradients */}
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Latest Updates
          </h1>
          <p className="text-sm text-gray-400 max-w-2xl mx-auto">
            News, exclusives, and behind-the-scenes
          </p>
        </div>
        
        {/* Search Bar - simplified */}
        <div className="relative max-w-xl mx-auto mb-6">
          <div className="relative flex items-center bg-black/50 rounded-lg border border-white/10">
            <Search className="w-4 h-4 text-gray-500 ml-3" />
            <input
              type="text"
              placeholder="Search updates..."
              className="w-full bg-transparent border-none outline-none px-3 py-2.5 text-sm text-white placeholder-gray-600"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              >
                <X className="w-3 h-3 text-gray-500" />
              </button>
            )}
          </div>
        </div>

        {/* Category Filters - compact */}
        <div className="flex flex-wrap justify-center gap-1.5 mb-8">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              selectedCategory === 'all'
                ? 'bg-orange-500 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            All ({news.length})
          </button>
          {categories.map(category => {
            const count = news.filter(item => item.category === category).length;
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  selectedCategory === category
                    ? `${getCategoryStyle(category).bg} text-white`
                    : `${getCategoryStyle(category).light} ${getCategoryStyle(category).text} hover:bg-white/10`
                }`}
              >
                {category} ({count})
              </button>
            );
          })}
        </div>

        {/* Main Content - 4 columns desktop, 2 mobile */}
        {filteredNews.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {filteredNews.map((item) => (
              <div
                key={item.id}
                onClick={() => router.push(`/updates/${item.id}`)}
                className="group cursor-pointer bg-gradient-to-br from-gray-900 to-black rounded-xl overflow-hidden border border-white/10 hover:border-orange-500/30 transition-all duration-300"
              >
                {/* Image - optimized with low quality placeholder */}
                <div className="relative aspect-[4/5] overflow-hidden bg-gray-800">
                  <Image
                    src={item.image_url}
                    alt={item.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    sizes="(max-width: 768px) 50vw, 25vw"
                    loading="lazy"
                    quality={75}
                  />
                  {item.is_trending && (
                    <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full text-[8px] font-semibold flex items-center gap-0.5">
                      <Flame className="w-2.5 h-2.5" />
                      <span>HOT</span>
                    </div>
                  )}
                </div>

                {/* Content - compact */}
                <div className="p-2.5">
                  <div className="mb-1">
                    <span className={`text-[9px] font-medium ${getCategoryStyle(item.category).text}`}>
                      {item.category}
                    </span>
                  </div>
                  
                  <h3 className="text-xs md:text-sm font-bold text-white line-clamp-2 mb-1 group-hover:text-orange-400 transition-colors">
                    {item.title}
                  </h3>
                  
                  {/* Meta - minimal */}
                  <div className="flex items-center gap-2 text-[8px] md:text-[10px] text-gray-500">
                    <div className="flex items-center gap-0.5">
                      <Calendar className="w-2.5 h-2.5" />
                      <span>{formatDate(item.published_at)}</span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <Eye className="w-2.5 h-2.5" />
                      <span>{item.views_count?.toLocaleString() || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-4xl mb-2">📰</div>
            <h3 className="text-base font-semibold text-white mb-1">No Updates Found</h3>
            <p className="text-xs text-gray-500">Try adjusting your search</p>
          </div>
        )}

        {/* Simple Back to Top link */}
        <div className="text-center mt-8">
          <Link 
            href="/"
            className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-400 transition-colors"
          >
            <span>Back to Home</span>
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}