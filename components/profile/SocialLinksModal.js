// /components/profile/SocialLinksModal.js
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Send, Save, Loader, Check, AlertCircle, AlertTriangle, Shield 
} from 'lucide-react';

export default function SocialLinksModal({ profile, isOpen, onClose, onUpdate, supabase }) {
  const [formData, setFormData] = useState({
    telegram: profile?.telegram || ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [showWarning, setShowWarning] = useState(true);
  const [inputFocused, setInputFocused] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleWarningAcknowledge = () => {
    setShowWarning(false);
    // Focus the input field after acknowledging
    setTimeout(() => {
      const input = document.getElementById('telegram-input');
      if (input) {
        input.focus();
        setInputFocused(true);
      }
    }, 100);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.telegram.trim()) {
      setError('Telegram number is required');
      return;
    }

    // Basic validation for phone number format
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,}$/;
    if (!phoneRegex.test(formData.telegram.trim())) {
      setError('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const updateData = {
        telegram: formData.telegram.trim(),
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
      console.error('Error updating telegram:', error);
      setError('Failed to save. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Warning Modal */}
      <AnimatePresence>
        {isOpen && showWarning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => {}} // Don't close on backdrop click
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: -10 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="relative bg-gradient-to-br from-gray-900 to-black border border-yellow-400/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl shadow-yellow-400/10"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Decorative icon */}
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-yellow-400/20 rounded-full flex items-center justify-center border border-yellow-400/30">
                  <AlertTriangle className="w-8 h-8 text-yellow-400" />
                </div>
              </div>

              <h3 className="text-xl font-bold text-white text-center mb-2">
                ⚠️ Important Notice
              </h3>
              
              <p className="text-sm text-white/70 text-center leading-relaxed mb-4">
                Your Telegram number must be your <span className="text-yellow-400 font-semibold">active</span> Telegram account number.
              </p>

              <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-lg p-3 mb-4">
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-white/60 leading-relaxed">
                    <span className="text-yellow-400 font-medium">Note:</span> Failure to provide your active Telegram number may result in <span className="text-red-400 font-medium">disqualification</span> from the competition.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleWarningAcknowledge}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-green-500 hover:to-emerald-500 text-black font-semibold rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <Check className="w-4 h-4" />
                  I Understand
                </button>
              </div>

              {/* Decorative sparkles */}
              <div className="absolute -top-1 -right-1 opacity-10">
                <AlertTriangle className="w-6 h-6 text-yellow-400" />
              </div>
              <div className="absolute -bottom-1 -left-1 opacity-10">
                <AlertTriangle className="w-6 h-6 text-yellow-400" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Modal */}
      <AnimatePresence>
        {isOpen && !showWarning && (
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
                  <Send className="w-5 h-5 text-[#C58B2A]" />
                  Telegram Verification
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
                    Telegram number saved successfully!
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
                    Telegram Phone Number <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="telegram-input"
                    type="tel"
                    name="telegram"
                    value={formData.telegram}
                    onChange={handleChange}
                    onFocus={() => setInputFocused(true)}
                    onBlur={() => setInputFocused(false)}
                    placeholder="+234 800 000 0000"
                    className={`w-full px-4 py-3 bg-white/5 border rounded-lg text-sm text-white placeholder-white/30 focus:border-[#C58B2A] focus:outline-none transition-colors ${
                      inputFocused ? 'border-[#C58B2A] ring-1 ring-[#C58B2A]/50' : 'border-white/10'
                    }`}
                    required
                    disabled={loading || success}
                    autoFocus
                  />
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <AlertCircle className="w-3 h-3 text-yellow-400/70 flex-shrink-0" />
                    <p className="text-[10px] text-white/40">
                      Enter your active Telegram phone number
                    </p>
                  </div>
                  <div className="mt-1.5 bg-yellow-400/5 border border-yellow-400/10 rounded-lg p-2">
                    <div className="flex items-start gap-1.5">
                      <AlertTriangle className="w-3 h-3 text-yellow-400/70 flex-shrink-0 mt-0.5" />
                      <p className="text-[9px] text-white/40 leading-relaxed">
                        <span className="text-yellow-400/70">Important:</span> This number must be your active Telegram account. Failure to provide the correct number may result in disqualification.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || success || !formData.telegram.trim()}
                  className={`w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                    loading || success || !formData.telegram.trim()
                      ? 'bg-white/10 text-white/40 cursor-not-allowed'
                      : 'bg-gradient-to-r from-[#C58B2A] to-[#A96F1F] hover:from-green-500 hover:to-emerald-500 text-black'
                  }`}
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

                <div className="text-center text-[10px] text-white/20">
                  Your number is securely stored and only used for verification
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}