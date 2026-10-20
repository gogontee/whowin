// /components/profile/BankDetails.js
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Building2, 
  CreditCard, 
  User, 
  Check, 
  Loader, 
  AlertCircle,
  ShieldCheck,
  Wallet,
  Save,
  Eye
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function BankDetails({ 
  profile, 
  isOpen, 
  onClose, 
  onUpdate 
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    account_name: '',
    account_number: '',
    bank_name: ''
  });

  const [originalData, setOriginalData] = useState({
    account_name: '',
    account_number: '',
    bank_name: ''
  });

  // Fetch existing bank details when modal opens
  useEffect(() => {
    if (isOpen && profile?.id) {
      fetchBankDetails();
    }
  }, [isOpen, profile?.id]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setError('');
      setSuccess(false);
    }
  }, [isOpen]);

  const fetchBankDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('account_name, account_number, bank_name')
        .eq('id', profile.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      const details = {
        account_name: data?.account_name || '',
        account_number: data?.account_number || '',
        bank_name: data?.bank_name || ''
      };

      setFormData(details);
      setOriginalData(details);
    } catch (err) {
      console.error('Error fetching bank details:', err);
      setError('Failed to load bank details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
    setSuccess(false);
  };

  const validateForm = () => {
    if (!formData.account_name.trim()) {
      setError('Account name is required');
      return false;
    }
    if (!formData.bank_name.trim()) {
      setError('Bank name is required');
      return false;
    }
    if (!formData.account_number.trim()) {
      setError('Account number is required');
      return false;
    }
    if (!/^\d{10}$/.test(formData.account_number.trim())) {
      setError('Account number must be exactly 10 digits');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    if (!profile?.id) return;

    setSaving(true);
    setError('');

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          account_name: formData.account_name.trim(),
          account_number: formData.account_number.trim(),
          bank_name: formData.bank_name.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      setOriginalData({ ...formData });
      setSuccess(true);

      if (onUpdate) {
        onUpdate();
      }

      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error saving bank details:', err);
      setError('Failed to save bank details. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const hasChanges =
    formData.account_name !== originalData.account_name ||
    formData.account_number !== originalData.account_number ||
    formData.bank_name !== originalData.bank_name;

  const isComplete =
    formData.account_name && formData.account_number && formData.bank_name;

  // Is this an existing record? (drives the header text)
  const isExistingRecord =
    originalData.account_name &&
    originalData.account_number &&
    originalData.bank_name;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gradient-to-b from-gray-900 to-black rounded-2xl border border-[#C58B2A]/30 w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10 bg-gradient-to-r from-[#C58B2A]/10 to-yellow-500/10 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#C58B2A]/20 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-[#C58B2A]" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">
                    {isExistingRecord ? 'Your Bank Details' : 'Add Bank Details'}
                  </h2>
                  <p className="text-xs text-white/40">
                    For receiving your gifting earnings
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
                title="Close"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader className="w-6 h-6 text-[#C58B2A] animate-spin" />
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                  {/* Warning Notice */}
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5">
                    <div className="flex items-start gap-2.5">
                      <ShieldCheck className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-amber-400">
                          Important Notice
                        </p>
                        <p className="text-[11px] text-white/70 leading-relaxed">
                          The bank details you provide will be used to disburse all your
                          earnings from gifts on this platform. Please make sure the
                          information you enter is <span className="font-semibold text-white">100% accurate</span> and
                          matches your bank account exactly. Incorrect details may
                          result in failed or delayed payouts.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Account Name */}
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-medium text-white/60 mb-1.5">
                      <User className="w-3.5 h-3.5" />
                      Account Name
                    </label>
                    <input
                      type="text"
                      value={formData.account_name}
                      onChange={(e) => handleChange('account_name', e.target.value)}
                      placeholder="e.g. John Doe"
                      disabled={saving || success}
                      className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:border-[#C58B2A] focus:outline-none transition-colors disabled:opacity-50"
                    />
                    <p className="text-[10px] text-white/30 mt-1">
                      As it appears on your bank account
                    </p>
                  </div>

                  {/* Bank Name */}
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-medium text-white/60 mb-1.5">
                      <Building2 className="w-3.5 h-3.5" />
                      Bank Name
                    </label>
                    <input
                      type="text"
                      value={formData.bank_name}
                      onChange={(e) => handleChange('bank_name', e.target.value)}
                      placeholder="e.g. Access Bank, GTBank, Zenith Bank"
                      disabled={saving || success}
                      className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:border-[#C58B2A] focus:outline-none transition-colors disabled:opacity-50"
                    />
                  </div>

                  {/* Account Number */}
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-medium text-white/60 mb-1.5">
                      <CreditCard className="w-3.5 h-3.5" />
                      Account Number
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formData.account_number}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                        handleChange('account_number', val);
                      }}
                      placeholder="10-digit account number"
                      maxLength={10}
                      disabled={saving || success}
                      className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:border-[#C58B2A] focus:outline-none transition-colors disabled:opacity-50 font-mono tracking-wider"
                    />
                    <p className="text-[10px] text-white/30 mt-1">
                      {formData.account_number.length}/10 digits
                    </p>
                  </div>

                  {/* Error Message */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="flex items-start gap-2 p-2.5 bg-red-500/10 border border-red-500/30 rounded-lg">
                          <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-red-300">{error}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Success Message */}
                  <AnimatePresence>
                    {success && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="flex items-center gap-2 p-2.5 bg-green-500/10 border border-green-500/30 rounded-lg">
                          <Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                          <p className="text-xs text-green-300">
                            Bank details saved successfully!
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </form>
              )}
            </div>

            {/* Footer */}
            {!loading && (
              <div className="p-4 border-t border-white/10 bg-black/40 flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={saving || success || !hasChanges || !isComplete}
                  className="flex-1 py-2.5 bg-gradient-to-r from-[#C58B2A] to-[#A96F1F] text-black rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : success ? (
                    <>
                      <Check className="w-4 h-4" />
                      Saved
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {isExistingRecord ? 'Update Details' : 'Save Details'}
                    </>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}