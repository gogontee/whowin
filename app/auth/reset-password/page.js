'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../../lib/supabase';
import { ArrowLeft, Check, Eye, EyeOff, Lock, Shield, X } from 'lucide-react';

export default function ResetPasswordPage() {
  const [recoveryStatus, setRecoveryStatus] = useState('checking');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const hasRecoveryType =
      queryParams.get('type') === 'recovery' ||
      hashParams.get('type') === 'recovery';
    const hasCode = queryParams.has('code');

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (
        session &&
        (event === 'PASSWORD_RECOVERY' ||
          (hasRecoveryType && event === 'INITIAL_SESSION'))
      ) {
        setRecoveryStatus('ready');
      } else if (event === 'INITIAL_SESSION' && !hasCode) {
        setRecoveryStatus('invalid');
      }
    });

    const timeout = setTimeout(() => {
      setRecoveryStatus(status => status === 'checking' ? 'invalid' : status);
    }, 10000);

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const meetsPasswordRequirements =
      password.length >= 8 &&
      /[a-z]/.test(password) &&
      /[A-Z]/.test(password) &&
      /[0-9]/.test(password);
    if (!meetsPasswordRequirements) {
      setError('Use at least 8 characters, including an uppercase letter, a lowercase letter, and a number.');
      return;
    }

    if (password !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        console.error('Error signing out after password reset:', signOutError);
      }

      setRecoveryStatus('success');
    } catch (updateError) {
      console.error('Password reset error:', updateError);
      setError(
        updateError.message?.toLowerCase().includes('same password')
          ? 'Choose a password you have not used before.'
          : 'Could not update your password. The reset link may have expired; request a new one and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-[calc(100vh-5rem)] bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-amber-200/70 bg-white/95 p-6 shadow-2xl md:p-8">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
          {recoveryStatus === 'success' ? (
            <Check className="h-7 w-7 text-green-600" />
          ) : (
            <Lock className="h-7 w-7 text-amber-700" />
          )}
        </div>

        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-800">
            {recoveryStatus === 'success' ? 'Password updated' : 'Reset your password'}
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            {recoveryStatus === 'success'
              ? 'Your password has been changed. You can now sign in with your new password.'
              : recoveryStatus === 'invalid'
                ? 'This password reset link is invalid or has expired. Request a new link to continue.'
                : 'Choose a new password for your WhoWin account.'}
          </p>
        </div>

        {recoveryStatus === 'checking' && (
          <div className="py-5 text-center text-sm text-gray-500" role="status">
            Verifying your password reset link...
          </div>
        )}

        {recoveryStatus === 'ready' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
                <X className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="new-password" className="mb-1 block text-sm font-medium text-gray-700">
                New password
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-12 text-gray-800 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                  placeholder="At least 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(value => !value)}
                  className="absolute inset-y-0 right-0 flex items-center px-4 text-gray-400 hover:text-amber-700"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirm-password" className="mb-1 block text-sm font-medium text-gray-700">
                Confirm new password
              </label>
              <div className="relative">
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={event => setConfirmPassword(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-12 text-gray-800 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                  placeholder="Re-enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(value => !value)}
                  className="absolute inset-y-0 right-0 flex items-center px-4 text-gray-400 hover:text-amber-700"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <p className="flex items-center gap-2 text-xs text-gray-500">
              <Shield className="h-3.5 w-3.5 text-amber-600" />
              Use 8+ characters with uppercase, lowercase, and a number.
            </p>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-amber-600 to-yellow-500 px-4 py-3 font-semibold text-white transition hover:from-amber-700 hover:to-yellow-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Updating password...' : 'Update password'}
            </button>
          </form>
        )}

        {(recoveryStatus === 'invalid' || recoveryStatus === 'success') && (
          <Link
            href="/auth/login"
            className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-amber-600 to-yellow-500 px-4 py-3 font-semibold text-white transition hover:from-amber-700 hover:to-yellow-600"
          >
            {recoveryStatus === 'success' ? 'Go to sign in' : 'Request a new reset link'}
          </Link>
        )}

        {recoveryStatus !== 'success' && (
          <Link
            href="/auth/login"
            className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500 transition hover:text-amber-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>
        )}
      </div>
    </section>
  );
}
