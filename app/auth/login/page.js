// /app/auth/login/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { createBrowserClient } from '@supabase/ssr';
import { 
  Eye, 
  EyeOff, 
  Check, 
  X, 
  Star, 
  Shield,
  Mail,
  Lock,
  LogIn,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // Cooldown countdown effect
  useEffect(() => {
    if (!cooldownUntil) return;
    
    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((cooldownUntil - now) / 1000));
      
      if (remaining <= 0) {
        setCooldownUntil(null);
        setCooldownSeconds(0);
        clearInterval(interval);
      } else {
        setCooldownSeconds(remaining);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [cooldownUntil]);

  const validateForm = () => {
    const newErrors = {};
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    if (cooldownSeconds > 0) {
      setErrors(prev => ({
        ...prev,
        submit: `Too many attempts. Please wait ${cooldownSeconds} seconds.`
      }));
      return;
    }
    
    setLoading(true);
    setErrors(prev => ({ ...prev, submit: '' }));
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });
      
      if (error) {
        console.error('Login error details:', error);
        
        if (error.status === 429 || error.message.includes('security purposes') || error.message.includes('rate limit')) {
          const waitTime = 60;
          setCooldownUntil(Date.now() + (waitTime * 1000));
          
          setErrors(prev => ({
            ...prev,
            submit: `Too many login attempts. Please wait ${waitTime} seconds.`
          }));
          setLoading(false);
          return;
        }
        
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password. Please try again.');
        } else if (error.message.includes('Email not confirmed')) {
          throw new Error('Please verify your email before logging in.');
        }
        throw error;
      }
      
      if (!data?.user) {
        throw new Error('Failed to login');
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        setSuccess(true);
        setTimeout(() => {
          router.push('/');
        }, 2000);
        return;
      }

      setSuccess(true);
      
      setTimeout(() => {
        router.push(`/${profile.username}`);
      }, 2000);
      
    } catch (error) {
      console.error('Login error:', error);
      setErrors(prev => ({
        ...prev,
        submit: error.message || 'An error occurred during login. Please try again.'
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      setErrors(prev => ({
        ...prev,
        email: 'Please enter your email to reset password'
      }));
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;

      setErrors(prev => ({
        ...prev,
        submit: 'Password reset email sent! Check your inbox.'
      }));
    } catch (error) {
      console.error('Reset password error:', error);
      setErrors(prev => ({
        ...prev,
        submit: 'Failed to send reset email. Please try again.'
      }));
    }
  };

  // Floating gold sparkles animation
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
      {/* Animated Background Gold Sparkles */}
      {floatingSparks.map((spark) => (
        <motion.div
          key={spark.id}
          className="absolute pointer-events-none hidden md:block"
          initial={{ 
            x: `${spark.x}vw`, 
            y: `${spark.y}vh`,
            scale: 0,
            opacity: 0.3
          }}
          animate={{ 
            y: [`${spark.y}vh`, `${spark.y - 20}vh`, `${spark.y}vh`],
            x: [`${spark.x}vw`, `${spark.x + 10}vw`, `${spark.x}vw`],
            rotate: [0, 180, 360],
            scale: [0, 0.9, 0],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{
            duration: spark.duration,
            delay: spark.delay,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          <Sparkles 
            size={spark.size} 
            className="text-amber-400/30"
          />
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
          transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
          className="relative backdrop-blur-xl bg-white/95 rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden border border-amber-200/50"
        >
          <motion.div
            className="absolute inset-0 pointer-events-none"
            animate={{
              boxShadow: [
                "0 0 30px rgba(217, 119, 6, 0.08), inset 0 0 30px rgba(217, 119, 6, 0.02)",
                "0 0 50px rgba(217, 119, 6, 0.12), inset 0 0 40px rgba(217, 119, 6, 0.04)",
                "0 0 30px rgba(217, 119, 6, 0.08), inset 0 0 30px rgba(217, 119, 6, 0.02)",
              ],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Header with Black Background */}
          <div className="bg-black w-full h-20 md:h-24 flex items-center justify-center">
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="relative"
            >
              <div className="relative w-48 h-16 md:w-56 md:h-20">
                <Image
                  src="/logo.jpg"
                  alt="WhoWin Logo"
                  fill
                  sizes="(max-width: 768px) 192px, 224px"
                  className="object-contain"
                  priority
                />
              </div>
            </motion.div>
          </div>

          {/* Gold Accent Line */}
          <div className="h-1 bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600"></div>

          {/* Form Content */}
          <div className="p-6 md:p-8 space-y-5 md:space-y-6">
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="text-center"
            >
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
                Welcome Back
              </h2>
              <p className="text-sm md:text-base text-gray-500 mt-1">
                Sign in to access your WhoWin page
              </p>
            </motion.div>

            {/* Rate Limit Warning */}
            <AnimatePresence>
              {cooldownSeconds > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-amber-50 border border-amber-300 rounded-lg p-3 text-center"
                >
                  <p className="text-amber-700 text-xs md:text-sm">
                    ⚠️ Too many login attempts
                  </p>
                  <p className="text-amber-600 text-[10px] md:text-xs mt-1">
                    Please wait {cooldownSeconds} seconds before trying again.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success/Error Messages */}
            <AnimatePresence>
              {errors.submit && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`rounded-lg p-3 text-center ${
                    errors.submit.includes('sent') || errors.submit.includes('Success')
                      ? 'bg-green-50 border border-green-200 text-green-700'
                      : 'bg-red-50 border border-red-200 text-red-600'
                  }`}
                >
                  <p className="text-xs md:text-sm">{errors.submit}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
              {/* Email */}
              <motion.div
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <label htmlFor="email" className="block text-xs md:text-sm font-medium text-gray-600 mb-1 ml-1 flex items-center gap-1">
                  <Mail className="w-3 h-3 md:w-4 md:h-4" /> Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="your@email.com"
                  className={`w-full px-3 py-2 md:px-4 md:py-3 bg-white border rounded-lg md:rounded-xl text-sm md:text-base text-gray-800 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all outline-none placeholder:text-gray-400 ${
                    errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-amber-400'
                  }`}
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading || cooldownSeconds > 0}
                  required
                />
                {errors.email && (
                  <p className="mt-1 text-[10px] md:text-xs text-red-600">{errors.email}</p>
                )}
              </motion.div>

              {/* Password */}
              <motion.div
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 }}
              >
                <label htmlFor="password" className="block text-xs md:text-sm font-medium text-gray-600 mb-1 ml-1 flex items-center gap-1">
                  <Lock className="w-3 h-3 md:w-4 md:h-4" /> Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    placeholder="Enter your password"
                    className={`w-full px-3 py-2 md:px-4 md:py-3 bg-white border rounded-lg md:rounded-xl text-sm md:text-base text-gray-800 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all outline-none placeholder:text-gray-400 pr-10 ${
                      errors.password ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-amber-400'
                    }`}
                    value={formData.password}
                    onChange={handleChange}
                    disabled={loading || cooldownSeconds > 0}
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-amber-600 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    disabled={loading || cooldownSeconds > 0}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-[10px] md:text-xs text-red-600">{errors.password}</p>
                )}
              </motion.div>

              {/* Remember Me & Forgot Password */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex items-center justify-between"
              >
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                    className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500 focus:ring-offset-0"
                    disabled={loading || cooldownSeconds > 0}
                  />
                  <span className="text-xs md:text-sm text-gray-600 group-hover:text-gray-800 transition-colors">Remember me</span>
                </label>
                
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs md:text-sm text-amber-600 hover:text-green-600 font-medium transition-colors"
                  disabled={loading || cooldownSeconds > 0}
                >
                  Forgot password?
                </button>
              </motion.div>

              {/* Submit Button - Gold with Green Hover */}
              <motion.button
                type="submit"
                disabled={loading || cooldownSeconds > 0}
                whileHover={{ scale: cooldownSeconds > 0 ? 1 : 1.02 }}
                whileTap={{ scale: cooldownSeconds > 0 ? 1 : 0.98 }}
                className={`w-full py-3 md:py-4 rounded-lg md:rounded-xl font-semibold text-white shadow-lg transition-all relative overflow-hidden group ${
                  loading || cooldownSeconds > 0
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 hover:from-green-500 hover:via-emerald-500 hover:to-green-500'
                }`}
              >
                {/* Button Glow Effect */}
                {!cooldownSeconds && !loading && (
                  <motion.div
                    className="absolute inset-0 bg-white/20"
                    animate={{
                      x: ["-100%", "200%"],
                    }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      repeatDelay: 0.8,
                    }}
                  />
                )}
                
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    />
                    <span className="text-sm md:text-base relative z-10">Signing in...</span>
                  </div>
                ) : cooldownSeconds > 0 ? (
                  <span className="text-sm md:text-base relative z-10">
                    Wait {cooldownSeconds}s
                  </span>
                ) : (
                  <span className="text-sm md:text-base relative z-10 flex items-center justify-center gap-2">
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </span>
                )}
              </motion.button>

              {/* Sign Up Link */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.45 }}
                className="text-center"
              >
                <p className="text-xs md:text-sm text-gray-500">
                  Don't have an account?{' '}
                  <Link
                    href="/auth/signup"
                    className="text-amber-600 font-semibold hover:text-green-600 hover:underline transition-colors inline-flex items-center gap-1"
                  >
                    Sign up
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </p>
              </motion.div>

              {/* Security Badge */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex items-center justify-center gap-1"
              >
                <Shield className="w-3 h-3 text-gray-400" />
                <span className="text-[8px] md:text-[10px] text-gray-400">Secure • Encrypted • Protected</span>
              </motion.div>
            </form>
          </div>
        </motion.div>
      </motion.div>

      {/* Success Modal */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: -20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl text-center border border-amber-200"
            >
              <div className="w-20 h-20 bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-white" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-800 mb-3">
                Welcome Back! 🎉
              </h2>
              
              <p className="text-gray-600 text-base mb-6">
                You've successfully signed in to<br />
                <span className="font-semibold text-amber-600">WhoWin</span>
              </p>
              
              <div className="space-y-3">
                <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-500">
                  <p>Taking you to your profile...</p>
                </div>
                
                <div className="flex items-center justify-center gap-2 text-sm text-amber-600">
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                  <span>Redirecting to your personalized space</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}