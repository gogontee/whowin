// /components/profile/Status.js
'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Shield, Camera, Image as ImageIcon, Settings, ExternalLink, Info } from 'lucide-react';
import Image from 'next/image';

export default function Status({ profile, isOpen, onClose }) {
  const [currentPassportIndex, setCurrentPassportIndex] = useState(0);
  const [showStatus, setShowStatus] = useState(false);
  const contentRef = useRef(null);

  const passportImages = ['/passport1.jpeg', '/passport2.jpeg'];

  // Rotate passport images
  useEffect(() => {
    if (!isOpen) return;
    
    const interval = setInterval(() => {
      setCurrentPassportIndex((prev) => (prev + 1) % passportImages.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [isOpen]);

  // Show status when modal opens and auto-scroll to top
  useEffect(() => {
    if (isOpen && profile) {
      setShowStatus(true);
      // Auto-scroll to top when modal opens
      setTimeout(() => {
        if (contentRef.current) {
          contentRef.current.scrollTop = 0;
        }
      }, 100);
    }
  }, [isOpen, profile]);

  if (!profile) return null;

  const status = profile.account_status || 'pending_verification';

  // Render different content based on status
  const renderStatusContent = () => {
    switch (status) {
      case 'active':
        return renderActiveContent();
      case 'pending_verification':
        return renderPendingContent();
      case 'suspended':
        return renderSuspendedContent();
      default:
        return renderPendingContent();
    }
  };

  const renderPendingContent = () => {
    return (
      <div className="space-y-4">
        {/* Status Badge */}
        <div className="flex items-center gap-3">
          <div className="relative w-14 h-14 md:w-16 md:h-16 flex-shrink-0">
            <Image
              src="/redpending.png"
              alt="Pending Verification"
              fill
              className="object-contain"
            />
          </div>
          <div>
            <h3 className="text-white font-bold text-base md:text-lg flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-yellow-500"></span>
              </span>
              Pending Verification
            </h3>
            <p className="text-white/50 text-xs">
              Your application is being reviewed
            </p>
          </div>
        </div>

        {/* Message */}
        <div className="bg-white/5 rounded-xl p-3 border border-white/10">
          <p className="text-white/70 text-xs md:text-sm leading-relaxed">
            Your application to contest on <span className="text-[#D4AF37] font-semibold">Who Wins Reality Show</span> will be reviewed by the Management. 
            If approved, you will be qualified into the next step of the show.
          </p>
        </div>

        {/* Tips to improve chances */}
        <div className="space-y-3">
          <h4 className="text-white font-semibold text-xs md:text-sm flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-[#D4AF37]" />
            To Stand a Higher Chance of Approval:
          </h4>

          {/* Tip 1: Profile Picture */}
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 bg-[#D4AF37]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Camera className="w-3.5 h-3.5 text-[#D4AF37]" />
              </div>
              <div className="flex-1">
                <p className="text-white font-medium text-xs md:text-sm">
                  Update Your Profile Picture
                </p>
                <p className="text-white/50 text-[10px] md:text-xs mt-0.5">
                  Change your profile picture to a better one with good quality. Make sure it shows your face clearly.
                </p>
                
                {/* Passport Examples Slider */}
                <div className="mt-2 flex items-center gap-2.5">
                  <div className="relative w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden border-2 border-[#D4AF37] flex-shrink-0">
                    <Image
                      src={passportImages[currentPassportIndex]}
                      alt="Passport example"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex gap-1.5">
                      {passportImages.map((_, index) => (
                        <div
                          key={index}
                          className={`h-1 rounded-full transition-all duration-300 ${
                            index === currentPassportIndex 
                              ? 'w-4 bg-[#D4AF37]' 
                              : 'w-2.5 bg-white/20'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-white/30 text-[8px] md:text-[10px] mt-0.5">
                      Example: Clear face photo
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tip 2: Gallery Photos */}
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 bg-[#D4AF37]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <ImageIcon className="w-3.5 h-3.5 text-[#D4AF37]" />
              </div>
              <div className="flex-1">
                <p className="text-white font-medium text-xs md:text-sm">
                  Add Photos to Your Gallery
                </p>
                <p className="text-white/50 text-[10px] md:text-xs mt-0.5">
                  Add at least 3 of your best photos to your page gallery. Make sure they are nice and presentable.
                </p>
                <div className="mt-2 flex gap-2">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center">
                    <span className="text-white/20 text-xs">📸</span>
                  </div>
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center">
                    <span className="text-white/20 text-xs">📸</span>
                  </div>
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center">
                    <span className="text-white/20 text-xs">📸</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tip 3: Settings */}
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 bg-[#D4AF37]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Settings className="w-3.5 h-3.5 text-[#D4AF37]" />
              </div>
              <div className="flex-1">
                <p className="text-white font-medium text-xs md:text-sm">
                  Complete Your Profile
                </p>
                <p className="text-white/50 text-[10px] md:text-xs mt-0.5">
                  Click on Settings to add more about yourself. Tell the world who you are!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Good Luck Message */}
        <div className="bg-gradient-to-r from-[#D4AF37]/10 to-yellow-500/10 rounded-xl p-3 border border-[#D4AF37]/20 text-center">
          <p className="text-[#D4AF37] font-semibold text-xs md:text-sm">
            🌟 Best of luck! We're rooting for you! 🌟
          </p>
        </div>
      </div>
    );
  };

  const renderActiveContent = () => {
    return (
      <div className="space-y-4">
        {/* Status Badge */}
        <div className="flex items-center gap-3">
          <div className="relative w-14 h-14 md:w-16 md:h-16 flex-shrink-0">
            <Image
              src="/approved.png"
              alt="Approved"
              fill
              className="object-contain"
            />
          </div>
          <div>
            <h3 className="text-white font-bold text-base md:text-lg flex items-center gap-2">
              <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-400" />
              Approved! 🎉
            </h3>
            <p className="text-white/50 text-xs">
              Congratulations! You've been approved
            </p>
          </div>
        </div>

        {/* Congratulation Message */}
        <div className="bg-green-500/10 rounded-xl p-3 border border-green-500/20">
          <p className="text-white/70 text-xs md:text-sm leading-relaxed">
            🎊 <span className="text-green-400 font-semibold">Congratulations!</span> You have successfully scaled through the review process!
          </p>
        </div>

        {/* Next Steps */}
        <div className="space-y-3">
          <h4 className="text-white font-semibold text-xs md:text-sm flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-[#D4AF37]" />
            Your Journey Begins Now:
          </h4>

          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <p className="text-white/70 text-xs md:text-sm leading-relaxed">
              The journey to becoming one of the housemates on <span className="text-[#D4AF37] font-semibold">Who Win</span> has just begun!
            </p>
            <div className="mt-2 p-2.5 bg-[#D4AF37]/10 rounded-lg border border-[#D4AF37]/20">
              <p className="text-[#D4AF37] font-medium text-xs md:text-sm flex items-center gap-2">
                <span className="text-base">💪</span>
                Brazen up and fight to emerge as one of the housemates!
              </p>
              <p className="text-white/50 text-[10px] md:text-xs mt-0.5">
                The ball is now in your court. Make it count!
              </p>
            </div>
          </div>

          {/* Motivational Message */}
          <div className="bg-gradient-to-r from-[#D4AF37]/10 to-yellow-500/10 rounded-xl p-3 border border-[#D4AF37]/20 text-center">
            <p className="text-[#D4AF37] font-semibold text-xs md:text-sm">
              🏆 This is your moment! Give it your all! 🏆
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderSuspendedContent = () => {
    return (
      <div className="space-y-4">
        {/* Status Badge */}
        <div className="flex items-center gap-3">
          <div className="relative w-14 h-14 md:w-16 md:h-16 flex-shrink-0">
            <div className="w-full h-full rounded-full bg-red-500/20 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 md:w-10 md:h-10 text-red-500" />
            </div>
          </div>
          <div>
            <h3 className="text-white font-bold text-base md:text-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-red-500" />
              Account Suspended
            </h3>
            <p className="text-white/50 text-xs">
              Your account has been temporarily suspended
            </p>
          </div>
        </div>

        {/* Message */}
        <div className="bg-red-500/10 rounded-xl p-3 border border-red-500/20">
          <p className="text-white/70 text-xs md:text-sm leading-relaxed">
            We regret to inform you that your account has been <span className="text-red-400 font-semibold">suspended</span>.
          </p>
        </div>

        {/* Resolution */}
        <div className="space-y-3">
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <h4 className="text-white font-semibold text-xs md:text-sm flex items-center gap-2 mb-1.5">
              <Info className="w-3.5 h-3.5 text-[#D4AF37]" />
              Need Help?
            </h4>
            <p className="text-white/50 text-xs md:text-sm leading-relaxed">
              If you believe this is a mistake or would like to resolve this issue, please reach out to our management team.
            </p>
            <div className="mt-2 p-2.5 bg-[#D4AF37]/10 rounded-lg border border-[#D4AF37]/20">
              <p className="text-[#D4AF37] font-medium text-xs md:text-sm flex items-center gap-2">
                <ExternalLink className="w-3.5 h-3.5" />
                Contact Management
              </p>
              <p className="text-white/30 text-[10px] md:text-xs mt-0.5">
                We're here to help resolve any issues
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

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
            className="w-full max-w-2xl bg-gradient-to-b from-gray-900 to-black rounded-2xl border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto"
            ref={contentRef}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 p-3 md:p-4 border-b border-white/10 bg-black/50 backdrop-blur-sm flex items-center justify-between">
              <h2 className="text-base md:text-lg font-semibold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 md:w-5 md:h-5 text-[#D4AF37]" />
                Account Status
              </h2>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </button>
            </div>

            {/* Content */}
            <div className="p-3 md:p-5">
              {renderStatusContent()}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 p-3 md:p-4 border-t border-white/10 bg-black/50 backdrop-blur-sm">
              <button
                onClick={onClose}
                className="w-full py-2 bg-gradient-to-r from-[#D4AF37] to-yellow-500 text-black rounded-xl font-semibold hover:opacity-90 transition-opacity text-xs md:text-sm"
              >
                Got it
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}