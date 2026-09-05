// components/admin/AboutMetaManagement.js
'use client';

import { useState, useEffect, useRef } from 'react';
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
  const [editingSection, setEditingSection] = useState(null);
  const [hasDraft, setHasDraft] = useState(false);
  const draftHydrated = useRef(false);
  const DRAFT_KEY = 'whowin_about_meta_draft';

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
        const serverFormData = {
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
        };
        const savedDraft = localStorage.getItem(DRAFT_KEY);
        if (savedDraft) {
          try {
            setFormData({ ...serverFormData, ...JSON.parse(savedDraft) });
            setHasDraft(true);
          } catch (draftError) {
            console.error('Error restoring About metadata draft:', draftError);
            setFormData(serverFormData);
          }
        } else {
          setFormData(serverFormData);
        }
        draftHydrated.current = true;
      }
    } catch (error) {
      console.error('Error fetching about data:', error);
      setError('Failed to load about data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!draftHydrated.current || loading) return;
    localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
    setHasDraft(true);
  }, [formData, loading]);

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setHasDraft(false);
    fetchAboutData();
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
      localStorage.removeItem(DRAFT_KEY);
      setHasDraft(false);
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
          <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-[#C58B2A]" />
          About Page Management
        </h2>
        <p className="text-[10px] sm:text-xs text-white/40 mt-1">
          Edit the page content below, then save all changes once.
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

      {hasDraft && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#C58B2A]/25 bg-[#C58B2A]/10 px-3 py-2.5 text-xs text-[#F6D77A]">
          <span>Your unsaved edits are saved locally on this device.</span>
          <button type="button" onClick={clearDraft} className="rounded-md border border-[#C58B2A]/30 px-2 py-1 text-white/70 hover:bg-white/10 hover:text-white">
            Clear Draft
          </button>
        </div>
      )}

      {/* Form */}
      <div className="bg-white/5 rounded-xl border border-white/10 p-4 sm:p-6 space-y-6">
        {/* Short Description */}
        <section className="space-y-3">
          <div>
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-white">About Page Copy</h3>
              <button type="button" onClick={() => setEditingSection('copy')} className="inline-flex items-center gap-1.5 rounded-lg bg-[#C58B2A]/15 px-2.5 py-1.5 text-xs font-medium text-[#F6D77A] hover:bg-[#C58B2A]/25">
                <Edit className="h-3 w-3" /> Edit
              </button>
            </div>
            <p className="text-xs text-white/40 mt-1">Write the short and full descriptions visitors will read.</p>
          </div>
          <div>
          <label className="block text-sm font-medium text-white/70 mb-1">Short Description</label>
          <textarea
            name="short_description"
            value={formData.short_description}
            onChange={handleChange}
            rows="2"
            className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 resize-none focus:border-[#C58B2A] focus:outline-none"
            placeholder="Brief description of the show..."
          />
          </div>

        {/* Full Description */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-1">Full Description</label>
          <textarea
            name="full_description"
            value={formData.full_description}
            onChange={handleChange}
            rows="4"
            className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 resize-none focus:border-[#C58B2A] focus:outline-none"
            placeholder="Full description of the show..."
          />
          </div>
        </section>

        {/* Vision, Mission, Goal */}
        <section className="space-y-3 border-t border-white/10 pt-5">
          <div>
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-white">Vision, Mission & Goal</h3>
              <button type="button" onClick={() => setEditingSection('purpose')} className="inline-flex items-center gap-1.5 rounded-lg bg-[#C58B2A]/15 px-2.5 py-1.5 text-xs font-medium text-[#F6D77A] hover:bg-[#C58B2A]/25">
                <Edit className="h-3 w-3" /> Edit
              </button>
            </div>
            <p className="text-xs text-white/40 mt-1">Keep each statement focused and easy to understand.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">Vision</label>
            <textarea
              name="vision"
              value={formData.vision}
              onChange={handleChange}
              rows="2"
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 resize-none focus:border-[#C58B2A] focus:outline-none"
              placeholder="Our vision..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">Mission</label>
            <textarea
              name="mission"
              value={formData.mission}
              onChange={handleChange}
              rows="2"
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 resize-none focus:border-[#C58B2A] focus:outline-none"
              placeholder="Our mission..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">Goal</label>
            <textarea
              name="goal"
              value={formData.goal}
              onChange={handleChange}
              rows="2"
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 resize-none focus:border-[#C58B2A] focus:outline-none"
              placeholder="Our goal..."
            />
          </div>
          </div>
        </section>

        {/* Theme, Telephone, WhatsApp */}
        <section className="space-y-3 border-t border-white/10 pt-5">
          <div>
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-white">Contact & Show Details</h3>
              <button type="button" onClick={() => setEditingSection('contact')} className="inline-flex items-center gap-1.5 rounded-lg bg-[#C58B2A]/15 px-2.5 py-1.5 text-xs font-medium text-[#F6D77A] hover:bg-[#C58B2A]/25">
                <Edit className="h-3 w-3" /> Edit
              </button>
            </div>
            <p className="text-xs text-white/40 mt-1">Update the public theme and contact channels.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">Theme</label>
            <input
              type="text"
              name="theme"
              value={formData.theme}
              onChange={handleChange}
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:border-[#C58B2A] focus:outline-none"
              placeholder="e.g., Who Win 2026 - The Ultimate Showdown"
            />
          </div>
          <div>
            <label className="flex items-center gap-1 text-sm font-medium text-white/70 mb-1">
              <Phone className="w-3 h-3" />
              Telephone
            </label>
            <input
              type="text"
              name="telephone"
              value={formData.telephone}
              onChange={handleChange}
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:border-[#C58B2A] focus:outline-none"
              placeholder="+2348012345678"
            />
          </div>
          <div>
            <label className="flex items-center gap-1 text-sm font-medium text-white/70 mb-1">
              <MessageCircle className="w-3 h-3" />
              WhatsApp Line
            </label>
            <input
              type="text"
              name="whatsapp_line"
              value={formData.whatsapp_line}
              onChange={handleChange}
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:border-[#C58B2A] focus:outline-none"
              placeholder="+2348012345678"
            />
          </div>
          </div>
        </section>

        {/* Quick Tips */}
        <div className="border-t border-white/10 pt-5">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <h3 className="text-sm font-semibold text-white">Homepage Messaging</h3>
              <p className="text-xs text-white/40 mt-1">Control the quick tips shown on the homepage.</p>
            </div>
            <button type="button" onClick={() => setEditingSection('quickTips')} className="inline-flex items-center gap-1.5 rounded-lg bg-[#C58B2A]/15 px-2.5 py-1.5 text-xs font-medium text-[#F6D77A] hover:bg-[#C58B2A]/25">
              <Edit className="h-3 w-3" /> Edit
            </button>
          </div>
          <label className="flex items-center gap-1 text-sm font-medium text-white/70 mb-1">
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
        <div className="border-t border-white/10 pt-5">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <h3 className="text-sm font-semibold text-white">Policy</h3>
              <p className="text-xs text-white/40 mt-1">Edit the policy content used across the site.</p>
            </div>
            <button type="button" onClick={() => setEditingSection('policy')} className="inline-flex items-center gap-1.5 rounded-lg bg-[#C58B2A]/15 px-2.5 py-1.5 text-xs font-medium text-[#F6D77A] hover:bg-[#C58B2A]/25">
              <Edit className="h-3 w-3" /> Edit
            </button>
          </div>
          <label className="flex items-center gap-1 text-sm font-medium text-white/70 mb-1">
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
            <div>
              <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#C58B2A]" />
                Stats
              </h3>
              <span className="text-xs text-white/40">{formData.stats?.length || 0} stats</span>
            </div>
            <button type="button" onClick={() => setEditingSection('stats')} className="inline-flex items-center gap-1.5 rounded-lg bg-[#C58B2A]/15 px-2.5 py-1.5 text-xs font-medium text-[#F6D77A] hover:bg-[#C58B2A]/25">
              <Edit className="h-3 w-3" /> Edit
            </button>
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
            <div>
              <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#C58B2A]" />
                Warnings
              </h3>
              <span className="text-xs text-white/40">{formData.warning?.length || 0} warnings</span>
            </div>
            <button type="button" onClick={() => setEditingSection('warnings')} className="inline-flex items-center gap-1.5 rounded-lg bg-[#C58B2A]/15 px-2.5 py-1.5 text-xs font-medium text-[#F6D77A] hover:bg-[#C58B2A]/25">
              <Edit className="h-3 w-3" /> Edit
            </button>
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

      <AnimatePresence>
        {editingSection && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
            onClick={() => setEditingSection(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              onClick={(event) => event.stopPropagation()}
              className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[#C58B2A]/30 bg-gray-950 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    {editingSection === 'copy' && 'Edit About Page Copy'}
                    {editingSection === 'purpose' && 'Edit Vision, Mission & Goal'}
                    {editingSection === 'contact' && 'Edit Contact & Show Details'}
                    {editingSection === 'quickTips' && 'Edit Homepage Messaging'}
                    {editingSection === 'policy' && 'Edit Policy'}
                    {editingSection === 'stats' && 'Manage Stats'}
                    {editingSection === 'warnings' && 'Manage Warnings'}
                  </h2>
                  <p className="mt-1 text-xs text-white/40">Changes are saved locally until you click Save Changes.</p>
                </div>
                <button type="button" onClick={() => setEditingSection(null)} className="rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="overflow-y-auto p-5">
                {editingSection === 'copy' && (
                  <div className="space-y-5">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-white/80">Short Description</label>
                      <textarea name="short_description" value={formData.short_description} onChange={handleChange} rows="4" className="w-full resize-y rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-[#C58B2A] focus:outline-none" autoFocus placeholder="Brief description of the show..." />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-white/80">Full Description</label>
                      <textarea name="full_description" value={formData.full_description} onChange={handleChange} rows="10" className="w-full resize-y rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-relaxed text-white placeholder-white/30 focus:border-[#C58B2A] focus:outline-none" placeholder="Full description of the show..." />
                    </div>
                  </div>
                )}

                {editingSection === 'purpose' && (
                  <div className="grid gap-5 md:grid-cols-3">
                    {['vision', 'mission', 'goal'].map((field) => (
                      <div key={field}>
                        <label className="mb-2 block text-sm font-medium capitalize text-white/80">{field}</label>
                        <textarea name={field} value={formData[field]} onChange={handleChange} rows="10" className="w-full resize-y rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-[#C58B2A] focus:outline-none" autoFocus={field === 'vision'} placeholder={`Our ${field}...`} />
                      </div>
                    ))}
                  </div>
                )}

                {editingSection === 'contact' && (
                  <div className="grid gap-5 md:grid-cols-2">
                    {[
                      ['theme', 'Theme', 'e.g., Who Win 2026 - The Ultimate Showdown'],
                      ['telephone', 'Telephone', '+2348012345678'],
                      ['whatsapp_line', 'WhatsApp Line', '+2348012345678']
                    ].map(([field, label, placeholder]) => (
                      <div key={field} className={field === 'theme' ? 'md:col-span-2' : ''}>
                        <label className="mb-2 block text-sm font-medium text-white/80">{label}</label>
                        <input name={field} value={formData[field]} onChange={handleChange} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-[#C58B2A] focus:outline-none" placeholder={placeholder} autoFocus={field === 'theme'} />
                      </div>
                    ))}
                  </div>
                )}

                {editingSection === 'quickTips' && (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/80">Quick Tips for Homepage</label>
                    <textarea name="quick_tips" value={formData.quick_tips} onChange={handleChange} rows="12" className="w-full resize-y rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-relaxed text-white placeholder-white/30 focus:border-[#C58B2A] focus:outline-none" autoFocus placeholder="Example: STRATEGY || ALLIANCE || COMPETITIVENESS" />
                  </div>
                )}

                {editingSection === 'policy' && (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/80">Policy Content</label>
                    <textarea name="policy" value={formData.policy} onChange={handleChange} rows="18" className="w-full resize-y rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-mono text-sm leading-relaxed text-white placeholder-white/30 focus:border-[#C58B2A] focus:outline-none" autoFocus placeholder="Enter the full policy text..." />
                  </div>
                )}

                {editingSection === 'stats' && (
                  <div className="space-y-4">
                    <div className="grid gap-2 sm:grid-cols-2">
                      {formData.stats?.map((stat, index) => (
                        <div key={index} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#C58B2A]/15">{renderIcon(stat.icon, 'h-4 w-4 text-[#C58B2A]')}</div>
                            <div><p className="font-semibold text-white">{stat.value}</p><p className="text-xs text-white/50">{stat.label}</p></div>
                          </div>
                          <div className="flex gap-1">
                            <button type="button" onClick={() => handleEditStat(index)} className="rounded-lg p-2 hover:bg-white/10"><Edit className="h-4 w-4 text-blue-400" /></button>
                            <button type="button" onClick={() => handleDeleteStat(index)} className="rounded-lg p-2 hover:bg-white/10"><Trash2 className="h-4 w-4 text-red-400" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="grid gap-3 rounded-xl border border-[#C58B2A]/20 bg-[#C58B2A]/5 p-4 sm:grid-cols-3">
                      <input value={statForm.label} onChange={(e) => setStatForm({ ...statForm, label: e.target.value })} placeholder="Label" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-[#C58B2A] focus:outline-none" />
                      <input value={statForm.value} onChange={(e) => setStatForm({ ...statForm, value: e.target.value })} placeholder="Value" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-[#C58B2A] focus:outline-none" />
                      <select value={statForm.icon} onChange={(e) => setStatForm({ ...statForm, icon: e.target.value })} className="rounded-lg border border-white/10 bg-gray-900 px-3 py-2 text-sm text-white focus:border-[#C58B2A] focus:outline-none">
                        {ICON_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                      <div className="flex gap-2 sm:col-span-3">
                        <button type="button" onClick={editingStatIndex !== null ? handleUpdateStat : handleAddStat} className="rounded-lg bg-[#C58B2A] px-4 py-2 text-sm font-semibold text-black hover:bg-[#A96F1F]">{editingStatIndex !== null ? 'Update Stat' : 'Add Stat'}</button>
                        {editingStatIndex !== null && <button type="button" onClick={handleCancelStatEdit} className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20">Cancel</button>}
                      </div>
                    </div>
                  </div>
                )}

                {editingSection === 'warnings' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      {formData.warning?.map((warning, index) => (
                        <div key={index} className="flex items-start justify-between gap-3 rounded-xl border border-[#C58B2A]/20 bg-[#C58B2A]/5 p-4">
                          <div><p className="font-semibold text-white">{warning.title}</p><p className="mt-1 text-sm text-white/60">{warning.content}</p></div>
                          <div className="flex gap-1"><button type="button" onClick={() => handleEditWarning(index)} className="rounded-lg p-2 hover:bg-white/10"><Edit className="h-4 w-4 text-blue-400" /></button><button type="button" onClick={() => handleDeleteWarning(index)} className="rounded-lg p-2 hover:bg-white/10"><Trash2 className="h-4 w-4 text-red-400" /></button></div>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-3 rounded-xl border border-[#C58B2A]/20 bg-[#C58B2A]/5 p-4">
                      <input value={warningForm.title} onChange={(e) => setWarningForm({ ...warningForm, title: e.target.value })} placeholder="Warning title" className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-[#C58B2A] focus:outline-none" />
                      <textarea value={warningForm.content} onChange={(e) => setWarningForm({ ...warningForm, content: e.target.value })} rows="4" placeholder="Warning content" className="w-full resize-y rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-[#C58B2A] focus:outline-none" />
                      <div className="flex gap-2"><button type="button" onClick={editingWarningIndex !== null ? handleUpdateWarning : handleAddWarning} className="rounded-lg bg-[#C58B2A] px-4 py-2 text-sm font-semibold text-black hover:bg-[#A96F1F]">{editingWarningIndex !== null ? 'Update Warning' : 'Add Warning'}</button>{editingWarningIndex !== null && <button type="button" onClick={handleCancelWarningEdit} className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20">Cancel</button>}</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-white/10 px-5 py-4">
                <button type="button" onClick={() => setEditingSection(null)} className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20">Done</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}