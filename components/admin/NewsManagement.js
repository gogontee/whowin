// components/admin/NewsManagement.js
'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Trash2,
  Edit,
  Loader,
  Image as ImageIcon,
  Calendar,
  User,
  Eye,
  Heart,
  MessageCircle,
  TrendingUp,
  Star,
  Clock,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  X,
  Save,
  AlertCircle,
  Check,
  ExternalLink,
  Upload,
  Download,
  Bold,
  Italic,
  Underline,
  Link as LinkIcon,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading1,
  Heading2,
  Quote,
  Code,
  Image as ImageIcon2, // renamed to avoid conflict
  Undo,
  Redo
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';

export default function NewsManagement() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingNews, setEditingNews] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);
  const contentRef = useRef(null);
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    image_url: '',
    category: 'NEWS',
    read_time: 3,
    author: 'Celebrity Star Team',
    author_avatar: '',
    is_featured: false,
    is_trending: false,
    published_at: new Date().toISOString().slice(0, 16)
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [featuredFilter, setFeaturedFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const categories = [
    'EXCLUSIVE',
    'NEWS',
    'INSIGHT',
    'INTERVIEW',
    'BEHIND THE SCENES'
  ];

  // Fetch news data
  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .order('published_at', { ascending: false });

      if (error) throw error;
      setNews(data || []);
    } catch (error) {
      console.error('Error fetching news:', error);
      alert('Failed to load news');
    } finally {
      setLoading(false);
    }
  };

  // Filter news based on search and filters
  const filteredNews = news.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.excerpt?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesFeatured = featuredFilter === 'all' || 
                           (featuredFilter === 'featured' && item.is_featured) ||
                           (featuredFilter === 'trending' && item.is_trending);
    return matchesSearch && matchesCategory && matchesFeatured;
  });

  // Pagination
  const totalPages = Math.ceil(filteredNews.length / itemsPerPage);
  const paginatedNews = filteredNews.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Upload image to Supabase storage
  const uploadImage = async (file) => {
    if (!file) return null;

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('news')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('news')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  // Handle file selection
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    const imageUrl = await uploadImage(file);
    if (imageUrl) {
      setFormData({ ...formData, image_url: imageUrl });
    }
  };

  // Delete image from storage
  const deleteImage = async (imageUrl) => {
    if (!imageUrl) return;

    try {
      const urlParts = imageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      
      const { error } = await supabase.storage
        .from('news')
        .remove([fileName]);

      if (error) {
        console.error('Error deleting image:', error);
      }
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  };

  // ===== RICH TEXT EDITOR FUNCTIONS =====
  
  const saveContentState = () => {
    if (contentRef.current) {
      const content = contentRef.current.innerHTML;
      setUndoStack([...undoStack, content]);
      setRedoStack([]);
    }
  };

  const formatText = (command, value = null) => {
    saveContentState();
    document.execCommand(command, false, value);
    contentRef.current.focus();
  };

  const insertLink = () => {
    const url = prompt('Enter the URL:');
    if (url) {
      saveContentState();
      document.execCommand('createLink', false, url);
    }
  };

  const insertImage = () => {
    const url = prompt('Enter the image URL:');
    if (url) {
      saveContentState();
      document.execCommand('insertImage', false, url);
    }
  };

  const handleUndo = () => {
    if (undoStack.length > 0) {
      const lastState = undoStack.pop();
      setRedoStack([contentRef.current.innerHTML, ...redoStack]);
      contentRef.current.innerHTML = lastState;
      setUndoStack([...undoStack]);
    }
  };

  const handleRedo = () => {
    if (redoStack.length > 0) {
      const nextState = redoStack.shift();
      setUndoStack([...undoStack, contentRef.current.innerHTML]);
      contentRef.current.innerHTML = nextState;
      setRedoStack([...redoStack]);
    }
  };

  const handleContentChange = () => {
    if (contentRef.current) {
      setFormData({ ...formData, content: contentRef.current.innerHTML });
    }
  };

  // ===== CRUD OPERATIONS =====

  const handleAddNews = async () => {
    if (!formData.title || !formData.category) {
      alert('Title and category are required');
      return;
    }

    setUpdating(true);
    try {
      const newNews = {
        ...formData,
        content: formData.content || '',
        published_at: formData.published_at ? new Date(formData.published_at).toISOString() : new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('news')
        .insert([newNews])
        .select()
        .single();

      if (error) throw error;

      setNews([data, ...news]);
      setShowAddModal(false);
      resetForm();
      alert('News added successfully!');
    } catch (error) {
      console.error('Error adding news:', error);
      alert('Failed to add news');
    } finally {
      setUpdating(false);
    }
  };

  const handleEditNews = async () => {
    if (!editingNews) return;

    setUpdating(true);
    try {
      if (editingNews.image_url && editingNews.image_url !== formData.image_url) {
        await deleteImage(editingNews.image_url);
      }

      const updatedNews = {
        ...editingNews,
        ...formData,
        content: formData.content || '',
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('news')
        .update(updatedNews)
        .eq('id', editingNews.id);

      if (error) throw error;

      setNews(news.map(item => 
        item.id === editingNews.id ? updatedNews : item
      ));
      setShowEditModal(false);
      setEditingNews(null);
      resetForm();
      alert('News updated successfully!');
    } catch (error) {
      console.error('Error updating news:', error);
      alert('Failed to update news');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteNews = async (id) => {
    if (!window.confirm('Are you sure you want to delete this news article?')) return;

    setUpdating(true);
    try {
      const newsItem = news.find(item => item.id === id);
      
      const { error } = await supabase
        .from('news')
        .delete()
        .eq('id', id);

      if (error) throw error;

      if (newsItem?.image_url) {
        await deleteImage(newsItem.image_url);
      }

      setNews(news.filter(item => item.id !== id));
      alert('News deleted successfully!');
    } catch (error) {
      console.error('Error deleting news:', error);
      alert('Failed to delete news');
    } finally {
      setUpdating(false);
    }
  };

  const toggleFeatured = async (item) => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('news')
        .update({ is_featured: !item.is_featured, updated_at: new Date().toISOString() })
        .eq('id', item.id);

      if (error) throw error;

      setNews(news.map(n => 
        n.id === item.id ? { ...n, is_featured: !n.is_featured } : n
      ));
    } catch (error) {
      console.error('Error toggling featured:', error);
      alert('Failed to update featured status');
    } finally {
      setUpdating(false);
    }
  };

  const toggleTrending = async (item) => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('news')
        .update({ is_trending: !item.is_trending, updated_at: new Date().toISOString() })
        .eq('id', item.id);

      if (error) throw error;

      setNews(news.map(n => 
        n.id === item.id ? { ...n, is_trending: !n.is_trending } : n
      ));
    } catch (error) {
      console.error('Error toggling trending:', error);
      alert('Failed to update trending status');
    } finally {
      setUpdating(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      excerpt: '',
      content: '',
      image_url: '',
      category: 'NEWS',
      read_time: 3,
      author: 'Celebrity Star Team',
      author_avatar: '',
      is_featured: false,
      is_trending: false,
      published_at: new Date().toISOString().slice(0, 16)
    });
    setUndoStack([]);
    setRedoStack([]);
    if (contentRef.current) {
      contentRef.current.innerHTML = '';
    }
  };

  const openEditModal = (item) => {
    setEditingNews(item);
    setFormData({
      title: item.title || '',
      excerpt: item.excerpt || '',
      content: item.content || '',
      image_url: item.image_url || '',
      category: item.category || 'NEWS',
      read_time: item.read_time || 3,
      author: item.author || 'Celebrity Star Team',
      author_avatar: item.author_avatar || '',
      is_featured: item.is_featured || false,
      is_trending: item.is_trending || false,
      published_at: item.published_at ? new Date(item.published_at).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16)
    });
    setShowEditModal(true);
    // Set content after modal opens
    setTimeout(() => {
      if (contentRef.current && item.content) {
        contentRef.current.innerHTML = item.content;
      }
    }, 100);
  };

  const handleRemoveImage = () => {
    setFormData({ ...formData, image_url: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Rich Text Editor Toolbar Button Component
  const ToolbarButton = ({ icon: Icon, onClick, label, isActive = false }) => (
    <button
      type="button"
      onClick={onClick}
      className={`p-1.5 rounded hover:bg-white/10 transition-colors ${
        isActive ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white'
      }`}
      title={label}
    >
      <Icon className="w-3.5 h-3.5" />
    </button>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 text-burnt-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-white/5 rounded-xl border border-white/10 p-3 sm:p-4">
        <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
          <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-burnt-orange-400" />
          News Management
        </h2>
        <p className="text-[10px] sm:text-xs text-white/40 mt-1">
          Create, edit and manage news articles
        </p>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 sm:gap-3">
        <div className="relative col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search news..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/40"
          />
        </div>
        
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white"
        >
          <option value="all">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <select
          value={featuredFilter}
          onChange={(e) => setFeaturedFilter(e.target.value)}
          className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white"
        >
          <option value="all">All Articles</option>
          <option value="featured">Featured Only</option>
          <option value="trending">Trending Only</option>
        </select>
      </div>

      {/* Add Button */}
      <div className="flex justify-end">
        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg text-xs sm:text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
          <span>Add News</span>
        </button>
      </div>

      {/* News Table */}
      <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-3 text-xs font-medium text-white/60">Article</th>
                <th className="text-left p-3 text-xs font-medium text-white/60">Category</th>
                <th className="text-left p-3 text-xs font-medium text-white/60">Stats</th>
                <th className="text-left p-3 text-xs font-medium text-white/60">Status</th>
                <th className="text-left p-3 text-xs font-medium text-white/60">Published</th>
                <th className="text-left p-3 text-xs font-medium text-white/60">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedNews.map((item) => (
                <motion.tr
                  key={item.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-b border-white/5 hover:bg-white/5"
                >
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      {item.image_url ? (
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                          <Image
                            src={item.image_url}
                            alt={item.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                          <ImageIcon className="w-5 h-5 text-white/20" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-white line-clamp-1">{item.title}</p>
                        <p className="text-xs text-white/40 line-clamp-1">{item.excerpt || 'No excerpt'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium
                      ${item.category === 'EXCLUSIVE' ? 'bg-purple-500/20 text-purple-400' : ''}
                      ${item.category === 'NEWS' ? 'bg-blue-500/20 text-blue-400' : ''}
                      ${item.category === 'INSIGHT' ? 'bg-green-500/20 text-green-400' : ''}
                      ${item.category === 'INTERVIEW' ? 'bg-yellow-500/20 text-yellow-400' : ''}
                      ${item.category === 'BEHIND THE SCENES' ? 'bg-pink-500/20 text-pink-400' : ''}
                    `}>
                      {item.category}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-xs text-white/60">
                        <Eye className="w-3 h-3" />
                        {item.views_count || 0}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-white/60">
                        <Heart className="w-3 h-3" />
                        {item.likes_count || 0}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-white/60">
                        <MessageCircle className="w-3 h-3" />
                        {item.comments_count || 0}
                      </span>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => toggleFeatured(item)}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                          item.is_featured 
                            ? 'bg-yellow-500/20 text-yellow-400' 
                            : 'bg-white/5 text-white/40 hover:bg-white/10'
                        }`}
                      >
                        <Star className="w-3 h-3" />
                        Featured
                      </button>
                      <button
                        onClick={() => toggleTrending(item)}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                          item.is_trending 
                            ? 'bg-red-500/20 text-red-400' 
                            : 'bg-white/5 text-white/40 hover:bg-white/10'
                        }`}
                      >
                        <TrendingUp className="w-3 h-3" />
                        Trending
                      </button>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="text-xs">
                      <p className="text-white">{new Date(item.published_at).toLocaleDateString()}</p>
                      <p className="text-white/40">{new Date(item.published_at).toLocaleTimeString()}</p>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/updates/[id]`.replace('[id]', item.id)}
                        target="_blank"
                        className="p-1.5 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4 text-white/60" />
                      </Link>
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-1.5 bg-blue-500/20 rounded-lg hover:bg-blue-500/30 transition-colors"
                      >
                        <Edit className="w-4 h-4 text-blue-400" />
                      </button>
                      <button
                        onClick={() => handleDeleteNews(item.id)}
                        className="p-1.5 bg-red-500/20 rounded-lg hover:bg-red-500/30 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-white/10">
            <p className="text-sm text-white/40">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredNews.length)} of {filteredNews.length} articles
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 bg-white/5 rounded-lg hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4 text-white" />
              </button>
              <span className="text-sm text-white">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 bg-white/5 rounded-lg hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal with Rich Text Editor */}
      <AnimatePresence>
        {(showAddModal || showEditModal) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto"
            onClick={() => {
              setShowAddModal(false);
              setShowEditModal(false);
              setEditingNews(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-b from-gray-900 to-black rounded-xl border border-white/10 p-4 sm:p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4">
                {showAddModal ? 'Add New News Article' : 'Edit News Article'}
              </h3>

              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-xs text-white/60 mb-1">Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter article title"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white"
                  />
                </div>

                {/* Excerpt */}
                <div>
                  <label className="block text-xs text-white/60 mb-1">Excerpt</label>
                  <textarea
                    value={formData.excerpt}
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                    placeholder="Brief description of the article"
                    rows="2"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white resize-none"
                  />
                </div>

                {/* Rich Text Content Editor */}
                <div>
                  <label className="block text-xs text-white/60 mb-1">Content (Rich Text)</label>
                  
                  {/* Toolbar */}
                  <div className="flex flex-wrap items-center gap-1 p-2 bg-white/5 border border-white/10 rounded-t-lg border-b-0">
                    <div className="flex items-center gap-0.5 border-r border-white/10 pr-2 mr-2">
                      <ToolbarButton icon={Undo} onClick={handleUndo} label="Undo" />
                      <ToolbarButton icon={Redo} onClick={handleRedo} label="Redo" />
                    </div>
                    <div className="flex items-center gap-0.5 border-r border-white/10 pr-2 mr-2">
                      <ToolbarButton icon={Heading1} onClick={() => formatText('formatBlock', '<h1>')} label="Heading 1" />
                      <ToolbarButton icon={Heading2} onClick={() => formatText('formatBlock', '<h2>')} label="Heading 2" />
                    </div>
                    <div className="flex items-center gap-0.5 border-r border-white/10 pr-2 mr-2">
                      <ToolbarButton icon={Bold} onClick={() => formatText('bold')} label="Bold" />
                      <ToolbarButton icon={Italic} onClick={() => formatText('italic')} label="Italic" />
                      <ToolbarButton icon={Underline} onClick={() => formatText('underline')} label="Underline" />
                    </div>
                    <div className="flex items-center gap-0.5 border-r border-white/10 pr-2 mr-2">
                      <ToolbarButton icon={AlignLeft} onClick={() => formatText('justifyLeft')} label="Align Left" />
                      <ToolbarButton icon={AlignCenter} onClick={() => formatText('justifyCenter')} label="Align Center" />
                      <ToolbarButton icon={AlignRight} onClick={() => formatText('justifyRight')} label="Align Right" />
                    </div>
                    <div className="flex items-center gap-0.5 border-r border-white/10 pr-2 mr-2">
                      <ToolbarButton icon={List} onClick={() => formatText('insertUnorderedList')} label="Bullet List" />
                      <ToolbarButton icon={ListOrdered} onClick={() => formatText('insertOrderedList')} label="Numbered List" />
                    </div>
                    <div className="flex items-center gap-0.5 border-r border-white/10 pr-2 mr-2">
                      <ToolbarButton icon={Quote} onClick={() => formatText('formatBlock', '<blockquote>')} label="Quote" />
                      <ToolbarButton icon={Code} onClick={() => formatText('formatBlock', '<pre>')} label="Code Block" />
                    </div>
                    <div className="flex items-center gap-0.5">
                      <ToolbarButton icon={LinkIcon} onClick={insertLink} label="Insert Link" />
                      <ToolbarButton icon={ImageIcon2} onClick={insertImage} label="Insert Image" />
                    </div>
                  </div>

                  {/* Content Editor */}
                  <div
                    ref={contentRef}
                    contentEditable
                    onInput={handleContentChange}
                    className="min-h-[200px] p-3 bg-white/5 border border-white/10 rounded-b-lg text-white text-sm focus:outline-none focus:border-burnt-orange-500 transition-colors overflow-y-auto prose prose-invert max-w-none"
                    style={{
                      fontFamily: 'inherit',
                      lineHeight: '1.6'
                    }}
                  />
                  
                  <p className="text-[10px] text-white/40 mt-1">
                    Tip: Use the toolbar to format your content. You can also paste rich text.
                  </p>
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-xs text-white/60 mb-2">Featured Image</label>
                  
                  {formData.image_url ? (
                    <div className="relative w-full h-48 rounded-lg overflow-hidden border border-white/10 mb-3">
                      <Image
                        src={formData.image_url}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                      <div className="absolute top-2 right-2 flex gap-2">
                        <button
                          onClick={handleRemoveImage}
                          className="p-1.5 bg-red-500/20 rounded-lg hover:bg-red-500/30 transition-colors"
                          title="Remove image"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-white/10 rounded-lg p-6 mb-3 text-center">
                      <ImageIcon className="w-8 h-8 text-white/20 mx-auto mb-2" />
                      <p className="text-xs text-white/40 mb-2">No image selected</p>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {uploadingImage ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          {formData.image_url ? 'Change Image' : 'Upload Image'}
                        </>
                      )}
                    </button>
                    {formData.image_url && (
                      <button
                        type="button"
                        onClick={() => window.open(formData.image_url, '_blank')}
                        className="p-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
                        title="View full image"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-white/40 mt-1">
                    Supported formats: JPG, PNG, GIF. Max size: 5MB
                  </p>
                </div>

                {/* Category and Read Time */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-white/60 mb-1">Category *</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-white/60 mb-1">Read Time (minutes)</label>
                    <input
                      type="number"
                      value={formData.read_time}
                      onChange={(e) => setFormData({ ...formData, read_time: parseInt(e.target.value) || 3 })}
                      min="1"
                      max="60"
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white"
                    />
                  </div>
                </div>

                {/* Author */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-white/60 mb-1">Author</label>
                    <input
                      type="text"
                      value={formData.author}
                      onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                      placeholder="Author name"
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white/60 mb-1">Author Avatar URL</label>
                    <input
                      type="text"
                      value={formData.author_avatar}
                      onChange={(e) => setFormData({ ...formData, author_avatar: e.target.value })}
                      placeholder="https://example.com/avatar.jpg"
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white"
                    />
                  </div>
                </div>

                {/* Published Date */}
                <div>
                  <label className="block text-xs text-white/60 mb-1">Published Date</label>
                  <input
                    type="datetime-local"
                    value={formData.published_at}
                    onChange={(e) => setFormData({ ...formData, published_at: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white"
                  />
                </div>

                {/* Status Toggles */}
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_featured}
                      onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                      className="w-4 h-4 rounded border-white/20 bg-white/5"
                    />
                    <span className="text-sm text-white">Featured</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_trending}
                      onChange={(e) => setFormData({ ...formData, is_trending: e.target.checked })}
                      className="w-4 h-4 rounded border-white/20 bg-white/5"
                    />
                    <span className="text-sm text-white">Trending</span>
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 sm:gap-3 pt-3 sm:pt-4">
                  <button
                    onClick={showAddModal ? handleAddNews : handleEditNews}
                    disabled={updating || uploadingImage || !formData.title}
                    className="flex-1 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {updating || uploadingImage ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader className="w-4 h-4 animate-spin" />
                        {uploadingImage ? 'Uploading...' : (showAddModal ? 'Adding...' : 'Updating...')}
                      </span>
                    ) : (
                      showAddModal ? 'Add Article' : 'Update Article'
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setShowEditModal(false);
                      setEditingNews(null);
                      resetForm();
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

      {/* Updating Indicator */}
      <AnimatePresence>
        {updating && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 bg-green-500/90 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg shadow-lg flex items-center gap-1.5 sm:gap-2 z-50"
          >
            <Loader className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
            <span className="text-xs sm:text-sm">Processing...</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}