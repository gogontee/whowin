// app/updates/[id]/page.js
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  Share2, 
  Eye, 
  ArrowLeft,
  ChevronRight,
  Twitter,
  Facebook,
  Linkedin,
  Link as LinkIcon
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';

// Simple date formatter
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric',
    year: 'numeric'
  });
};

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
  
  return formatDate(dateString);
};

// Check if a string contains HTML tags
const containsHTML = (str) => {
  if (!str) return false;
  return /<\/?[a-z][\s\S]*>/i.test(str);
};

// Strip HTML tags and convert to clean text with paragraph breaks
const htmlToText = (html) => {
  if (!html) return '';
  
  let text = html;
  
  // Replace block-level elements with line breaks
  text = text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ');
  
  // Remove all remaining HTML tags
  text = text.replace(/<[^>]+>/g, '');
  
  // Decode common HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&hellip;/g, '…')
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"');
  
  // Clean up whitespace
  text = text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
  
  return text;
};

// Parse content into an array of paragraphs/blocks for rendering
const parseContent = (content) => {
  if (!content) return [];
  
  // If content has HTML, convert to clean text first
  const cleanText = containsHTML(content) ? htmlToText(content) : content;
  
  // Split into paragraphs by double newlines
  const blocks = cleanText
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0);
  
  return blocks;
};

export default function NewsDetailPage() {
  const params = useParams();
  const router = useRouter();
  const newsId = params.id;
  
  const [news, setNews] = useState(null);
  const [otherNews, setOtherNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (newsId) {
      fetchNews();
    }
  }, [newsId]);

  const fetchNews = async () => {
    setLoading(true);
    try {
      // Fetch the main news article
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .eq('id', newsId)
        .single();

      if (error) throw error;
      setNews(data);

      // Increment view count (fire and forget)
      supabase
        .from('news')
        .update({ views_count: (data.views_count || 0) + 1 })
        .eq('id', newsId)
        .then();

      // Fetch other news (excluding current)
      const { data: other, error: otherError } = await supabase
        .from('news')
        .select('id, title, excerpt, image_url, category, published_at')
        .neq('id', newsId)
        .order('published_at', { ascending: false })
        .limit(6);

      if (!otherError) {
        setOtherNews(other || []);
      }

    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async (platform) => {
    const url = `${window.location.origin}/updates/${newsId}`;
    const title = news?.title || 'Check out this article';
    const text = news?.excerpt || '';

    switch(platform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'copy':
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        break;
      default:
        if (navigator.share) {
          try {
            await navigator.share({
              title,
              text,
              url,
            });
          } catch (error) {
            console.error('Error sharing:', error);
          }
        }
    }
    setShowShareMenu(false);
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

  const getCategoryTextColor = (category) => {
    const colors = {
      'EXCLUSIVE': 'text-purple-400',
      'NEWS': 'text-blue-400',
      'INSIGHT': 'text-green-400',
      'INTERVIEW': 'text-yellow-400',
      'BEHIND THE SCENES': 'text-pink-400'
    };
    return colors[category] || 'text-gray-400';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
        <div className="container mx-auto px-4 py-8 md:py-12">
          {/* Back button skeleton */}
          <div className="w-16 md:w-24 h-6 md:h-8 bg-gray-800/50 rounded-lg animate-pulse mb-4 md:mb-6"></div>
          
          {/* Content skeleton */}
          <div className="max-w-4xl mx-auto">
            <div className="h-48 md:h-96 bg-gray-800/50 rounded-2xl animate-pulse mb-4 md:mb-6"></div>
            <div className="h-5 md:h-8 bg-gray-800/50 rounded w-3/4 animate-pulse mb-2 md:mb-4"></div>
            <div className="h-3 md:h-4 bg-gray-800/50 rounded w-1/4 animate-pulse mb-4 md:mb-8"></div>
            <div className="space-y-2 md:space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-3 md:h-4 bg-gray-800/50 rounded w-full animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!news) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center px-4">
          <h1 className="text-lg md:text-2xl font-bold text-white mb-2 md:mb-4">Article Not Found</h1>
          <p className="text-white/60 text-xs md:text-sm mb-4 md:mb-6">The article doesn't exist or has been removed.</p>
          <Link
            href="/"
            className="inline-flex items-center gap-1 md:gap-2 px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-lg md:rounded-xl text-xs md:text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <ArrowLeft className="w-3 h-3 md:w-4 md:h-4" />
            Go Back Home
          </Link>
        </div>
      </div>
    );
  }

  // Parse content once for rendering
  const contentBlocks = parseContent(news.content);
  // Also clean the excerpt if it has HTML
  const cleanExcerpt = containsHTML(news.excerpt) ? htmlToText(news.excerpt) : news.excerpt;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
      <div className="container mx-auto px-4 py-4 md:py-8">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 md:gap-2 text-white/60 hover:text-white transition-colors mb-3 md:mb-6 group"
        >
          <ArrowLeft className="w-3 h-3 md:w-4 md:h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] md:text-sm">Back</span>
        </button>

        {/* Main content */}
        <div className="flex flex-col lg:flex-row gap-4 md:gap-8">
          {/* Main article */}
          <div className="lg:w-2/3">
            <div className="max-w-3xl">
              {/* Featured Image */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative h-40 md:h-96 rounded-xl md:rounded-2xl overflow-hidden mb-3 md:mb-6"
              >
                <Image
                  src={news.image_url}
                  alt={news.title}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, 800px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                
                {/* Category badge */}
                <div className="absolute top-2 left-2 md:top-4 md:left-4">
                  <span className={`px-1.5 md:px-3 py-0.5 md:py-1 rounded-full ${getCategoryColor(news.category)} text-white text-[8px] md:text-xs font-medium`}>
                    {news.category}
                  </span>
                </div>

                {/* Share button */}
                <div className="absolute top-2 right-2 md:top-4 md:right-4">
                  <button
                    onClick={() => setShowShareMenu(!showShareMenu)}
                    className="p-1 md:p-2 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-colors relative"
                  >
                    <Share2 className="w-3 h-3 md:w-4 md:h-4 text-white" />
                    
                    {/* Share menu */}
                    {showShareMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute top-full right-0 mt-1 md:mt-2 w-36 md:w-48 bg-black/95 backdrop-blur-md rounded-lg md:rounded-xl border border-white/10 shadow-xl py-1 md:py-2 z-50"
                      >
                        <button
                          onClick={() => handleShare('twitter')}
                          className="w-full px-2 md:px-4 py-1.5 md:py-2 text-white hover:bg-white/10 text-left text-[10px] md:text-sm flex items-center gap-1 md:gap-2"
                        >
                          <Twitter className="w-2.5 h-2.5 md:w-4 md:h-4 text-blue-400" />
                          <span>Twitter</span>
                        </button>
                        <button
                          onClick={() => handleShare('facebook')}
                          className="w-full px-2 md:px-4 py-1.5 md:py-2 text-white hover:bg-white/10 text-left text-[10px] md:text-sm flex items-center gap-1 md:gap-2"
                        >
                          <Facebook className="w-2.5 h-2.5 md:w-4 md:h-4 text-blue-600" />
                          <span>Facebook</span>
                        </button>
                        <button
                          onClick={() => handleShare('linkedin')}
                          className="w-full px-2 md:px-4 py-1.5 md:py-2 text-white hover:bg-white/10 text-left text-[10px] md:text-sm flex items-center gap-1 md:gap-2"
                        >
                          <Linkedin className="w-2.5 h-2.5 md:w-4 md:h-4 text-blue-500" />
                          <span>LinkedIn</span>
                        </button>
                        <button
                          onClick={() => handleShare('copy')}
                          className="w-full px-2 md:px-4 py-1.5 md:py-2 text-white hover:bg-white/10 text-left text-[10px] md:text-sm flex items-center gap-1 md:gap-2"
                        >
                          <LinkIcon className="w-2.5 h-2.5 md:w-4 md:h-4 text-gray-400" />
                          <span className="text-[10px] md:text-sm">{copied ? 'Copied!' : 'Copy Link'}</span>
                        </button>
                      </motion.div>
                    )}
                  </button>
                </div>

                {/* Title overlay */}
                <div className="absolute bottom-2 left-2 right-2 md:bottom-4 md:left-4 md:right-4">
                  <h1 className="!text-base md:!text-3xl font-bold text-white line-clamp-2 md:line-clamp-none">
                    {news.title}
                  </h1>
                </div>
              </motion.div>

              {/* Meta information */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex flex-wrap items-center gap-2 md:gap-4 mb-4 md:mb-8 pb-3 md:pb-6 border-b border-white/10 text-[8px] md:text-sm text-white/60"
              >
                <div className="flex items-center gap-0.5 md:gap-1">
                  <Calendar className="w-2.5 h-2.5 md:w-4 md:h-4" />
                  <span className="text-[8px] md:text-sm">{formatDate(news.published_at)}</span>
                </div>
                <div className="flex items-center gap-0.5 md:gap-1">
                  <Clock className="w-2.5 h-2.5 md:w-4 md:h-4" />
                  <span className="text-[8px] md:text-sm">{news.read_time} min read</span>
                </div>
                <div className="flex items-center gap-0.5 md:gap-1">
                  <Eye className="w-2.5 h-2.5 md:w-4 md:h-4" />
                  <span className="text-[8px] md:text-sm">{news.views_count?.toLocaleString() || 0} views</span>
                </div>
              </motion.div>

              {/* Article content */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="prose prose-invert max-w-none"
              >
                {/* Excerpt */}
                {cleanExcerpt && (
                  <p className="text-xs md:text-xl text-white/80 mb-3 md:mb-6 italic border-l-2 md:border-l-4 border-orange-500 pl-2 md:pl-4">
                    {cleanExcerpt}
                  </p>
                )}
                
                {/* Full content */}
                <div className="text-white/70 text-[10px] md:text-base space-y-2 md:space-y-4 leading-relaxed">
                  {contentBlocks.map((block, index) => (
                    <p key={index}>{block}</p>
                  ))}
                </div>
              </motion.div>

              {/* Author section */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-4 md:mt-8 pt-4 md:pt-8 border-t border-white/10"
              >
                <div className="flex items-center gap-2 md:gap-4">
                  <div className="w-6 h-6 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center text-white font-bold text-[10px] md:text-lg">
                    {news.author?.charAt(0) || 'C'}
                  </div>
                  <div>
                    <p className="text-white text-[10px] md:text-sm font-medium">Written by</p>
                    <p className="text-white/60 text-[8px] md:text-sm">{news.author || 'Celebrity Star Team'}</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Sidebar - Other News */}
          <div className="lg:w-1/3 mt-6 lg:mt-0">
            <div className="lg:sticky lg:top-24">
              <h2 className="text-xs md:text-xl font-bold text-white mb-3 md:mb-6 flex items-center gap-1 md:gap-2">
                <span className="w-0.5 h-3 md:w-1 md:h-6 bg-orange-500 rounded-full"></span>
                Other News
              </h2>
              
              <div className="space-y-2 md:space-y-4">
                {otherNews.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => router.push(`/updates/${item.id}`)}
                    className="group cursor-pointer bg-gradient-to-br from-gray-900/50 to-black/50 rounded-lg md:rounded-xl overflow-hidden border border-white/10 hover:border-orange-500/30 transition-all duration-300"
                  >
                    <div className="flex gap-2 md:gap-3 p-2 md:p-3">
                      {/* Thumbnail */}
                      <div className="relative w-12 h-12 md:w-20 md:h-20 rounded-md md:rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                          src={item.image_url}
                          alt={item.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-700"
                          sizes="(max-width: 768px) 48px, 80px"
                        />
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className={`text-[6px] md:text-[10px] font-medium mb-0.5 md:mb-1 ${getCategoryTextColor(item.category)}`}>
                          {item.category}
                        </div>
                        <h3 className="text-[10px] md:text-sm font-bold text-white line-clamp-2 group-hover:text-orange-400 transition-colors mb-0.5 md:mb-1">
                          {item.title}
                        </h3>
                        <div className="flex items-center gap-1 md:gap-2 text-[6px] md:text-[10px] text-white/40">
                          <Calendar className="w-2 h-2 md:w-3 md:h-3" />
                          <span>{formatTimeAgo(item.published_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* View all link */}
              <Link
                href="/updates"
                className="mt-3 md:mt-6 inline-flex items-center gap-1 md:gap-2 text-white/60 hover:text-white transition-colors group"
              >
                <span className="text-[10px] md:text-sm">View all updates</span>
                <ChevronRight className="w-2.5 h-2.5 md:w-4 md:h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}