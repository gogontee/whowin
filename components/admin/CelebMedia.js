// components/admin/CelebMedia.js
'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  Image as ImageIcon,
  Video,
  Youtube,
  Loader,
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Newspaper,
  Upload,
  Layout,
  FileText,
  Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { createBrowserClient } from '@supabase/ssr';
import NewsManagement from './NewsManagement';

export default function CelebMedia() {
  const [whoWinData, setWhoWinData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeSection, setActiveSection] = useState('carousel');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditFeaturedModal, setShowEditFeaturedModal] = useState(false);
  const [addForm, setAddForm] = useState({});
  const [addType, setAddType] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);
  const [editingFeaturedItem, setEditingFeaturedItem] = useState(null);

  // State for each column
  const [carousel, setCarousel] = useState([]);
  const [tvVideos, setTvVideos] = useState([]);
  const [celebGallery, setCelebGallery] = useState([]);
  const [videos, setVideos] = useState([]);
  const [heroSection, setHeroSection] = useState([]);
  const [featuredPost, setFeaturedPost] = useState([]);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // Fetch who_win data
  useEffect(() => {
    fetchWhoWinData();
  }, []);

  const fetchWhoWinData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('who_win')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

      if (error) throw error;

      setWhoWinData(data);
      
      // Initialize state with data or empty arrays
      setCarousel(data?.carousel || []);
      setTvVideos(data?.tv || []);
      setCelebGallery(data?.celeb_gallery || []);
      setVideos(data?.video || []);
      setHeroSection(data?.hero_section || []);
      setFeaturedPost(data?.featured_post || []);
      
    } catch (error) {
      console.error('Error fetching who_win data:', error);
      alert('Failed to load media data');
    } finally {
      setLoading(false);
    }
  };

  // Generic save function
  const saveChanges = async (columnName, newData) => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('who_win')
        .update({ [columnName]: newData })
        .eq('id', 1);

      if (error) throw error;
      
      // Update local state
      if (columnName === 'carousel') setCarousel(newData);
      if (columnName === 'tv') setTvVideos(newData);
      if (columnName === 'celeb_gallery') setCelebGallery(newData);
      if (columnName === 'video') setVideos(newData);
      if (columnName === 'hero_section') setHeroSection(newData);
      if (columnName === 'featured_post') setFeaturedPost(newData);
      
    } catch (error) {
      console.error(`Error saving ${columnName}:`, error);
      alert(`Failed to save ${columnName} changes`);
    } finally {
      setUpdating(false);
    }
  };

  // Upload file to Supabase Storage
  const uploadFile = async (file, folder = 'images') => {
    if (!file) return null;

    setUploading(true);
    setUploadProgress(0);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('who_win_media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('who_win_media')
        .getPublicUrl(filePath);

      setUploadProgress(100);
      return publicUrl;
      
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file: ' + error.message);
      return null;
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Handle file selection for upload
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
    if (!validTypes.includes(file.type)) {
      alert('Please select a valid image or video file (JPG, PNG, GIF, WEBP, MP4, WEBM)');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      alert('File size should be less than 20MB');
      return;
    }

    const folder = addType === 'tv' ? 'videos' : 
                   addType === 'featured' ? 'featured' : 
                   'images';
    const url = await uploadFile(file, folder);
    if (url) {
      setAddForm({ ...addForm, url: url, file: null });
    }
    e.target.value = '';
  };

  // Generate unique ID
  const generateId = () => {
    return `post_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  };

  // Extract YouTube video ID and create embed URL
  const processYouTubeUrl = (url) => {
    let videoId = '';
    
    if (url.includes('youtube.com/watch')) {
      const urlParams = new URLSearchParams(new URL(url).search);
      videoId = urlParams.get('v');
    }
    else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0];
    }
    else if (url.includes('youtube.com/embed/')) {
      videoId = url.split('youtube.com/embed/')[1]?.split('?')[0];
    }
    
    if (videoId) {
      return {
        url: url,
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
        provider: 'youtube'
      };
    }
    return null;
  };

  // --- HERO SECTION HANDLERS ---
  const handleAddHeroItem = (itemData) => {
    if (!itemData.url?.trim()) return;
    
    const newItem = { url: itemData.url.trim() };
    const updatedHero = [...heroSection, newItem];
    saveChanges('hero_section', updatedHero);
    setShowAddModal(false);
    setAddForm({});
  };

  const handleUpdateHeroItem = (index, newUrl) => {
    const updatedHero = heroSection.map((item, i) => 
      i === index ? { url: newUrl } : item
    );
    saveChanges('hero_section', updatedHero);
    setEditingId(null);
    setEditForm({});
  };

  const handleDeleteHeroItem = (index) => {
    if (window.confirm('Are you sure you want to delete this hero image?')) {
      const updatedHero = heroSection.filter((_, i) => i !== index);
      saveChanges('hero_section', updatedHero);
    }
  };

  // --- CAROUSEL HANDLERS ---
  const handleAddCarouselImage = (imageData) => {
    if (!imageData.url?.trim()) return;
    
    const newImage = { url: imageData.url.trim() };
    const updatedCarousel = [...carousel, newImage];
    saveChanges('carousel', updatedCarousel);
    setShowAddModal(false);
    setAddForm({});
  };

  const handleUpdateCarouselImage = (index, newUrl) => {
    const updatedCarousel = carousel.map((item, i) => 
      i === index ? { url: newUrl } : item
    );
    saveChanges('carousel', updatedCarousel);
    setEditingId(null);
    setEditForm({});
  };

  const handleDeleteCarouselImage = (index) => {
    if (window.confirm('Are you sure you want to delete this image?')) {
      const updatedCarousel = carousel.filter((_, i) => i !== index);
      saveChanges('carousel', updatedCarousel);
    }
  };

  // --- TV HANDLERS ---
  const handleAddTvVideo = (videoData) => {
    if (!videoData.url?.trim()) return;
    
    const newVideo = { url: videoData.url.trim() };
    const updatedTvVideos = [...tvVideos, newVideo];
    saveChanges('tv', updatedTvVideos);
    setShowAddModal(false);
    setAddForm({});
  };

  const handleUpdateTvVideo = (index, newUrl) => {
    const updatedTvVideos = tvVideos.map((item, i) => 
      i === index ? { url: newUrl } : item
    );
    saveChanges('tv', updatedTvVideos);
    setEditingId(null);
    setEditForm({});
  };

  const handleDeleteTvVideo = (index) => {
    if (window.confirm('Are you sure you want to delete this video?')) {
      const updatedTvVideos = tvVideos.filter((_, i) => i !== index);
      saveChanges('tv', updatedTvVideos);
    }
  };

  // --- GALLERY HANDLERS ---
  const handleAddGalleryImage = (imageData) => {
    if (!imageData.url?.trim()) return;
    
    const newItem = {
      id: generateId(),
      type: 'image',
      media: [{ url: imageData.url.trim() }],
      caption: imageData.caption || '',
      created_at: new Date().toISOString()
    };
    
    const updatedGallery = [...celebGallery, newItem];
    saveChanges('celeb_gallery', updatedGallery);
    setShowAddModal(false);
    setAddForm({});
  };

  const handleUpdateGalleryImage = (itemId, updates) => {
    const updatedGallery = celebGallery.map(item => 
      item.id === itemId ? { ...item, ...updates } : item
    );
    saveChanges('celeb_gallery', updatedGallery);
    setEditingId(null);
    setEditForm({});
  };

  const handleDeleteGalleryImage = (itemId) => {
    if (window.confirm('Are you sure you want to delete this gallery item?')) {
      const updatedGallery = celebGallery.filter(item => item.id !== itemId);
      saveChanges('celeb_gallery', updatedGallery);
    }
  };

  // --- VIDEO HANDLERS (YouTube) ---
  const handleAddVideo = (videoData) => {
    if (!videoData.url?.trim()) return;
    
    const processedVideo = processYouTubeUrl(videoData.url.trim());
    if (!processedVideo) {
      alert('Invalid YouTube URL. Please enter a valid YouTube link.');
      return;
    }
    
    const newItem = {
      id: generateId(),
      type: 'video',
      media: [{
        url: videoData.url.trim(),
        embedUrl: processedVideo.embedUrl,
        provider: 'youtube'
      }],
      caption: videoData.caption || '',
      created_at: new Date().toISOString()
    };
    
    const updatedVideos = [...videos, newItem];
    saveChanges('video', updatedVideos);
    setShowAddModal(false);
    setAddForm({});
  };

  const handleUpdateVideo = (itemId, updates) => {
    let processedUpdates = { ...updates };
    
    if (updates.url) {
      const processed = processYouTubeUrl(updates.url);
      if (processed) {
        processedUpdates.media = [{
          url: updates.url,
          embedUrl: processed.embedUrl,
          provider: 'youtube'
        }];
      } else {
        alert('Invalid YouTube URL');
        return;
      }
    }
    
    const updatedVideos = videos.map(item => 
      item.id === itemId ? { ...item, ...processedUpdates } : item
    );
    saveChanges('video', updatedVideos);
    setEditingId(null);
    setEditForm({});
  };

  const handleDeleteVideo = (itemId) => {
    if (window.confirm('Are you sure you want to delete this video?')) {
      const updatedVideos = videos.filter(item => item.id !== itemId);
      saveChanges('video', updatedVideos);
    }
  };

  // --- FEATURED POST HANDLERS ---
  const handleAddFeaturedItem = (itemData) => {
    if (!itemData.media || !itemData.media[0]?.url) {
      alert('Please provide a valid image or video URL');
      return;
    }

    const newItem = {
      id: generateId(),
      type: itemData.type || 'image',
      media: [{ url: itemData.media[0].url.trim() }],
      caption: itemData.caption || '',
      created_at: new Date().toISOString()
    };
    
    const updatedFeatured = [...featuredPost, newItem];
    saveChanges('featured_post', updatedFeatured);
    setShowAddModal(false);
    setAddForm({});
  };

  const handleEditFeaturedItem = (item) => {
    setEditingFeaturedItem(item);
    setEditForm({
      caption: item.caption || '',
      url: item.media[0]?.url || '',
      type: item.type || 'image'
    });
    setShowEditFeaturedModal(true);
  };

  const handleUpdateFeaturedItem = async () => {
    if (!editingFeaturedItem) return;
    
    const updatedItem = {
      ...editingFeaturedItem,
      caption: editForm.caption || '',
      media: [{ url: editForm.url || editingFeaturedItem.media[0]?.url }]
    };

    // If URL changed, update the media URL
    if (editForm.url && editForm.url !== editingFeaturedItem.media[0]?.url) {
      updatedItem.media = [{ url: editForm.url }];
    }

    const updatedFeatured = featuredPost.map(item => 
      item.id === editingFeaturedItem.id ? updatedItem : item
    );
    
    saveChanges('featured_post', updatedFeatured);
    setShowEditFeaturedModal(false);
    setEditingFeaturedItem(null);
    setEditForm({});
  };

  const handleDeleteFeaturedItem = (itemId) => {
    if (window.confirm('Are you sure you want to delete this featured item?')) {
      const updatedFeatured = featuredPost.filter(item => item.id !== itemId);
      saveChanges('featured_post', updatedFeatured);
    }
  };

  // Open add modal
  const openAddModal = (type) => {
    setAddType(type);
    setAddForm({});
    setShowAddModal(true);
  };

  // Sections configuration
  const sections = [
    { id: 'hero', label: 'Hero', icon: Layout, count: heroSection.length },
    { id: 'carousel', label: 'Carousel', icon: ImageIcon, count: carousel.length },
    { id: 'tv', label: 'TV', icon: Video, count: tvVideos.length },
    { id: 'gallery', label: 'Gallery', icon: ImageIcon, count: celebGallery.length },
    { id: 'videos', label: 'YouTube', icon: Youtube, count: videos.length },
    { id: 'featured', label: 'Featured', icon: FileText, count: featuredPost.length },
    { id: 'news', label: 'News', icon: Newspaper, count: 0 }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 text-burnt-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Section Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-hide">
        {sections.map(section => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`flex items-center gap-1 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
              activeSection === section.id
                ? section.id === 'news'
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  : 'bg-gradient-to-r from-burnt-orange-500 to-yellow-500 text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            <section.icon className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline sm:inline">{section.label}</span>
            {section.id !== 'news' && (
              <span className="text-[8px] sm:text-xs bg-white/20 px-1 py-0.5 rounded-full ml-0.5">
                {section.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Conditional rendering - Show NewsManagement when news section is active */}
      {activeSection === 'news' ? (
        <NewsManagement />
      ) : (
        <>
          {/* Add Button - Hide for featured section (uses edit modal instead) */}
          {activeSection !== 'featured' && (
            <div className="flex justify-end">
              <button
                onClick={() => openAddModal(activeSection)}
                className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg text-xs sm:text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Add</span>
                <span className="xs:hidden">+</span>
              </button>
            </div>
          )}

          {/* Content Display */}
          <div className="bg-white/5 rounded-xl border border-white/10 p-3 sm:p-4">
            {/* HERO SECTION */}
            {activeSection === 'hero' && (
              <div className="space-y-3 sm:space-y-4">
                <h3 className="text-xs sm:text-sm font-medium text-white/80">Hero Section Images</h3>
                <p className="text-[10px] text-white/40">These images appear on the homepage hero slider</p>
                {heroSection.length === 0 ? (
                  <p className="text-center text-white/40 py-6 sm:py-8 text-xs sm:text-sm">No hero images</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4">
                    {heroSection.map((item, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="relative group bg-white/5 rounded-lg overflow-hidden border border-white/10 aspect-video"
                      >
                        {/* Same as before... */}
                        {editingId === `hero-${index}` ? (
                          <div className="p-2 space-y-2">
                            <input
                              type="text"
                              value={editForm.url || item.url}
                              onChange={(e) => setEditForm({ url: e.target.value })}
                              className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-[10px] text-white"
                              placeholder="Image URL"
                            />
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleUpdateHeroItem(index, editForm.url)}
                                className="flex-1 py-1 bg-green-500/20 text-green-400 rounded text-[10px] font-medium"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="flex-1 py-1 bg-red-500/20 text-red-400 rounded text-[10px] font-medium"
                              >
                                X
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <Image
                              src={item.url}
                              alt={`Hero ${index + 1}`}
                              fill
                              className="object-cover"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                              <button
                                onClick={() => {
                                  setEditingId(`hero-${index}`);
                                  setEditForm({ url: item.url });
                                }}
                                className="p-1 bg-blue-500/20 rounded-lg hover:bg-blue-500/30"
                              >
                                <Edit className="w-3 h-3 text-blue-400" />
                              </button>
                              <button
                                onClick={() => handleDeleteHeroItem(index)}
                                className="p-1 bg-red-500/20 rounded-lg hover:bg-red-500/30"
                              >
                                <Trash2 className="w-3 h-3 text-red-400" />
                              </button>
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 bg-white/20 rounded-lg hover:bg-white/30"
                              >
                                <ExternalLink className="w-3 h-3 text-white" />
                              </a>
                            </div>
                          </>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* CAROUSEL SECTION */}
            {activeSection === 'carousel' && (
              <div className="space-y-3 sm:space-y-4">
                <h3 className="text-xs sm:text-sm font-medium text-white/80">Carousel Images</h3>
                {carousel.length === 0 ? (
                  <p className="text-center text-white/40 py-6 sm:py-8 text-xs sm:text-sm">No carousel images</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4">
                    {carousel.map((item, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="relative group bg-white/5 rounded-lg overflow-hidden border border-white/10 aspect-video"
                      >
                        {editingId === `carousel-${index}` ? (
                          <div className="p-2 space-y-2">
                            <input
                              type="text"
                              value={editForm.url || item.url}
                              onChange={(e) => setEditForm({ url: e.target.value })}
                              className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-[10px] text-white"
                              placeholder="Image URL"
                            />
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleUpdateCarouselImage(index, editForm.url)}
                                className="flex-1 py-1 bg-green-500/20 text-green-400 rounded text-[10px] font-medium"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="flex-1 py-1 bg-red-500/20 text-red-400 rounded text-[10px] font-medium"
                              >
                                X
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <Image
                              src={item.url}
                              alt={`Carousel ${index + 1}`}
                              fill
                              className="object-cover"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                              <button
                                onClick={() => {
                                  setEditingId(`carousel-${index}`);
                                  setEditForm({ url: item.url });
                                }}
                                className="p-1 bg-blue-500/20 rounded-lg hover:bg-blue-500/30"
                              >
                                <Edit className="w-3 h-3 text-blue-400" />
                              </button>
                              <button
                                onClick={() => handleDeleteCarouselImage(index)}
                                className="p-1 bg-red-500/20 rounded-lg hover:bg-red-500/30"
                              >
                                <Trash2 className="w-3 h-3 text-red-400" />
                              </button>
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 bg-white/20 rounded-lg hover:bg-white/30"
                              >
                                <ExternalLink className="w-3 h-3 text-white" />
                              </a>
                            </div>
                          </>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TV SECTION */}
            {activeSection === 'tv' && (
              <div className="space-y-3 sm:space-y-4">
                <h3 className="text-xs sm:text-sm font-medium text-white/80">TV Videos</h3>
                {tvVideos.length === 0 ? (
                  <p className="text-center text-white/40 py-6 sm:py-8 text-xs sm:text-sm">No TV videos</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {tvVideos.map((item, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="relative group bg-white/5 rounded-lg overflow-hidden border border-white/10"
                      >
                        {editingId === `tv-${index}` ? (
                          <div className="p-2 space-y-2">
                            <input
                              type="text"
                              value={editForm.url || item.url}
                              onChange={(e) => setEditForm({ url: e.target.value })}
                              className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-xs text-white"
                              placeholder="Video URL"
                            />
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleUpdateTvVideo(index, editForm.url)}
                                className="flex-1 py-1 bg-green-500/20 text-green-400 rounded text-xs font-medium"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="flex-1 py-1 bg-red-500/20 text-red-400 rounded text-xs font-medium"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <video
                              src={item.url}
                              className="w-full aspect-video object-cover"
                              controls
                            />
                            <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => {
                                  setEditingId(`tv-${index}`);
                                  setEditForm({ url: item.url });
                                }}
                                className="p-1 bg-blue-500/20 rounded-lg hover:bg-blue-500/30"
                              >
                                <Edit className="w-3 h-3 text-blue-400" />
                              </button>
                              <button
                                onClick={() => handleDeleteTvVideo(index)}
                                className="p-1 bg-red-500/20 rounded-lg hover:bg-red-500/30"
                              >
                                <Trash2 className="w-3 h-3 text-red-400" />
                              </button>
                            </div>
                          </>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* GALLERY SECTION */}
            {activeSection === 'gallery' && (
              <div className="space-y-3 sm:space-y-4">
                <h3 className="text-xs sm:text-sm font-medium text-white/80">Celeb Gallery</h3>
                {celebGallery.length === 0 ? (
                  <p className="text-center text-white/40 py-6 sm:py-8 text-xs sm:text-sm">No gallery items</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
                    {celebGallery.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="relative group bg-white/5 rounded-lg overflow-hidden border border-white/10"
                      >
                        {editingId === item.id ? (
                          <div className="p-2 space-y-2">
                            <input
                              type="text"
                              value={editForm.caption || item.caption}
                              onChange={(e) => setEditForm({ caption: e.target.value })}
                              className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-[10px] text-white"
                              placeholder="Caption"
                            />
                            <input
                              type="text"
                              value={editForm.url || item.media[0]?.url || ''}
                              onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
                              className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-[10px] text-white"
                              placeholder="Image URL"
                            />
                            <div className="flex gap-1">
                              <button
                                onClick={() => {
                                  const updates = {};
                                  if (editForm.caption !== undefined) updates.caption = editForm.caption;
                                  if (editForm.url) {
                                    updates.media = [{ url: editForm.url }];
                                  }
                                  handleUpdateGalleryImage(item.id, updates);
                                }}
                                className="flex-1 py-1 bg-green-500/20 text-green-400 rounded text-[10px] font-medium"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="flex-1 py-1 bg-red-500/20 text-red-400 rounded text-[10px] font-medium"
                              >
                                X
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="aspect-square relative">
                              <Image
                                src={item.media[0]?.url || ''}
                                alt={item.caption || 'Gallery image'}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="p-1">
                              <p className="text-[10px] text-white/80 truncate">{item.caption || 'No caption'}</p>
                              <p className="text-[8px] text-white/40">
                                {new Date(item.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => {
                                  setEditingId(item.id);
                                  setEditForm({ caption: item.caption, url: item.media[0]?.url });
                                }}
                                className="p-1 bg-blue-500/20 rounded-lg hover:bg-blue-500/30"
                              >
                                <Edit className="w-3 h-3 text-blue-400" />
                              </button>
                              <button
                                onClick={() => handleDeleteGalleryImage(item.id)}
                                className="p-1 bg-red-500/20 rounded-lg hover:bg-red-500/30"
                              >
                                <Trash2 className="w-3 h-3 text-red-400" />
                              </button>
                            </div>
                          </>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* YOUTUBE SECTION */}
            {activeSection === 'videos' && (
              <div className="space-y-3 sm:space-y-4">
                <h3 className="text-xs sm:text-sm font-medium text-white/80">YouTube Videos</h3>
                {videos.length === 0 ? (
                  <p className="text-center text-white/40 py-6 sm:py-8 text-xs sm:text-sm">No YouTube videos</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {videos.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="relative group bg-white/5 rounded-lg overflow-hidden border border-white/10"
                      >
                        {editingId === item.id ? (
                          <div className="p-2 space-y-2">
                            <input
                              type="text"
                              value={editForm.caption || item.caption}
                              onChange={(e) => setEditForm({ caption: e.target.value })}
                              className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-xs text-white"
                              placeholder="Caption"
                            />
                            <input
                              type="text"
                              value={editForm.url || item.media[0]?.url || ''}
                              onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
                              className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-xs text-white"
                              placeholder="YouTube URL"
                            />
                            <div className="flex gap-1">
                              <button
                                onClick={() => {
                                  if (editForm.url && editForm.url !== item.media[0]?.url) {
                                    handleUpdateVideo(item.id, { url: editForm.url, caption: editForm.caption });
                                  } else {
                                    handleUpdateVideo(item.id, { caption: editForm.caption });
                                  }
                                }}
                                className="flex-1 py-1 bg-green-500/20 text-green-400 rounded text-xs font-medium"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="flex-1 py-1 bg-red-500/20 text-red-400 rounded text-xs font-medium"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="aspect-video">
                              <iframe
                                src={item.media[0]?.embedUrl}
                                title={item.caption || 'YouTube video'}
                                className="w-full h-full"
                                allowFullScreen
                              />
                            </div>
                            <div className="p-2">
                              <p className="text-xs text-white/80 truncate">{item.caption || 'No caption'}</p>
                              <p className="text-[10px] text-white/40">
                                {new Date(item.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => {
                                  setEditingId(item.id);
                                  setEditForm({ 
                                    caption: item.caption, 
                                    url: item.media[0]?.url 
                                  });
                                }}
                                className="p-1.5 bg-blue-500/20 rounded-lg hover:bg-blue-500/30"
                              >
                                <Edit className="w-3.5 h-3.5 text-blue-400" />
                              </button>
                              <button
                                onClick={() => handleDeleteVideo(item.id)}
                                className="p-1.5 bg-red-500/20 rounded-lg hover:bg-red-500/30"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                              </button>
                            </div>
                          </>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* FEATURED POST SECTION */}
            {activeSection === 'featured' && (
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs sm:text-sm font-medium text-white/80">Featured Posts</h3>
                    <p className="text-[10px] text-white/40">These appear on the homepage featured section</p>
                  </div>
                  <button
                    onClick={() => openAddModal('featured')}
                    className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg text-xs font-medium hover:opacity-90 transition-opacity"
                  >
                    <Plus className="w-3 h-3" />
                    Add
                  </button>
                </div>
                
                {featuredPost.length === 0 ? (
                  <p className="text-center text-white/40 py-6 sm:py-8 text-xs sm:text-sm">No featured items</p>
                ) : (
                  <div className="space-y-3">
                    {featuredPost.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-white/5 rounded-lg border border-white/10 p-3 flex items-center gap-3 hover:bg-white/10 transition-colors"
                      >
                        {/* Thumbnail */}
                        <div className="relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-800">
                          {item.type === 'video' ? (
                            <div className="w-full h-full bg-black/80 flex items-center justify-center">
                              <Play className="w-5 h-5 text-white/40" fill="white" />
                            </div>
                          ) : (
                            <img
                              src={item.media[0]?.url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {item.type === 'video' ? (
                              <span className="px-1.5 py-0.5 bg-green-500/20 rounded text-[8px] text-green-400 font-medium">VIDEO</span>
                            ) : (
                              <span className="px-1.5 py-0.5 bg-orange-500/20 rounded text-[8px] text-orange-400 font-medium">IMAGE</span>
                            )}
                            <span className="text-[10px] text-white/30">
                              {item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}
                            </span>
                          </div>
                          <p className="text-xs text-white/80 truncate">
                            {item.caption || (item.type === 'video' ? 'Video' : 'Image')}
                          </p>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEditFeaturedItem(item)}
                            className="p-1.5 bg-blue-500/20 rounded-lg hover:bg-blue-500/30 transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5 text-blue-400" />
                          </button>
                          <button
                            onClick={() => handleDeleteFeaturedItem(item.id)}
                            className="p-1.5 bg-red-500/20 rounded-lg hover:bg-red-500/30 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-b from-gray-900 to-black rounded-xl border border-white/10 p-4 sm:p-6 max-w-md w-full mx-4"
            >
              <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4">
                {addType === 'hero' ? 'Add Hero Image' :
                 addType === 'carousel' ? 'Add Carousel Image' : 
                 addType === 'tv' ? 'Add TV Video' :
                 addType === 'gallery' ? 'Add Gallery Item' : 
                 addType === 'featured' ? 'Add Featured Item' :
                 'Add YouTube Video'}
              </h3>

              <div className="space-y-3 sm:space-y-4">
                {/* File Upload for Hero, Carousel, TV, Gallery, Featured */}
                {(addType === 'hero' || addType === 'carousel' || addType === 'tv' || addType === 'gallery' || addType === 'featured') && (
                  <>
                    <div>
                      <label className="block text-xs text-white/60 mb-1">
                        Upload File (JPG, PNG, GIF, WEBP, MP4)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileSelect}
                          accept="image/*,video/*"
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                          className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2 border border-white/10"
                        >
                          {uploading ? (
                            <>
                              <Loader className="w-4 h-4 animate-spin" />
                              {uploadProgress > 0 ? `${uploadProgress}%` : 'Uploading...'}
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4" />
                              Choose File
                            </>
                          )}
                        </button>
                      </div>
                      {addForm.url && (
                        <p className="text-[10px] text-green-400 mt-1 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          File uploaded successfully
                        </p>
                      )}
                    </div>

                    {/* Show preview */}
                    {addForm.url && (
                      <div className="relative w-full h-32 rounded-lg overflow-hidden border border-white/10">
                        {addType === 'tv' ? (
                          <video src={addForm.url} className="w-full h-full object-cover" controls />
                        ) : (
                          <Image src={addForm.url} alt="Preview" fill className="object-cover" />
                        )}
                      </div>
                    )}

                    {/* OR Divider */}
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/10"></div>
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="bg-gray-900 px-2 text-white/40">OR Enter URL</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-white/60 mb-1">File URL (optional)</label>
                      <input
                        type="text"
                        value={addForm.url || ''}
                        onChange={(e) => setAddForm({ ...addForm, url: e.target.value })}
                        placeholder="https://example.com/file.jpg"
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white"
                      />
                    </div>
                  </>
                )}

                {/* YouTube URL - Only for videos section */}
                {addType === 'videos' && (
                  <div>
                    <label className="block text-xs text-white/60 mb-1">YouTube URL *</label>
                    <input
                      type="text"
                      value={addForm.url || ''}
                      onChange={(e) => setAddForm({ ...addForm, url: e.target.value })}
                      placeholder="https://youtu.be/... or https://youtube.com/watch?v=..."
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white"
                    />
                  </div>
                )}

                {/* Caption for Gallery, Videos, and Featured */}
                {(addType === 'gallery' || addType === 'videos' || addType === 'featured') && (
                  <div>
                    <label className="block text-xs text-white/60 mb-1">Caption (optional)</label>
                    <input
                      type="text"
                      value={addForm.caption || ''}
                      onChange={(e) => setAddForm({ ...addForm, caption: e.target.value })}
                      placeholder="Enter caption"
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white"
                    />
                  </div>
                )}

                {/* Type selector for Featured */}
                {addType === 'featured' && (
                  <div>
                    <label className="block text-xs text-white/60 mb-1">Type</label>
                    <select
                      value={addForm.type || 'image'}
                      onChange={(e) => setAddForm({ ...addForm, type: e.target.value })}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white"
                    >
                      <option value="image">Image</option>
                      <option value="video">Video</option>
                    </select>
                  </div>
                )}

                <div className="flex gap-2 sm:gap-3 pt-3 sm:pt-4">
                  <button
                    onClick={() => {
                      if (addType === 'hero') handleAddHeroItem(addForm);
                      if (addType === 'carousel') handleAddCarouselImage(addForm);
                      if (addType === 'tv') handleAddTvVideo(addForm);
                      if (addType === 'gallery') handleAddGalleryImage(addForm);
                      if (addType === 'videos') handleAddVideo(addForm);
                      if (addType === 'featured') handleAddFeaturedItem(addForm);
                    }}
                    disabled={updating || uploading || !addForm.url}
                    className="flex-1 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {updating || uploading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader className="w-4 h-4 animate-spin" />
                        {uploading ? 'Uploading...' : 'Adding...'}
                      </span>
                    ) : (
                      'Add'
                    )}
                  </button>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Featured Modal */}
      <AnimatePresence>
        {showEditFeaturedModal && editingFeaturedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => {
              setShowEditFeaturedModal(false);
              setEditingFeaturedItem(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-b from-gray-900 to-black rounded-xl border border-white/10 p-4 sm:p-6 max-w-md w-full mx-4"
            >
              <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4">Edit Featured Item</h3>

              <div className="space-y-3 sm:space-y-4">
                {/* Preview */}
                <div className="relative w-full h-32 rounded-lg overflow-hidden border border-white/10 bg-gray-800">
                  {editingFeaturedItem.type === 'video' ? (
                    <video src={editForm.url || editingFeaturedItem.media[0]?.url} className="w-full h-full object-cover" controls />
                  ) : (
                    <img
                      src={editForm.url || editingFeaturedItem.media[0]?.url}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs text-white/60 mb-1">Media URL</label>
                  <input
                    type="text"
                    value={editForm.url || ''}
                    onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
                    placeholder="https://example.com/file.jpg"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs text-white/60 mb-1">Caption</label>
                  <input
                    type="text"
                    value={editForm.caption || ''}
                    onChange={(e) => setEditForm({ ...editForm, caption: e.target.value })}
                    placeholder="Enter caption"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs text-white/60 mb-1">Type</label>
                  <select
                    value={editForm.type || 'image'}
                    onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white"
                  >
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                  </select>
                </div>

                <div className="flex gap-2 sm:gap-3 pt-3 sm:pt-4">
                  <button
                    onClick={handleUpdateFeaturedItem}
                    disabled={updating}
                    className="flex-1 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {updating ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader className="w-4 h-4 animate-spin" />
                        Updating...
                      </span>
                    ) : (
                      'Update'
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowEditFeaturedModal(false);
                      setEditingFeaturedItem(null);
                    }}
                    className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Updating Indicator */}
      <AnimatePresence>
        {updating && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 bg-green-500/90 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg shadow-lg flex items-center gap-1.5 sm:gap-2 z-50"
          >
            <Loader className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
            <span className="text-xs sm:text-sm">Saving...</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}