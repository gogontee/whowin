// /components/profile/SettingsModal.js
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Settings, 
  User, 
  Globe, 
  Camera, 
  Save, 
  Loader,
  Check,
  MapPin,
  Phone,
  Calendar,
  Instagram,
  Twitter,
  Facebook,
  Youtube,
  Music
} from 'lucide-react';

export default function SettingsModal({ profile, isOpen, onClose, onUpdate, supabase }) {
  const [formData, setFormData] = useState({
    full_name: profile.full_name || '',
    bio: profile.bio || '',
    location: profile.location || '',
    country: profile.country || '',
    state: profile.state || '',
    city: profile.city || '',
    date_of_birth: profile.date_of_birth || '',
    phone: profile.phone || '',
    instagram: profile.instagram || '',
    tiktok: profile.tiktok || '',
    twitter: profile.twitter || '',
    facebook: profile.facebook || '',
    youtube: profile.youtube || '',
    email_notifications: profile.email_notifications !== false,
    push_notifications: profile.push_notifications !== false
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(profile.avatar_url || null);

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingPhoto(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);

      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}/avatar-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(fileName, file, {
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      onUpdate();
    } catch (error) {
      console.error('Error uploading photo:', error);
      setError('Failed to upload photo. Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Build update object with only fields that exist
      const updateData = {
        full_name: formData.full_name,
        bio: formData.bio,
        location: formData.location,
        country: formData.country,
        state: formData.state,
        city: formData.city,
        phone: formData.phone,
        instagram: formData.instagram,
        tiktok: formData.tiktok,
        twitter: formData.twitter,
        facebook: formData.facebook,
        youtube: formData.youtube,
        email_notifications: formData.email_notifications,
        push_notifications: formData.push_notifications,
        updated_at: new Date().toISOString()
      };

      // Handle date_of_birth - convert empty string to null
      if (formData.date_of_birth && formData.date_of_birth.trim() !== '') {
        updateData.date_of_birth = formData.date_of_birth;
      } else {
        updateData.date_of_birth = null; // Send null instead of empty string
      }

      console.log('Updating profile with:', updateData);

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', profile.id);

      if (error) {
        console.error('Supabase update error:', error);
        throw new Error(`Failed to update: ${error.message}`);
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      onUpdate();
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.message || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-b from-gray-900 to-black rounded-2xl border border-white/10 shadow-2xl relative z-[1001]"
          >
            <div className="sticky top-0 bg-black/50 backdrop-blur-sm border-b border-white/10 p-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#D4AF37]" />
                Edit Profile
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
                  <Check className="w-4 h-4" />
                  Profile updated successfully!
                </div>
              )}

              {error && (
                <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm flex items-center gap-2">
                  <X className="w-4 h-4" />
                  {error}
                </div>
              )}

              {/* Profile Photo Upload Section */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-[#D4AF37]" />
                  Profile Photo
                </h3>
                
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-[#D4AF37] to-yellow-500 border-2 border-white/20">
                      {photoPreview ? (
                        <Image
                          src={photoPreview}
                          alt="Profile preview"
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-10 h-10 text-white" />
                        </div>
                      )}
                    </div>
                    {uploadingPhoto && (
                      <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                        <Loader className="w-6 h-6 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                      id="photo-upload"
                    />
                    <label
                      htmlFor="photo-upload"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg text-sm text-white hover:bg-white/20 transition-colors cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      Upload New Photo
                    </label>
                    <p className="text-xs text-white/40 mt-1">
                      Recommended: Square image, at least 400x400px
                    </p>
                  </div>
                </div>
              </div>

              {/* Basic Info */}
              <div className="space-y-3 pt-3 border-t border-white/10">
                <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2">
                  <User className="w-4 h-4 text-[#D4AF37]" />
                  Basic Information
                </h3>
                
                <div>
                  <label className="block text-xs text-white/40 mb-1">Full Name</label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:border-[#D4AF37] focus:outline-none transition-colors"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="block text-xs text-white/40 mb-1">Bio</label>
                  <textarea
                    name="bio"
                    value={formData.bio || ''}
                    onChange={handleChange}
                    rows="3"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:border-[#D4AF37] focus:outline-none transition-colors resize-none"
                    placeholder="Tell us about yourself..."
                  />
                  <p className="text-xs text-white/30 mt-1">
                    {formData.bio?.length || 0}/500 characters
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-white/40 mb-1">
                      <MapPin className="w-3 h-3 inline mr-1" />
                      Country
                    </label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country || ''}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:border-[#D4AF37] focus:outline-none transition-colors"
                      placeholder="Your country"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white/40 mb-1">
                      <MapPin className="w-3 h-3 inline mr-1" />
                      State/Region
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state || ''}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:border-[#D4AF37] focus:outline-none transition-colors"
                      placeholder="Your state/region"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-white/40 mb-1">
                    <MapPin className="w-3 h-3 inline mr-1" />
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:border-[#D4AF37] focus:outline-none transition-colors"
                    placeholder="Your city"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-white/40 mb-1">
                      <Calendar className="w-3 h-3 inline mr-1" />
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      name="date_of_birth"
                      value={formData.date_of_birth || ''}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:border-[#D4AF37] focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white/40 mb-1">
                      <Phone className="w-3 h-3 inline mr-1" />
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone || ''}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:border-[#D4AF37] focus:outline-none transition-colors"
                      placeholder="+1234567890"
                    />
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div className="space-y-3 pt-3 border-t border-white/10">
                <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#D4AF37]" />
                  Social Links
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-white/40 mb-1">
                      <Instagram className="w-3 h-3 inline mr-1 text-pink-500" />
                      Instagram
                    </label>
                    <input
                      type="text"
                      name="instagram"
                      value={formData.instagram || ''}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:border-[#D4AF37] focus:outline-none transition-colors"
                      placeholder="username"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white/40 mb-1">
                      <Music className="w-3 h-3 inline mr-1 text-black" />
                      TikTok
                    </label>
                    <input
                      type="text"
                      name="tiktok"
                      value={formData.tiktok || ''}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:border-[#D4AF37] focus:outline-none transition-colors"
                      placeholder="username"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white/40 mb-1">
                      <Facebook className="w-3 h-3 inline mr-1 text-blue-600" />
                      Facebook
                    </label>
                    <input
                      type="text"
                      name="facebook"
                      value={formData.facebook || ''}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:border-[#D4AF37] focus:outline-none transition-colors"
                      placeholder="username"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white/40 mb-1">
                      <Youtube className="w-3 h-3 inline mr-1 text-red-600" />
                      YouTube
                    </label>
                    <input
                      type="text"
                      name="youtube"
                      value={formData.youtube || ''}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:border-[#D4AF37] focus:outline-none transition-colors"
                      placeholder="channel"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-white/40 mb-1">
                      <Twitter className="w-3 h-3 inline mr-1 text-blue-400" />
                      Twitter/X
                    </label>
                    <input
                      type="text"
                      name="twitter"
                      value={formData.twitter || ''}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:border-[#D4AF37] focus:outline-none transition-colors"
                      placeholder="username"
                    />
                  </div>
                </div>
              </div>

              {/* Preferences */}
              <div className="space-y-3 pt-3 border-t border-white/10">
                <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2">
                  <Settings className="w-4 h-4 text-[#D4AF37]" />
                  Preferences
                </h3>

                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="email_notifications"
                      checked={formData.email_notifications}
                      onChange={handleChange}
                      className="w-4 h-4 rounded border-white/20 bg-white/5 text-[#D4AF37] focus:ring-[#D4AF37] focus:ring-offset-0"
                    />
                    <span className="text-sm text-white/80">Email Notifications</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="push_notifications"
                      checked={formData.push_notifications}
                      onChange={handleChange}
                      className="w-4 h-4 rounded border-white/20 bg-white/5 text-[#D4AF37] focus:ring-[#D4AF37] focus:ring-offset-0"
                    />
                    <span className="text-sm text-white/80">Push Notifications</span>
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-[#D4AF37] to-yellow-500 text-black rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}