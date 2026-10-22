// /app/auth/reset-password/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../../lib/supabase';
import { 
  Eye, 
  EyeOff, 
  Check, 
  X, 
  Lock, 
  Shield, 
  Sparkles, 
  ArrowLeft,
  KeyRound
} from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // Supabase injects the recovery session into the URL hash when the user
  // clicks the email link. The client SDK picks it up automatically.
  useEffect(() => {
    let mounted = true;

    // 1. Check if there is already a session (covers the hash-parse race)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (session) setSessionReady(true);
      setCheckingSession(false);
    });

    // 2. Listen for the PASSWORD_RECOVERY event as a fallback
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        setSessionReady(true);
        setCheckingSession(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const validate = () => {
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validate()) return;

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      setSuccess(true);

      // Give the user a moment to read the success message, then go to login
      setTimeout(() => {
        supabase.auth.signOut().then(() => {
          router.push('/auth/login');
        });
      }, 2000);
    } catch (err) {
      console.error('Reset password error:', err);
      setError(
        err?.message?.includes('session') 
          ? 'Your reset link has expired or is invalid. Please request a new one.'
          : (err?.message || 'Could not update your password. Please try again.')
      );
    } finally {
      setLoading(false);
    }
  };

  const floatingSparks = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: (i * 17) % 90 + 5,
    y: (i * 23) % 90 + 5,
    size: (i % 3) * 5 + 6,
    duration: (i % 5) * 2 + 8,
    delay: (i % 4) * 0.3,
  }));

  return (
    <section className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100 flex items-center justify-center px-3 py-4 md:px-4 md:py-6 relative overflow-hidden">
      {floatingSparks.map((spark) => (
        <motion.div
          key={spark.id}
          className="absolute pointer-events-none hidden md:block"
          initial={{ x: `${spark.x}vw`, y: `${spark.y}vh`, scale: 0, opacity: 0.3 }}
          animate={{
            y: [`${spark.y}vh`, `${spark.y - 20}vh`, `${spark.y}vh`],
            x: [`${spark.x}vw`, `${spark.x + 10}vw`, `${spark.x}vw`],
            rotate: [0, 180, 360],
            scale: [0, 0.9, 0],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{ duration: spark.duration, delay: spark.delay, repeat: Infinity, ease: 'linear' }}
        >
          <Sparkles size={spark.size} className="text-amber-400/30 flex-shrink-0" />
        </motion.div>
      ))}

      <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
          className="relative backdrop-blur-xl bg-white/95 rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden border border-amber-200/50 w-full"
        >
          {/* Header */}
          <div className="bg-black w-full h-20 md:h-24 flex items-center justify-center">
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="relative flex-shrink-0"
            >
              <div className="relative w-48 h-16 md:w-56 md:h-20">
                <Image
                  src="/logo.png"
                  alt="WhoWin Logo"
                  fill
                  sizes="(max-width: 768px) 192px, 224px"
                  className="object-contain"
                  priority
                />
              </div>
            </motion.div>
          </div>

          <div className="h-1 bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 w-full"></div>

          <div className="p-6 md:p-8 space-y-5 md:space-y-6 w-full">
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="text-center w-full"
            >
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
                Set New Password
              </h2>
              <p className="text-sm md:text-base text-gray-500 mt-1">
                Choose a strong password to secure your account
              </p>
            </motion.div>

            {/* Verifying session */}
            {checkingSession && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center w-full">
                <p className="text-xs md:text-sm text-amber-700 flex items-center justify-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-3.5 h-3.5 border-2 border-amber-500 border-t-transparent rounded-full flex-shrink-0"
                  />
                  Verifying your reset link...
                </p>
              </div>
            )}

            {/* Invalid / expired link */}
            {!checkingSession && !sessionReady && !success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 text-center w-full"
              >
                <p className="text-xs md:text-sm flex items-center justify-center gap-1">
                  <X className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                  This reset link has expired or is invalid.
                </p>
                <Link
                  href="/auth/forgot-password"
                  className="text-[10px] md:text-xs text-amber-600 hover:text-green-600 font-semibold mt-1 inline-block"
                >
                  Request a new link
                </Link>
              </motion.div>
            )}

            {/* Success */}
            <AnimatePresence>
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-center w-full"
                >
                  <p className="text-xs md:text-sm flex items-center justify-center gap-1">
                    <Check className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                    Password updated successfully!
                  </p>
                  <p className="text-[10px] md:text-xs text-green-600 mt-1">
                    Redirecting you to login...
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 text-center w-full"
                >
                  <p className="text-xs md:text-sm flex items-center justify-center gap-1">
                    <X className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                    {error}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            {!success && sessionReady && (
              <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5 w-full">
                {/* New password */}
                <motion.div
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="w-full"
                >
                  <label htmlFor="password" className="flex items-center gap-1 text-xs md:text-sm font-medium text-gray-600 mb-1 ml-1">
                    <Lock className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                    <span>New Password</span>
                  </label>
                  <div className="relative w-full">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      placeholder="Enter new password"
                      className="w-full px-3 py-2 md:px-4 md:py-3 bg-white border border-gray-300 rounded-lg md:rounded-xl text-sm md:text-base text-gray-800 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all outline-none placeholder:text-gray-400 hover:border-amber-400 pr-10"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (error) setError('');
                      }}
                      disabled={loading}
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-amber-600 transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                      disabled={loading}
                    >
                      {showPassword ? <EyeOff size={18} className="flex-shrink-0" /> : <Eye size={18} className="flex-shrink-0" />}
                    </button>
                  </div>
                </motion.div>

                {/* Confirm password */}
                <motion.div
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 }}
                  className="w-full"
                >
                  <label htmlFor="confirmPassword" className="flex items-center gap-1 text-xs md:text-sm font-medium text-gray-600 mb-1 ml-1">
                    <Lock className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                    <span>Confirm New Password</span>
                  </label>
                  <div className="relative w-full">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      name="confirmPassword"
                      placeholder="Re-enter new password"
                      className="w-full px-3 py-2 md:px-4 md:py-3 bg-white border border-gray-300 rounded-lg md:rounded-xl text-sm md:text-base text-gray-800 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all outline-none placeholder:text-gray-400 hover:border-amber-400 pr-10"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (error) setError('');
                      }}
                      disabled={loading}
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-amber-600 transition-colors"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      tabIndex={-1}
                      disabled={loading}
                    >
                      {showConfirmPassword ? <EyeOff size={18} className="flex-shrink-0" /> : <Eye size={18} className="flex-shrink-0" />}
                    </button>
                  </div>
                </motion.div>

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  className={`w-full py-3 md:py-4 rounded-lg md:rounded-xl font-semibold text-white shadow-lg transition-all relative overflow-hidden ${
                    loading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 hover:from-green-500 hover:via-emerald-500 hover:to-green-500'
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full flex-shrink-0"
                      />
                      <span className="text-sm md:text-base">Updating...</span>
                    </div>
                  ) : (
                    <span className="text-sm md:text-base flex items-center justify-center gap-2">
                      <KeyRound className="w-4 h-4 flex-shrink-0" />
                      Update Password
                    </span>
                  )}
                </motion.button>
              </form>
            )}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
              className="text-center w-full"
            >
              <Link
                href="/auth/login"
                className="text-xs md:text-sm text-amber-600 font-semibold hover:text-green-600 hover:underline transition-colors inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-3 h-3 flex-shrink-0" />
                Back to Login
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center justify-center gap-1 w-full"
            >
              <Shield className="w-3 h-3 text-gray-400 flex-shrink-0" />
              <span className="text-[8px] md:text-[10px] text-gray-400">
                Secure • Encrypted • Protected
              </span>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}