// /components/profile/VideoModal.js
'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Video, Link2, Youtube, Loader, Check, AlertCircle, Upload, Film, Clock, HardDrive, Play, FileVideo } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

export default function VideoModal({ onClose, profileId, onVideoAdded }) {
  const [videoUrl, setVideoUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [uploadMethod, setUploadMethod] = useState('url'); // 'url' or 'upload'
  const [selectedFile, setSelectedFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileError, setFileError] = useState('');
  const fileInputRef = useRef(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
  const MAX_DURATION = 60; // 60 seconds

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

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileError('');
    setSelectedFile(null);
    setVideoPreview(null);

    // Check file type
    if (!file.type.startsWith('video/')) {
      setFileError('Please select a video file');
      return;
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      setFileError(`Video size exceeds 100MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB)`);
      return;
    }

    // Check duration
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      if (video.duration > MAX_DURATION) {
        setFileError(`Video duration (${Math.round(video.duration)}s) exceeds 60 second limit`);
        setSelectedFile(null);
        setVideoPreview(null);
        return;
      }
      
      // Valid video
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setVideoPreview(url);
      setFileError('');
    };
    video.onerror = () => {
      setFileError('Unable to read video file. Please try another file.');
    };
    video.src = URL.createObjectURL(file);
  };

  const uploadVideoFile = async () => {
    if (!selectedFile || !profileId) return null;

    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${profileId}/videos/${Date.now()}-${Math.random().toString(36).substr(2, 6)}.${fileExt}`;
      
      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 95) {
            clearInterval(interval);
            return 95;
          }
          return prev + 5;
        });
      }, 200);

      const { data, error: uploadError } = await supabase.storage
        .from('videos')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: selectedFile.type,
        });

      clearInterval(interval);
      setUploadProgress(100);

      if (uploadError) {
        console.error('Video upload error:', uploadError);
        throw new Error(uploadError.message);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(fileName);

      return publicUrl;

    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setUploadProgress(0);

    if (uploadMethod === 'url') {
      // URL submission
      if (!videoUrl) {
        setError('Please enter a video URL');
        return;
      }

      if (!validateVideoUrl(videoUrl)) {
        setError('Please enter a valid YouTube URL (youtu.be or youtube.com)');
        return;
      }

      if (!profileId) {
        setError('User not authenticated. Please log in.');
        return;
      }

      setAdding(true);

      try {
        const videoId = extractVideoId(videoUrl);
        const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : videoUrl;

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

        if (error) throw error;

        setSuccess(true);
        setVideoUrl('');
        setCaption('');

        if (onVideoAdded && data && data[0]) {
          onVideoAdded(data[0]);
        }

        setTimeout(() => {
          setAdding(false);
          onClose();
        }, 1500);

      } catch (error) {
        console.error('Error adding video:', error);
        setError(error.message || 'Failed to add video. Please try again.');
        setAdding(false);
      }

    } else {
      // Upload submission
      if (!selectedFile) {
        setError('Please select a video file to upload');
        return;
      }

      if (!profileId) {
        setError('User not authenticated. Please log in.');
        return;
      }

      setAdding(true);

      try {
        // Upload video to storage
        const publicUrl = await uploadVideoFile();

        if (!publicUrl) {
          throw new Error('Failed to upload video');
        }

        // Save video metadata to database
        const { data, error } = await supabase
          .from('videos')
          .insert({
            user_id: profileId,
            url: publicUrl,
            embed_url: publicUrl,
            caption: caption || '',
            provider: 'upload'
          })
          .select();

        if (error) throw error;

        setSuccess(true);
        setSelectedFile(null);
        setVideoPreview(null);
        setCaption('');
        setUploadProgress(0);

        if (onVideoAdded && data && data[0]) {
          onVideoAdded(data[0]);
        }

        setTimeout(() => {
          setAdding(false);
          onClose();
        }, 1500);

      } catch (error) {
        console.error('Error uploading video:', error);
        setError(error.message || 'Failed to upload video. Please try again.');
        setAdding(false);
        setUploadProgress(0);
      }
    }
  };

  const handleClose = () => {
    if (!adding) {
      onClose();
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
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
              Video {uploadMethod === 'url' ? 'added' : 'uploaded'} successfully!
            </div>
          )}

          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Upload Method Toggle */}
          <div className="flex gap-2 bg-white/5 rounded-lg p-1 border border-white/10">
            <button
              type="button"
              onClick={() => {
                setUploadMethod('url');
                setError('');
                setFileError('');
                setSelectedFile(null);
                setVideoPreview(null);
              }}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                uploadMethod === 'url'
                  ? 'bg-gradient-to-r from-[#D4AF37] to-yellow-500 text-black'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Link2 className="w-3.5 h-3.5" />
              YouTube URL
            </button>
            <button
              type="button"
              onClick={() => {
                setUploadMethod('upload');
                setError('');
                setVideoUrl('');
              }}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                uploadMethod === 'upload'
                  ? 'bg-gradient-to-r from-[#D4AF37] to-yellow-500 text-black'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              Upload Video
            </button>
          </div>

          {uploadMethod === 'url' ? (
            // YouTube URL Input
            <>
              <div>
                <label className="text-sm font-medium text-white/80 mb-2 flex items-center gap-2">
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
            </>
          ) : (
            // Video Upload Section
            <>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-white/80 mb-2">
                  <Upload className="w-4 h-4 text-[#D4AF37]" />
                  Upload Video
                </label>
                
                <div className="flex items-center gap-4">
                  <div 
                    className={`flex-1 p-4 border-2 border-dashed rounded-lg text-center cursor-pointer transition-all ${
                      fileError ? 'border-red-500 bg-red-500/10' : 
                      selectedFile ? 'border-green-500 bg-green-500/10' : 
                      'border-white/20 hover:border-[#D4AF37] hover:bg-white/5'
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      disabled={adding || success}
                    />
                    
                    {selectedFile ? (
                      <div className="space-y-1">
                        <FileVideo className="w-8 h-8 text-green-400 mx-auto" />
                        <p className="text-xs text-white/80 font-medium">{selectedFile.name}</p>
                        <p className="text-[10px] text-white/40">
                          {formatFileSize(selectedFile.size)}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <Film className="w-8 h-8 text-white/40 mx-auto" />
                        <p className="text-xs text-white/60">Click to select video</p>
                        <div className="flex justify-center gap-4 text-[10px] text-white/30">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            60s max
                          </span>
                          <span className="flex items-center gap-1">
                            <HardDrive className="w-3 h-3" />
                            100MB max
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {fileError && (
                  <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {fileError}
                  </p>
                )}

                {selectedFile && videoPreview && (
                  <div className="mt-3 rounded-lg overflow-hidden bg-white/5 border border-white/10">
                    <video
                      src={videoPreview}
                      className="w-full max-h-48 object-contain"
                      controls
                      preload="metadata"
                    />
                  </div>
                )}
              </div>

              {/* Upload Progress */}
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-white/40">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-[#D4AF37] to-yellow-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Caption - Common for both methods */}
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
              maxLength={500}
            />
            <p className="text-xs text-white/30 text-right mt-1">
              {caption.length}/500
            </p>
          </div>

          <button
            type="submit"
            disabled={adding || success || (uploadMethod === 'upload' && !selectedFile)}
            className={`w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
              adding || success || (uploadMethod === 'upload' && !selectedFile)
                ? 'bg-white/10 text-white/40 cursor-not-allowed'
                : 'bg-gradient-to-r from-[#D4AF37] to-yellow-500 text-black hover:opacity-90'
            }`}
          >
            {adding ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                {uploadMethod === 'upload' ? 'Uploading...' : 'Adding Video...'}
              </>
            ) : success ? (
              <>
                <Check className="w-4 h-4" />
                Added!
              </>
            ) : uploadMethod === 'upload' ? (
              <>
                <Upload className="w-4 h-4" />
                Upload Video
              </>
            ) : (
              <>
                <Video className="w-4 h-4" />
                Add Video
              </>
            )}
          </button>

          <div className="text-center text-[10px] text-white/20">
            {uploadMethod === 'url' 
              ? 'Supports YouTube videos only • Videos will appear in your profile'
              : 'Upload short videos (max 60s, 100MB) • Videos will appear in your profile'
            }
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}