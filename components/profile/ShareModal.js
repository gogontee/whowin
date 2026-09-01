// /components/profile/ShareModal.js
'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Share2, 
  Download, 
  Link as LinkIcon, 
  Image as ImageIcon, 
  FileText, 
  Copy, 
  Check,
  Instagram,
  Twitter,
  Facebook,
  Send,
  MessageCircle,
  Loader,
  Users
} from 'lucide-react';
import Image from 'next/image';
import { createBrowserClient } from '@supabase/ssr';
import jsPDF from 'jspdf';

export default function ShareModal({ isOpen, onClose, profile }) {
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    if (!isOpen) {
      setCopied(false);
    }
  }, [isOpen]);

  // Load image helper
  const loadImage = (src, crossOrigin = true) => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      if (crossOrigin) {
        img.crossOrigin = 'anonymous';
      }
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  // Format username: capitalize first letter
  const formatUsername = (username) => {
    if (!username) return '';
    return username.charAt(0).toUpperCase() + username.slice(1);
  };

  // Handle share as Image
  const handleShareImage = async () => {
    if (!profile?.avatar_url) {
      alert('This profile does not have a profile picture.');
      return;
    }

    setGenerating(true);

    try {
      const background = await loadImage('/card.png', false);
      const avatar = await loadImage(profile.avatar_url, true);

      const canvas = document.createElement('canvas');
      canvas.width = background.naturalWidth;
      canvas.height = background.naturalHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Could not create canvas context');
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Draw background
      ctx.drawImage(
        background,
        0,
        0,
        background.naturalWidth,
        background.naturalHeight
      );

      const cardWidth = background.naturalWidth;
      const cardHeight = background.naturalHeight;

      // Avatar positioned at extreme left (22% from left)
      const avatarCenterX = cardWidth * 0.28;
      const avatarCenterY = cardHeight * 0.43;

      // Avatar diameter increased by 40% (from 0.42 to 0.588 of card width)
      const avatarDiameter = cardWidth * 0.588;
      const avatarRadius = avatarDiameter / 2;

      // Gold border width
      const borderWidth = cardWidth * 0.004;

      // Draw avatar circle
      ctx.save();
      ctx.beginPath();
      ctx.arc(avatarCenterX, avatarCenterY, avatarRadius, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      const avatarAspect = avatar.naturalWidth / avatar.naturalHeight;
      let drawWidth, drawHeight;
      if (avatarAspect > 1) {
        drawHeight = avatarDiameter;
        drawWidth = drawHeight * avatarAspect;
      } else {
        drawWidth = avatarDiameter;
        drawHeight = drawWidth / avatarAspect;
      }

      ctx.drawImage(
        avatar,
        avatarCenterX - drawWidth / 2,
        avatarCenterY - drawHeight / 2,
        drawWidth,
        drawHeight
      );
      ctx.restore();

      // Gold circle border
      ctx.save();
      ctx.beginPath();
      ctx.arc(avatarCenterX, avatarCenterY, avatarRadius, 0, Math.PI * 2);
      ctx.lineWidth = borderWidth;
      ctx.strokeStyle = '#D4AF37';
      ctx.stroke();
      ctx.restore();

      // Vote {Username} - positioned below avatar
      const username = formatUsername(profile?.username || 'user');
      const usernameText = `Vote ${username}`;
      const fontSize = cardWidth * 0.045;

      ctx.save();
      ctx.font = `700 ${fontSize}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Position below avatar - closer
      const voteY = avatarCenterY + avatarRadius + cardHeight * 0.05;

      // Pill dimensions - reduced
      const paddingX = cardWidth * 0.03;
      const paddingY = cardHeight * 0.012;
      const textWidth = ctx.measureText(usernameText).width;
      const pillWidth = textWidth + paddingX * 2;
      const pillHeight = fontSize + paddingY * 2;
      const pillX = avatarCenterX - pillWidth / 2;
      const pillY = voteY - pillHeight / 2;
      const radius = pillHeight / 2;

      // Black translucent background pill
      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillWidth, pillHeight, radius);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fill();

      // Thinner gold border
      ctx.lineWidth = cardWidth * 0.0015;
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)';
      ctx.stroke();

      // White text
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(usernameText, avatarCenterX, voteY);

      ctx.restore();

      // Download
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            throw new Error('Could not create image');
          }

          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `Vote_${username}.png`;
          document.body.appendChild(link);
          link.click();
          link.remove();
          URL.revokeObjectURL(url);
          setGenerating(false);
        },
        'image/png',
        1.0
      );

    } catch (error) {
      console.error('Error generating share image:', error);
      alert('Unable to generate the image. Please try again.');
      setGenerating(false);
    }
  };

  // Handle share as PDF
  const handleSharePDF = async () => {
    if (!profile?.avatar_url) {
      alert('This profile does not have a profile picture.');
      return;
    }

    setGenerating(true);

    try {
      const background = await loadImage('/card.png', false);
      const avatar = await loadImage(profile.avatar_url, true);

      const canvas = document.createElement('canvas');
      canvas.width = background.naturalWidth;
      canvas.height = background.naturalHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Could not create canvas context');
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      ctx.drawImage(
        background,
        0,
        0,
        background.naturalWidth,
        background.naturalHeight
      );

      const cardWidth = background.naturalWidth;
      const cardHeight = background.naturalHeight;

      // Avatar at extreme left
      const avatarCenterX = cardWidth * 0.28;
      const avatarCenterY = cardHeight * 0.43;
      const avatarDiameter = cardWidth * 0.588;
      const avatarRadius = avatarDiameter / 2;
      const borderWidth = cardWidth * 0.004;

      ctx.save();
      ctx.beginPath();
      ctx.arc(avatarCenterX, avatarCenterY, avatarRadius, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      const avatarAspect = avatar.naturalWidth / avatar.naturalHeight;
      let drawWidth, drawHeight;
      if (avatarAspect > 1) {
        drawHeight = avatarDiameter;
        drawWidth = drawHeight * avatarAspect;
      } else {
        drawWidth = avatarDiameter;
        drawHeight = drawWidth / avatarAspect;
      }

      ctx.drawImage(
        avatar,
        avatarCenterX - drawWidth / 2,
        avatarCenterY - drawHeight / 2,
        drawWidth,
        drawHeight
      );
      ctx.restore();

      ctx.save();
      ctx.beginPath();
      ctx.arc(avatarCenterX, avatarCenterY, avatarRadius, 0, Math.PI * 2);
      ctx.lineWidth = borderWidth;
      ctx.strokeStyle = '#D4AF37';
      ctx.stroke();
      ctx.restore();

      const username = formatUsername(profile?.username || 'user');
      const usernameText = `Vote ${username}`;
      const fontSize = cardWidth * 0.045;

      ctx.save();
      ctx.font = `700 ${fontSize}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const voteY = avatarCenterY + avatarRadius + cardHeight * 0.05;
      const paddingX = cardWidth * 0.03;
      const paddingY = cardHeight * 0.012;
      const textWidth = ctx.measureText(usernameText).width;
      const pillWidth = textWidth + paddingX * 2;
      const pillHeight = fontSize + paddingY * 2;
      const pillX = avatarCenterX - pillWidth / 2;
      const pillY = voteY - pillHeight / 2;
      const radius = pillHeight / 2;

      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillWidth, pillHeight, radius);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fill();
      ctx.lineWidth = cardWidth * 0.0015;
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)';
      ctx.stroke();
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(usernameText, avatarCenterX, voteY);
      ctx.restore();

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Vote_${username}.pdf`);

      setGenerating(false);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Unable to generate the PDF. Please try again.');
      setGenerating(false);
    }
  };

  // Copy link to clipboard
  const copyToClipboard = () => {
    const url = `${window.location.origin}/${profile.username}`;
    navigator.clipboard.writeText(`🌟 Vote for ${profile.full_name || profile.username}!\n\n${url}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Share to social media
  const shareToSocial = (platform) => {
    const url = `${window.location.origin}/${profile.username}`;
    const text = `🌟 Vote for ${profile.full_name || profile.username} on WhoWin!\n\n${url}`;

    const platforms = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`,
      instagram: `https://www.instagram.com/`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
    };

    if (platform === 'instagram') {
      copyToClipboard();
      alert('📸 Open Instagram and paste the link to share!');
    } else {
      window.open(platforms[platform], '_blank');
    }
  };

  const shareAsLink = () => {
    const url = `${window.location.origin}/${profile.username}`;
    const text = `🌟 Vote for ${profile.full_name || profile.username} on WhoWin!\n\n${url}`;

    if (navigator.share) {
      navigator.share({
        title: `Vote for ${profile.full_name || profile.username}`,
        text: text,
        url: url,
      }).catch(() => {
        copyToClipboard();
      });
    } else {
      copyToClipboard();
    }
  };

  const displayName = profile?.full_name || profile?.username || 'User';
  const username = formatUsername(profile?.username || 'user');

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-gradient-to-b from-gray-900 to-black rounded-2xl border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between sticky top-0 bg-black/50 backdrop-blur-sm z-10">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Share2 className="w-5 h-5 text-[#D4AF37]" />
                Share Profile
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Card Preview - EXACTLY MATCHES DOWNLOADED IMAGE */}
<div className="relative w-full max-w-[400px] mx-auto aspect-square">
  <div
    className="w-full h-full rounded-xl overflow-hidden relative"
    style={{
      backgroundImage: `url('/card.png')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      aspectRatio: '1/1',
    }}
  >
    {/* Profile Avatar - EXACT SAME POSITION AS DOWNLOAD */}
    <div
      className="absolute"
      style={{
        left: '28%',
        top: '43%',
        width: '58.8%',
        aspectRatio: '1 / 1',
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div
        className="w-full h-full rounded-full overflow-hidden border-4 border-[#D4AF37] shadow-2xl shadow-[#D4AF37]/30 relative"
      >
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={displayName}
            className="w-full h-full object-cover"
            crossOrigin="anonymous"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#D4AF37] to-yellow-500 flex items-center justify-center">
            <Users className="w-16 h-16 text-white" />
          </div>
        )}
      </div>

      {/* Vote Username - EXACT SAME POSITION LOGIC */}
      <div
        className="absolute left-1/2"
        style={{
          top: 'calc(100% + 5%)',
          transform: 'translateX(-50%)',
          whiteSpace: 'nowrap',
        }}
      >
        <div className="px-3 py-1.5 bg-black/50 backdrop-blur-sm rounded-full border border-[#D4AF37]/30">
          <span className="text-white font-bold text-base md:text-lg tracking-wide">
            Vote {username}
          </span>
        </div>
      </div>
    </div>
  </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleShareImage}
                    disabled={generating}
                    className="flex-1 py-2.5 bg-gradient-to-r from-[#D4AF37] to-yellow-500 text-black rounded-xl font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {generating ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Download Image
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleSharePDF}
                    disabled={generating}
                    className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl font-semibold transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {generating ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4" />
                        PDF
                      </>
                    )}
                  </button>
                </div>

                {/* Share Buttons Row */}
                <div className="flex justify-center gap-2">
                  <button
                    onClick={shareAsLink}
                    className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/10"
                    title="Copy Link"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <LinkIcon className="w-4 h-4 text-white/60" />
                    )}
                  </button>
                  <button
                    onClick={() => shareToSocial('twitter')}
                    className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/10"
                    title="Share on Twitter"
                  >
                    <Twitter className="w-4 h-4 text-white/60" />
                  </button>
                  <button
                    onClick={() => shareToSocial('facebook')}
                    className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/10"
                    title="Share on Facebook"
                  >
                    <Facebook className="w-4 h-4 text-white/60" />
                  </button>
                  <button
                    onClick={() => shareToSocial('whatsapp')}
                    className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/10"
                    title="Share on WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4 text-white/60" />
                  </button>
                  <button
                    onClick={() => shareToSocial('instagram')}
                    className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/10"
                    title="Share on Instagram"
                  >
                    <Instagram className="w-4 h-4 text-white/60" />
                  </button>
                </div>

                <p className="text-[10px] text-white/20 text-center">
                  Click Download Image or PDF to save the card
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}