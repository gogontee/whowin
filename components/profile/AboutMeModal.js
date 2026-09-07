'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, User, Save, Loader, Check, AlertCircle } from 'lucide-react';

export default function AboutMeModal({ profile, isOpen, onClose, onUpdate, supabase }) {
  const [bio, setBio] = useState(profile?.bio || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!bio.trim()) {
      setError('Please tell us about yourself');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          bio: bio.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onUpdate();
        onClose();
      }, 1500);

    } catch (error) {
      console.error('Error updating bio:', error);
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
            <User className="w-5 h-5 text-[#C58B2A]" />
            Tell Us About Yourself
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {success && (
            <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3 text-green-400 text-sm flex items-center gap-2">
              <Check className="w-4 h-4 flex-shrink-0" />
              Saved successfully!
            </div>
          )}

          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              About You
            </label>
            <textarea
              value={bio}
              onChange={(e) => {
                setBio(e.target.value);
                setError(null);
              }}
              placeholder="Share your story, background, what makes you unique..."
              rows="5"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:border-[#C58B2A] focus:outline-none transition-colors resize-none"
              maxLength={500}
              disabled={loading || success}
            />
            <p className="text-xs text-white/30 text-right mt-1">
              {bio.length}/500
            </p>
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