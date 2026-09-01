// /components/profile/VideoModal.js
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Video, Link2, Youtube, Loader, Check, AlertCircle } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

export default function VideoModal({ onClose, profileId, onVideoAdded }) {
  const [videoUrl, setVideoUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const validateVideoUrl = (url) => {
    const youtubePatterns = [
      /(?:youtube\.com\/watch\?v=)([\w-]+)/,
      /(?:youtu\.be\/)([\w-]+)/,
      /(?:youtube\.com\/embed\/)([\w-]+)/,
      /(?:youtube\.com\/shorts\/)([\w-]+)/
    ];

    for (const pattern of youtubePatterns) {
      if (pattern.test(url)) {
        return true;
      }
    }
    return false;
  };

  const extractVideoId = (url) => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=)([\w-]+)/,
      /(?:youtu\.be\/)([\w-]+)/,
      /(?:youtube\.com\/embed\/)([\w-]+)/,
      /(?:youtube\.com\/shorts\/)([\w-]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    
    console.log('🎬 VideoModal: Form submitted');
    console.log('🎬 Video URL:', videoUrl);
    console.log('🎬 Caption:', caption);
    console.log('🎬 profileId:', profileId);
    
    if (!videoUrl) {
      setError('Please enter a video URL');
      setAdding(false);
      return;
    }

    if (!validateVideoUrl(videoUrl)) {
      setError('Please enter a valid YouTube URL (youtu.be or youtube.com)');
      setAdding(false);
      return;
    }

    if (!profileId) {
      setError('User not authenticated. Please log in.');
      setAdding(false);
      return;
    }

    setAdding(true);
    
    try {
      // Extract video ID for embed URL
      const videoId = extractVideoId(videoUrl);
      const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : videoUrl;

      console.log('🎬 Inserting into videos table:', {
        user_id: profileId,
        url: videoUrl,
        embed_url: embedUrl,
        caption: caption || '',
        provider: 'youtube'
      });

      // Insert into videos table
      const { data, error } = await supabase
        .from('videos')
        .insert({
          user_id: profileId,
          url: videoUrl,
          embed_url: embedUrl,
          caption: caption || '',
          provider: 'youtube'
        })
        .select();

      if (error) {
        console.error('🎬 Supabase insert error:', error);
        setError(error.message || 'Failed to save video. Please try again.');
        setAdding(false);
        return;
      }

      if (!data || data.length === 0) {
        setError('Failed to save video. No data returned.');
        setAdding(false);
        return;
      }

      console.log('🎬 Video saved successfully:', data[0]);
      
      setSuccess(true);
      setVideoUrl('');
      setCaption('');
      
      // Call the callback with the new video data
      if (onVideoAdded && data[0]) {
        onVideoAdded(data[0]);
      }
      
      // Close the modal after showing success
      setTimeout(() => {
        setAdding(false);
        onClose();
      }, 1500);

    } catch (error) {
      console.error('🎬 VideoModal Error:', error);
      setError(error.message || 'Failed to add video. Please try again.');
      setAdding(false);
    }
  };

  const handleClose = () => {
    if (!adding) {
      onClose();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      onClick={handleClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-gradient-to-b from-gray-900 to-black rounded-2xl border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="p-4 border-b border-white/10 flex items-center justify-between sticky top-0 bg-black/50 backdrop-blur-sm">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Video className="w-5 h-5 text-[#D4AF37]" />
            Add Video
          </h2>
          <button
            onClick={handleClose}
            disabled={adding}
            className={`p-2 rounded-full transition-colors ${
              adding ? 'text-white/20 cursor-not-allowed' : 'hover:bg-white/10 text-white'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {success && (
            <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3 text-green-400 text-sm flex items-center gap-2">
              <Check className="w-4 h-4 flex-shrink-0" />
              Video added successfully!
            </div>
          )}

          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2 flex items-center gap-2">
              <Link2 className="w-4 h-4 text-[#D4AF37]" />
              YouTube URL
            </label>
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => {
                setVideoUrl(e.target.value);
                setError('');
              }}
              placeholder="https://youtu.be/... or https://youtube.com/watch?v=..."
              className={`w-full px-4 py-3 bg-white/5 border rounded-lg text-sm text-white placeholder-white/30 focus:border-[#D4AF37] focus:outline-none transition-colors ${
                error ? 'border-red-500' : 'border-white/10'
              }`}
              required
              disabled={adding || success}
            />
            <div className="flex items-center gap-2 mt-2">
              <Youtube className="w-4 h-4 text-red-500" />
              <p className="text-[10px] text-white/30">
                Supported: YouTube links (youtu.be, youtube.com/watch, youtube.com/shorts)
              </p>
            </div>
          </div>

          {videoUrl && !error && validateVideoUrl(videoUrl) && (
            <div className="rounded-lg overflow-hidden bg-white/5 border border-white/10">
              <div className="aspect-video relative">
                <iframe
                  src={`https://www.youtube.com/embed/${extractVideoId(videoUrl)}`}
                  title="Video preview"
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Caption <span className="text-white/30 text-xs">(Optional)</span>
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write a caption for your video..."
              rows="3"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:border-[#D4AF37] focus:outline-none transition-colors resize-none"
              disabled={adding || success}
            />
            <p className="text-xs text-white/30 text-right mt-1">
              {caption.length}/500
            </p>
          </div>

          <button
            type="submit"
            disabled={adding || !videoUrl || success}
            className={`w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
              adding || !videoUrl || success
                ? 'bg-white/10 text-white/40 cursor-not-allowed'
                : 'bg-gradient-to-r from-[#D4AF37] to-yellow-500 text-black hover:opacity-90'
            }`}
          >
            {adding ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Adding Video...
              </>
            ) : success ? (
              <>
                <Check className="w-4 h-4" />
                Added!
              </>
            ) : (
              <>
                <Video className="w-4 h-4" />
                Add Video
              </>
            )}
          </button>

          <div className="text-center text-[10px] text-white/20">
            Supports YouTube videos only • Videos will appear in your profile
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}