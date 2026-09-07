// /components/profile/PostModal.js
'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { X, Camera, Image as ImageIcon, Upload, Loader, Trash2 } from 'lucide-react';

export default function PostModal({ onClose, onUpload }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const MAX_IMAGES = 2;

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    // Check if adding these files would exceed the limit
    if (selectedFiles.length + files.length > MAX_IMAGES) {
      setError(`You can only upload ${MAX_IMAGES} images. You already have ${selectedFiles.length} selected.`);
      return;
    }
    
    setError('');
    const newFiles = [...selectedFiles, ...files];
    setSelectedFiles(newFiles);
    
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviews([...previews, ...newPreviews]);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    if (selectedFiles.length + files.length > MAX_IMAGES) {
      setError(`You can only upload ${MAX_IMAGES} images. You already have ${selectedFiles.length} selected.`);
      return;
    }

    setError('');
    const newFiles = [...selectedFiles, ...files];
    setSelectedFiles(newFiles);

    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviews([...previews, ...newPreviews]);
  };

  const removeFile = (index) => {
    const newFiles = [...selectedFiles];
    const newPreviews = [...previews];
    URL.revokeObjectURL(newPreviews[index]);
    newFiles.splice(index, 1);
    newPreviews.splice(index, 1);
    setSelectedFiles(newFiles);
    setPreviews(newPreviews);
    setError('');
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one image');
      return;
    }

    if (selectedFiles.length > MAX_IMAGES) {
      setError(`You can only upload ${MAX_IMAGES} images`);
      return;
    }
    
    setUploading(true);
    setError('');
    try {
      // Pass files to parent - it will handle creating a single post with multiple images
      await onUpload(selectedFiles);
    } catch (error) {
      console.error('Error uploading:', error);
      setError('Failed to upload images. Please try again.');
    } finally {
      setUploading(false);
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
        className="w-full max-w-lg bg-gradient-to-b from-gray-900 to-black rounded-2xl border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="p-4 border-b border-white/10 flex items-center justify-between sticky top-0 bg-black/50 backdrop-blur-sm">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-[#D4AF37]" />
            Upload Photos ({selectedFiles.length}/{MAX_IMAGES})
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm flex items-center gap-2">
              <X className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {previews.length === 0 ? (
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                dragActive 
                  ? 'border-[#D4AF37] bg-[#D4AF37]/10' 
                  : 'border-white/20 hover:border-[#D4AF37]'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <Camera className="w-12 h-12 text-white/40 mx-auto mb-3" />
              <p className="text-white/60 text-sm">Drag & drop your photos here</p>
              <p className="text-white/40 text-xs mt-1">or click to browse</p>
              <p className="text-white/30 text-xs mt-2">
                Maximum {MAX_IMAGES} images
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 px-4 py-2 bg-[#D4AF37] text-black rounded-lg text-sm font-semibold hover:bg-yellow-500 transition-colors"
              >
                Select Photos
              </button>
            </div>
          ) : (
            <>
              {/* Image Previews */}
              <div className="grid grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto p-1">
                {previews.map((preview, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden group bg-white/5">
                    <Image
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                    <button
                      onClick={() => removeFile(index)}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    >
                      <Trash2 className="w-3 h-3 text-white" />
                    </button>
                    <div className="absolute bottom-2 left-2 bg-black/60 rounded-full px-2 py-0.5">
                      <span className="text-[10px] text-white/80">Image {index + 1}</span>
                    </div>
                  </div>
                ))}
                
                {/* Show placeholder for remaining slots */}
                {previews.length < MAX_IMAGES && (
                  <div 
                    className="aspect-square rounded-lg border-2 border-dashed border-white/20 hover:border-[#D4AF37] transition-colors flex items-center justify-center cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="text-center">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <Camera className="w-8 h-8 text-white/30 mx-auto mb-1" />
                      <span className="text-xs text-white/30">Add image</span>
                    </div>
                  </div>
                )}
              </div>

              {/* File count and add more */}
              <div className="flex items-center justify-between">
                <div className="text-xs text-white/40">
                  {selectedFiles.length} of {MAX_IMAGES} images selected
                </div>
                {selectedFiles.length < MAX_IMAGES && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs text-[#D4AF37] hover:text-yellow-400 transition-colors"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    + Add more
                  </button>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    previews.forEach(preview => URL.revokeObjectURL(preview));
                    setSelectedFiles([]);
                    setPreviews([]);
                    setError('');
                  }}
                  className="flex-1 px-4 py-2 bg-white/10 text-white rounded-lg text-sm font-semibold hover:bg-white/20 transition-colors"
                >
                  Clear All
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploading || selectedFiles.length === 0}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-[#D4AF37] to-yellow-500 text-black rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload {selectedFiles.length} Image{selectedFiles.length > 1 ? 's' : ''}
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}