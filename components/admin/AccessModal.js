// components/admin/AccessModal.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { KeyRound, LogIn, Loader, Eye, EyeOff } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

export default function AccessModal({ onAccessGranted }) {
  const router = useRouter();
  const [accessCode, setAccessCode] = useState('');
  const [accessError, setAccessError] = useState('');
  const [verifyingAccess, setVerifyingAccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // Check if admin access is already stored in session
  useEffect(() => {
    const checkStoredAccess = async () => {
      // Check if we have a stored admin session
      const storedAccess = sessionStorage.getItem('admin_access_granted');
      
      if (storedAccess === 'true') {
        // Verify the user is still logged in and is admin
        try {
          const { data: { user } } = await supabase.auth.getUser();
          
          if (user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', user.id)
              .single();

            if (profile?.role === 'admin') {
              // Still valid - grant access
              onAccessGranted();
              return;
            }
          }
        } catch (error) {
          console.error('Error verifying stored admin session:', error);
        }
        
        // If we get here, stored access is invalid
        sessionStorage.removeItem('admin_access_granted');
      }
    };

    checkStoredAccess();
  }, [onAccessGranted, supabase]);

  const verifyAccessCode = async () => {
    setVerifyingAccess(true);
    setAccessError('');
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setAccessError('Please log in first');
        setTimeout(() => router.push('/auth/login'), 2000);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'admin') {
        setAccessError('You do not have admin privileges');
        setTimeout(() => router.push('/'), 2000);
        return;
      }

      // Get admin access code from who_win table where id = 1
      const { data: whowin, error: whowinError } = await supabase
        .from('who_win')
        .select('admin_access_code')
        .eq('id', 1)
        .maybeSingle();

      console.log('WhoWin data:', whowin);
      console.log('WhoWin error:', whowinError);

      if (whowinError) {
        console.error('Error fetching admin access code:', whowinError);
        setAccessError('Unable to verify access code. Please contact support.');
        return;
      }

      if (!whowin) {
        console.error('No who_win record found with id=1');
        setAccessError('Admin access code not configured. Please contact support.');
        return;
      }

      console.log('Entered code:', accessCode);
      console.log('Stored code:', whowin.admin_access_code);

      // Compare entered code with stored code
      if (whowin.admin_access_code.trim() === accessCode.trim()) {
        console.log('✅ Access granted!');
        
        // Store admin access in session storage (lasts until browser tab is closed)
        sessionStorage.setItem('admin_access_granted', 'true');
        sessionStorage.setItem('admin_access_time', Date.now().toString());
        
        onAccessGranted();
      } else {
        setAccessError('Invalid access code');
      }
    } catch (error) {
      console.error('Error verifying access:', error);
      setAccessError('An error occurred. Please try again.');
    } finally {
      setVerifyingAccess(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-burnt-orange-950 to-black flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md bg-gradient-to-b from-gray-900 to-black rounded-xl border border-white/10 p-6"
      >
        <div className="w-20 h-20 bg-gradient-to-r from-burnt-orange-500 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <KeyRound className="w-10 h-10 text-white" />
        </div>
        
        <h2 className="text-2xl font-bold text-white text-center mb-2">Admin Access Required</h2>
        <p className="text-sm text-white/60 text-center mb-6">
          Please enter the admin access code to continue
        </p>

        <div className="space-y-4">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              placeholder="Enter access code"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:border-burnt-orange-500 focus:outline-none transition-colors text-center text-lg tracking-widest pr-12"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && verifyAccessCode()}
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/40 hover:text-white/70"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>

          {accessError && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-red-400 text-center bg-red-500/10 py-2 rounded-lg"
            >
              {accessError}
            </motion.p>
          )}

          <button
            onClick={verifyAccessCode}
            disabled={verifyingAccess || !accessCode}
            className="w-full py-3 bg-gradient-to-r from-burnt-orange-500 to-yellow-500 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {verifyingAccess ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Access Admin Panel
              </>
            )}
          </button>

          <button
            onClick={() => router.push('/')}
            className="w-full py-2 text-sm text-white/40 hover:text-white/60 transition-colors"
          >
            Return to Home
          </button>
        </div>
      </motion.div>
    </div>
  );
}