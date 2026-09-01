// components/admin/AboutMetaManagement.js
'use client';

import { useState, useEffect } from 'react';
import { 
  Save, 
  Loader, 
  Check, 
  X, 
  Plus, 
  Trash2, 
  Edit,
  AlertCircle,
  Settings,
  Globe,
  Phone,
  MessageCircle,
  Target,
  Eye,
  FileText,
  Users,
  Calendar,
  Trophy,
  Info,
  AlertTriangle,
  Shield,
  File,
  Home,
  TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createBrowserClient } from '@supabase/ssr';

const ICON_OPTIONS = [
  { value: 'Users', label: 'Users' },
  { value: 'Calendar', label: 'Calendar' },
  { value: 'Home', label: 'Home' },
  { value: 'Trophy', label: 'Trophy' },
  { value: 'TrendingUp', label: 'TrendingUp' },
  { value: 'Globe', label: 'Globe' },
  { value: 'Eye', label: 'Eye' },
  { value: 'Target', label: 'Target' },
  { value: 'FileText', label: 'FileText' },
  { value: 'Settings', label: 'Settings' },
  { value: 'Phone', label: 'Phone' },
  { value: 'MessageCircle', label: 'MessageCircle' },
];

// Icon mapping for dynamic icons
const iconMap = {
  'Users': Users,
  'Calendar': Calendar,
  'Home': Home,
  'Trophy': Trophy,
  'TrendingUp': TrendingUp,
  'Globe': Globe,
  'Eye': Eye,
  'Target': Target,
  'FileText': FileText,
  'Settings': Settings,
  'Phone': Phone,
  'MessageCircle': MessageCircle,
};

export default function AboutMetaManagement() {
  const [aboutData, setAboutData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    short_description: '',
    full_description: '',
    vision: '',
    mission: '',
    goal: '',
    theme: '',
    telephone: '',
    whatsapp_line: '',
    stats: [],
    policy: '',
    quick_tips: '',
    warning: []
  });
  const [editingStatIndex, setEditingStatIndex] = useState(null);
  const [statForm, setStatForm] = useState({ label: '', value: '', icon: 'Users' });
  const [editingWarningIndex, setEditingWarningIndex] = useState(null);
  const [warningForm, setWarningForm] = useState({ title: '', content: '' });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    fetchAboutData();
  }, []);

  const fetchAboutData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('about_meta')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setAboutData(data);
        setFormData({
          short_description: data.short_description || '',
          full_description: data.full_description || '',
          vision: data.vision || '',
          mission: data.mission || '',
          goal: data.goal || '',
          theme: data.theme || '',
          telephone: data.telephone || '',
          whatsapp_line: data.whatsapp_line || '',
          stats: data.stats || [],
          policy: data.policy || '',
          quick_tips: data.quick_tips || '',
          warning: data.warning || []
        });
      }
    } catch (error) {
      console.error('Error fetching about data:', error);
      setError('Failed to load about data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setUpdating(true);
    setError(null);
    setSuccess(false);

    try {
      const updateData = {
        ...formData,
        stats: formData.stats || [],
        warning: formData.warning || [],
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('about_meta')
        .upsert({ id: 1, ...updateData })
        .eq('id', 1);

      if (error) throw error;

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      fetchAboutData();
    } catch (error) {
      console.error('Error saving about data:', error);
      setError('Failed to save changes');
    } finally {
      setUpdating(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Stats Management
  const handleAddStat = () => {
    if (!statForm.label || !statForm.value) {
      setError('Label and value are required for stats');
      return;
    }

    const newStat = {
      label: statForm.label,
      value: statForm.value,
      icon: statForm.icon || 'Users'
    };

    setFormData(prev => ({
      ...prev,
      stats: [...prev.stats, newStat]
    }));
    setStatForm({ label: '', value: '', icon: 'Users' });
    setEditingStatIndex(null);
    setError(null);
  };

  const handleEditStat = (index) => {
    const stat = formData.stats[index];
    setStatForm({
      label: stat.label,
      value: stat.value,
      icon: stat.icon || 'Users'
    });
    setEditingStatIndex(index);
  };

  const handleUpdateStat = () => {
    if (!statForm.label || !statForm.value) {
      setError('Label and value are required for stats');
      return;
    }

    const updatedStats = [...formData.stats];
    updatedStats[editingStatIndex] = {
      label: statForm.label,
      value: statForm.value,
      icon: statForm.icon || 'Users'
    };

    setFormData(prev => ({ ...prev, stats: updatedStats }));
    setStatForm({ label: '', value: '', icon: 'Users' });
    setEditingStatIndex(null);
    setError(null);
  };

  const handleDeleteStat = (index) => {
    const updatedStats = formData.stats.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, stats: updatedStats }));
    if (editingStatIndex === index) {
      setStatForm({ label: '', value: '', icon: 'Users' });
      setEditingStatIndex(null);
    }
  };

  const handleCancelStatEdit = () => {
    setStatForm({ label: '', value: '', icon: 'Users' });
    setEditingStatIndex(null);
    setError(null);
  };

  // Warning Management
  const handleAddWarning = () => {
    if (!warningForm.title || !warningForm.content) {
      setError('Title and content are required for warnings');
      return;
    }

    const newWarning = {
      title: warningForm.title,
      content: warningForm.content
    };

    setFormData(prev => ({
      ...prev,
      warning: [...prev.warning, newWarning]
    }));
    setWarningForm({ title: '', content: '' });
    setEditingWarningIndex(null);
    setError(null);
  };

  const handleEditWarning = (index) => {
    const warning = formData.warning[index];
    setWarningForm({
      title: warning.title,
      content: warning.content
    });
    setEditingWarningIndex(index);
  };

  const handleUpdateWarning = () => {
    if (!warningForm.title || !warningForm.content) {
      setError('Title and content are required for warnings');
      return;
    }

    const updatedWarnings = [...formData.warning];
    updatedWarnings[editingWarningIndex] = {
      title: warningForm.title,
      content: warningForm.content
    };

    setFormData(prev => ({ ...prev, warning: updatedWarnings }));
    setWarningForm({ title: '', content: '' });
    setEditingWarningIndex(null);
    setError(null);
  };

  const handleDeleteWarning = (index) => {
    const updatedWarnings = formData.warning.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, warning: updatedWarnings }));
    if (editingWarningIndex === index) {
      setWarningForm({ title: '', content: '' });
      setEditingWarningIndex(null);
    }
  };

  const handleCancelWarningEdit = () => {
    setWarningForm({ title: '', content: '' });
    setEditingWarningIndex(null);
    setError(null);
  };

  // Helper function to render icon dynamically
  const renderIcon = (iconName, className = "w-4 h-4 text-burnt-orange-400") => {
    const IconComponent = iconMap[iconName];
    if (!IconComponent) {
      // Fallback to Users icon if not found
      const FallbackIcon = Users;
      return <FallbackIcon className={className} />;
    }
    return <IconComponent className={className} />;
  };

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
          <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-burnt-orange-400" />
          About Page Management
        </h2>
        <p className="text-[10px] sm:text-xs text-white/40 mt-1">
          Manage content for the About page, Terms, Policy, and more
        </p>
      </div>

      {/* Success/Error Messages */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-green-500/20 border border-green-500/30 rounded-lg p-3 text-green-400 text-sm flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            Changes saved successfully!
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form */}
      <div className="bg-white/5 rounded-xl border border-white/10 p-4 sm:p-6 space-y-4">
        {/* Short Description */}
        <div>
          <label className="block text-xs text-white/60 mb-1">Short Description</label>
          <textarea
            name="short_description"
            value={formData.short_description}
            onChange={handleChange}
            rows="2"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white resize-none"
            placeholder="Brief description of the show..."
          />
        </div>

        {/* Full Description */}
        <div>
          <label className="block text-xs text-white/60 mb-1">Full Description</label>
          <textarea
            name="full_description"
            value={formData.full_description}
            onChange={handleChange}
            rows="4"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white resize-none"
            placeholder="Full description of the show..."
          />
        </div>

        {/* Vision, Mission, Goal */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-white/60 mb-1">Vision</label>
            <textarea
              name="vision"
              value={formData.vision}
              onChange={handleChange}
              rows="2"
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white resize-none"
              placeholder="Our vision..."
            />
          </div>
          <div>
            <label className="block text-xs text-white/60 mb-1">Mission</label>
            <textarea
              name="mission"
              value={formData.mission}
              onChange={handleChange}
              rows="2"
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white resize-none"
              placeholder="Our mission..."
            />
          </div>
          <div>
            <label className="block text-xs text-white/60 mb-1">Goal</label>
            <textarea
              name="goal"
              value={formData.goal}
              onChange={handleChange}
              rows="2"
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white resize-none"
              placeholder="Our goal..."
            />
          </div>
        </div>

        {/* Theme, Telephone, WhatsApp */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-white/60 mb-1">Theme</label>
            <input
              type="text"
              name="theme"
              value={formData.theme}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white"
              placeholder="e.g., Who Win 2026 - The Ultimate Showdown"
            />
          </div>
          <div>
            <label className="block text-xs text-white/60 mb-1 flex items-center gap-1">
              <Phone className="w-3 h-3" />
              Telephone
            </label>
            <input
              type="text"
              name="telephone"
              value={formData.telephone}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white"
              placeholder="+2348012345678"
            />
          </div>
          <div>
            <label className="block text-xs text-white/60 mb-1 flex items-center gap-1">
              <MessageCircle className="w-3 h-3" />
              WhatsApp Line
            </label>
            <input
              type="text"
              name="whatsapp_line"
              value={formData.whatsapp_line}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white"
              placeholder="+2348012345678"
            />
          </div>
        </div>

        {/* Quick Tips */}
        <div>
          <label className="block text-xs text-white/60 mb-1 flex items-center gap-1">
            <Info className="w-3 h-3 text-green-400" />
            Quick Tips (for homepage)
          </label>
          <textarea
            name="quick_tips"
            value={formData.quick_tips}
            onChange={handleChange}
            rows="3"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white resize-none"
            placeholder="Quick tips for users on the homepage..."
          />
        </div>

        {/* Policy */}
        <div>
          <label className="block text-xs text-white/60 mb-1 flex items-center gap-1">
            <File className="w-3 h-3 text-blue-400" />
            Policy
          </label>
          <textarea
            name="policy"
            value={formData.policy}
            onChange={handleChange}
            rows="4"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white resize-none font-mono"
            placeholder="Enter the full policy text..."
          />
        </div>

        {/* Stats Management */}
        <div className="border-t border-white/10 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2">
              <Users className="w-4 h-4 text-burnt-orange-400" />
              Stats
            </h3>
            <span className="text-xs text-white/40">{formData.stats?.length || 0} stats</span>
          </div>

          {/* Stats List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
            {formData.stats?.map((stat, index) => (
              <div
                key={index}
                className="bg-white/5 rounded-lg p-3 border border-white/10 flex items-center justify-between group"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-burnt-orange-500/20 flex items-center justify-center">
                    {renderIcon(stat.icon, "w-4 h-4 text-burnt-orange-400")}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{stat.value}</p>
                    <p className="text-white/40 text-xs">{stat.label}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEditStat(index)}
                    className="p-1 hover:bg-white/10 rounded"
                  >
                    <Edit className="w-3.5 h-3.5 text-blue-400" />
                  </button>
                  <button
                    onClick={() => handleDeleteStat(index)}
                    className="p-1 hover:bg-white/10 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add/Edit Stat Form */}
          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <div>
                <label className="block text-[10px] text-white/40 mb-0.5">Label</label>
                <input
                  type="text"
                  value={statForm.label}
                  onChange={(e) => setStatForm({ ...statForm, label: e.target.value })}
                  placeholder="e.g., Housemates"
                  className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] text-white/40 mb-0.5">Value</label>
                <input
                  type="text"
                  value={statForm.value}
                  onChange={(e) => setStatForm({ ...statForm, value: e.target.value })}
                  placeholder="e.g., 30"
                  className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-xs text-black"
                />
              </div>
              <div>
                <label className="block text-[10px] text-white/40 mb-0.5">Icon</label>
                <select
                  value={statForm.icon}
                  onChange={(e) => setStatForm({ ...statForm, icon: e.target.value })}
                  className="w-full px-2 py-1.5 bg-white/100 border border-green rounded text-xs text-black"
                >
                  {ICON_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end gap-1">
                {editingStatIndex !== null ? (
                  <>
                    <button
                      onClick={handleUpdateStat}
                      className="flex-1 py-1.5 bg-green-500/20 text-green-400 rounded text-xs font-medium hover:bg-green-500/30 transition-colors"
                    >
                      Update
                    </button>
                    <button
                      onClick={handleCancelStatEdit}
                      className="py-1.5 px-2 bg-red-500/20 text-red-400 rounded text-xs hover:bg-red-500/30 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleAddStat}
                    className="flex-1 py-1.5 bg-gradient-to-r from-burnt-orange-500 to-yellow-500 text-black rounded text-xs font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Add
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Warnings Management */}
        <div className="border-t border-white/10 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              Warnings
            </h3>
            <span className="text-xs text-white/40">{formData.warning?.length || 0} warnings</span>
          </div>

          {/* Warnings List */}
          <div className="space-y-2 mb-3">
            {formData.warning?.map((warning, index) => (
              <div
                key={index}
                className="bg-yellow-500/5 rounded-lg p-3 border border-yellow-500/20 flex items-center justify-between group"
              >
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">{warning.title}</p>
                  <p className="text-white/60 text-xs line-clamp-1">{warning.content}</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                  <button
                    onClick={() => handleEditWarning(index)}
                    className="p-1 hover:bg-white/10 rounded"
                  >
                    <Edit className="w-3.5 h-3.5 text-blue-400" />
                  </button>
                  <button
                    onClick={() => handleDeleteWarning(index)}
                    className="p-1 hover:bg-white/10 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add/Edit Warning Form */}
          <div className="bg-yellow-500/5 rounded-lg p-3 border border-yellow-500/20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] text-white/40 mb-0.5">Title</label>
                <input
                  type="text"
                  value={warningForm.title}
                  onChange={(e) => setWarningForm({ ...warningForm, title: e.target.value })}
                  placeholder="Warning title"
                  className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-xs text-black"
                />
              </div>
              <div className="md:col-span-1">
                <label className="block text-[10px] text-white/40 mb-0.5">Content</label>
                <input
                  type="text"
                  value={warningForm.content}
                  onChange={(e) => setWarningForm({ ...warningForm, content: e.target.value })}
                  placeholder="Warning content"
                  className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-xs text-white"
                />
              </div>
              <div className="flex items-end gap-1">
                {editingWarningIndex !== null ? (
                  <>
                    <button
                      onClick={handleUpdateWarning}
                      className="flex-1 py-1.5 bg-green-500/20 text-green-400 rounded text-xs font-medium hover:bg-green-500/30 transition-colors"
                    >
                      Update
                    </button>
                    <button
                      onClick={handleCancelWarningEdit}
                      className="py-1.5 px-2 bg-red-500/20 text-red-400 rounded text-xs hover:bg-red-500/30 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleAddWarning}
                    className="flex-1 py-1.5 bg-gradient-to-r from-yellow-500 to-amber-500 text-black rounded text-xs font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Add
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-4">
          <button
            onClick={handleSave}
            disabled={updating}
            className="w-full py-3 bg-gradient-to-r from-burnt-orange-500 to-yellow-500 text-black rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {updating ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}