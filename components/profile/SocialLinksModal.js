'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  X, Send, Instagram, Twitter, Youtube, Facebook, 
  Music, Save, Loader, Check, AlertCircle, Link2 
} from 'lucide-react';

export default function SocialLinksModal({ profile, isOpen, onClose, onUpdate, supabase }) {
  const [formData, setFormData] = useState({
    telegram: profile?.telegram || '',
    instagram: profile?.instagram || '',
    facebook: profile?.facebook || '',
    tiktok: profile?.tiktok || '',
    twitter: profile?.twitter || ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.telegram.trim()) {
      setError('Telegram link is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const updateData = {
        telegram: formData.telegram.trim(),
        instagram: formData.instagram.trim() || null,
        facebook: formData.facebook.trim() || null,
        tiktok: formData.tiktok.trim() || null,
        twitter: formData.twitter.trim() || null,
        updated_at: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', profile.id);

      if (updateError) throw updateError;

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onUpdate();
        onClose();
      }, 1500);

    } catch (error) {
      console.error('Error updating social links:', error);
      setError('Failed to save. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-gradient-to-b from-gray-900 to-black rounded-2xl border border-white/10 shadow-2xl"
      >
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Link2 className="w-5 h-5 text-[#C58B2A]" />
            Social Media Links
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {success && (
            <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3 text-green-400 text-sm flex items-center gap-2">
              <Check className="w-4 h-4 flex-shrink-0" />
              Social links saved successfully!
            </div>
          )}

          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="flex text-sm font-medium text-white/80 mb-1.5 items-center gap-1">
              <Send className="w-4 h-4 text-[#C58B2A]" />
              Telegram <span className="text-red-400">*</span>
            </label>
            <input
              type="url"
              name="telegram"
              value={formData.telegram}
              onChange={handleChange}
              placeholder="https://t.me/yourusername"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:border-[#C58B2A] focus:outline-none transition-colors"
              required
              disabled={loading || success}
            />
            <p className="text-[10px] text-white/30 mt-1">Telegram is required for verification</p>
          </div>

          <div>
            <label className="flex text-sm font-medium text-white/80 mb-1.5 items-center gap-1">
              <Instagram className="w-4 h-4 text-pink-500" />
              Instagram
            </label>
            <input
              type="url"
              name="instagram"
              value={formData.instagram}
              onChange={handleChange}
              placeholder="https://instagram.com/username"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:border-[#C58B2A] focus:outline-none transition-colors"
              disabled={loading || success}
            />
          </div>

          <div>
            <label className="flex text-sm font-medium text-white/80 mb-1.5 items-center gap-1">
              <Facebook className="w-4 h-4 text-blue-600" />
              Facebook
            </label>
            <input
              type="url"
              name="facebook"
              value={formData.facebook}
              onChange={handleChange}
              placeholder="https://facebook.com/username"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:border-[#C58B2A] focus:outline-none transition-colors"
              disabled={loading || success}
            />
          </div>

          <div>
            <label className="flex text-sm font-medium text-white/80 mb-1.5 items-center gap-1">
              <Music className="w-4 h-4 text-black" />
              TikTok
            </label>
            <input
              type="url"
              name="tiktok"
              value={formData.tiktok}
              onChange={handleChange}
              placeholder="https://tiktok.com/@username"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:border-[#C58B2A] focus:outline-none transition-colors"
              disabled={loading || success}
            />
          </div>

          <div>
            <label className="flex text-sm font-medium text-white/80 mb-1.5 items-center gap-1">
              <Twitter className="w-4 h-4 text-blue-400" />
              Twitter/X
            </label>
            <input
              type="url"
              name="twitter"
              value={formData.twitter}
              onChange={handleChange}
              placeholder="https://twitter.com/username"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:border-[#C58B2A] focus:outline-none transition-colors"
              disabled={loading || success}
            />
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full py-3 bg-gradient-to-r from-[#C58B2A] to-[#A96F1F] hover:from-green-500 hover:to-emerald-500 text-black font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : success ? (
              <>
                <Check className="w-4 h-4" />
                Saved!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save & Continue
              </>
            )}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}