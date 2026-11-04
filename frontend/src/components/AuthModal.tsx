'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  UserCheck,
  Lock,
  Mail,
  Phone,
  MapPin,
  User,
  ArrowLeft,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { API_URL } from '@/lib/api';
import BrandLogo from '@/components/BrandLogo';

type ModalMode = 'login' | 'register' | 'forgot' | 'verify_otp';

export default function AuthModal() {
  const {
    isAuthModalOpen,
    authModalMode,
    closeAuthModal,
    loginSuccess,
  } = useAuth();

  const [mode, setMode] = useState<ModalMode>('register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Dhaka');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Password Reset state
  const [resetEmail, setResetEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');

  useEffect(() => {
    setMode(authModalMode);
    setError('');
    setSuccessMsg('');
  }, [authModalMode, isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const endpoint = mode === 'register' ? '/auth/register' : '/auth/login';
      const body =
        mode === 'register'
          ? { name, email, phone, address, city, password }
          : { email, password };

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      loginSuccess(data, data.token);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to send verification code');
      }

      setSuccessMsg(data.message || 'A 6-digit OTP code has been sent to your email.');
      setMode('verify_otp');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error sending OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (resetNewPassword !== resetConfirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (resetNewPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: resetEmail,
          otp: resetOtp.trim(),
          newPassword: resetNewPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }

      if (data.token && data.user) {
        loginSuccess(data.user, data.token);
      } else {
        setSuccessMsg('Password updated! Please sign in with your new password.');
        setPassword('');
        setEmail(resetEmail);
        setMode('login');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error resetting password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div
        onClick={closeAuthModal}
        className="fixed inset-0 bg-black/65 backdrop-blur-xs transition-opacity"
      />

      <div className="relative z-10 w-full max-w-md rounded-3xl bg-[#f4f3ee] text-[#11241c] shadow-2xl border border-[#d7ded8] overflow-hidden">
        {/* Top Dark Header */}
        <div className="bg-[#11241c] text-white px-7 py-6 flex items-center justify-between">
          <div>
            <BrandLogo size="sm" />
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/65 mt-2 font-semibold">
              {mode === 'register'
                ? 'CREATE YOUR ACCOUNT TO SHOP & ORDER'
                : mode === 'login'
                ? 'WELCOME BACK TO BUNON GENTS'
                : 'ACCOUNT RECOVERY'}
            </p>
          </div>
          <button
            onClick={closeAuthModal}
            className="p-2 rounded-full hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switch Tabs or Back Link */}
        {mode === 'login' || mode === 'register' ? (
          <div className="grid grid-cols-2 bg-[#e4ebe6] p-1.5 mx-6 mt-5 rounded-xl border border-[#d7ded8]">
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError('');
                setSuccessMsg('');
              }}
              className={`py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition cursor-pointer ${
                mode === 'register'
                  ? 'bg-[#11241c] text-white shadow-xs'
                  : 'text-[#11241c]/70 hover:text-[#11241c]'
              }`}
            >
              Create Account
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
                setSuccessMsg('');
              }}
              className={`py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition cursor-pointer ${
                mode === 'login'
                  ? 'bg-[#11241c] text-white shadow-xs'
                  : 'text-[#11241c]/70 hover:text-[#11241c]'
              }`}
            >
              Sign In
            </button>
          </div>
        ) : (
          <div className="px-6 pt-5">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
                setSuccessMsg('');
              }}
              className="inline-flex items-center gap-1.5 text-xs text-[#11241c]/70 hover:text-[#11241c] font-semibold cursor-pointer transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </button>
          </div>
        )}

        {/* Feedback Messages */}
        <div className="px-6 pt-4 empty:hidden">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        {/* VIEW 1 & 2: LOGIN / REGISTER FORMS */}
        {(mode === 'login' || mode === 'register') && (
          <form onSubmit={handleSubmit} className="p-6 pt-4 space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#11241c]/40" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#d7ded8] bg-white text-sm focus:outline-none focus:border-[#11241c]"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#11241c]/40" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#d7ded8] bg-white text-sm focus:outline-none focus:border-[#11241c]"
                />
              </div>
            </div>

            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#11241c]/40" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="01XXXXXXXXX"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#d7ded8] bg-white text-sm focus:outline-none focus:border-[#11241c]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold mb-1">
                      Default Delivery Address
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#11241c]/40" />
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="House, Road, Area"
                        className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-[#d7ded8] bg-white text-sm focus:outline-none focus:border-[#11241c]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Dhaka"
                      className="w-full px-3 py-2.5 rounded-xl border border-[#d7ded8] bg-white text-sm focus:outline-none focus:border-[#11241c]"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold">
                  Password <span className="text-red-500">*</span>
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(email);
                      setError('');
                      setSuccessMsg('');
                      setMode('forgot');
                    }}
                    className="text-[11px] text-[#11241c]/70 hover:text-[#11241c] hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#11241c]/40" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#d7ded8] bg-white text-sm focus:outline-none focus:border-[#11241c]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-xl bg-[#11241c] text-white text-xs uppercase tracking-[0.18em] font-semibold flex items-center justify-center gap-2 hover:bg-[#1a3529] transition cursor-pointer shadow-md mt-2 disabled:opacity-50"
            >
              <UserCheck className="w-4 h-4" />
              <span>
                {loading
                  ? 'Please wait...'
                  : mode === 'register'
                  ? 'Create Account & Continue'
                  : 'Sign In & Continue'}
              </span>
            </button>
          </form>
        )}

        {/* VIEW 3: FORGOT PASSWORD (REQUEST OTP) */}
        {mode === 'forgot' && (
          <form onSubmit={handleRequestOtp} className="p-6 pt-4 space-y-4">
            <div className="text-center pb-2">
              <div className="w-12 h-12 rounded-full bg-[#11241c]/10 text-[#11241c] flex items-center justify-center mx-auto mb-2">
                <Mail className="w-5 h-5" />
              </div>
              <h3 className="font-editorial text-2xl font-semibold">
                Reset Password
              </h3>
              <p className="text-xs text-[#11241c]/65 mt-1">
                Enter your account email. We will send a 6-digit OTP code to verify your identity.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">
                Account Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#11241c]/40" />
                <input
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#d7ded8] bg-white text-sm focus:outline-none focus:border-[#11241c]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-xl bg-[#11241c] text-white text-xs uppercase tracking-[0.18em] font-semibold flex items-center justify-center gap-2 hover:bg-[#1a3529] transition cursor-pointer shadow-md mt-2 disabled:opacity-50"
            >
              <span>{loading ? 'Sending OTP Code...' : 'Send Verification OTP'}</span>
            </button>
          </form>
        )}

        {/* VIEW 4: VERIFY OTP & RESET PASSWORD */}
        {mode === 'verify_otp' && (
          <form onSubmit={handleResetPassword} className="p-6 pt-4 space-y-4">
            <div className="text-center pb-2">
              <div className="w-12 h-12 rounded-full bg-[#11241c]/10 text-emerald-800 flex items-center justify-center mx-auto mb-2">
                <KeyRound className="w-5 h-5" />
              </div>
              <h3 className="font-editorial text-2xl font-semibold">
                Enter 6-Digit OTP
              </h3>
              <p className="text-xs text-[#11241c]/65 mt-1">
                Check your inbox at <strong>{resetEmail}</strong> for the verification code.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-center">
                Verification Code (OTP) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={resetOtp}
                onChange={(e) => setResetOtp(e.target.value)}
                placeholder="123456"
                className="w-full px-4 py-2.5 rounded-xl border border-[#d7ded8] bg-white text-center text-xl font-mono tracking-[8px] focus:outline-none focus:border-[#11241c]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">
                New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#11241c]/40" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={resetNewPassword}
                  onChange={(e) => setResetNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#d7ded8] bg-white text-sm focus:outline-none focus:border-[#11241c]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">
                Confirm New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#11241c]/40" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={resetConfirmPassword}
                  onChange={(e) => setResetConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#d7ded8] bg-white text-sm focus:outline-none focus:border-[#11241c]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-xl bg-[#11241c] text-white text-xs uppercase tracking-[0.18em] font-semibold flex items-center justify-center gap-2 hover:bg-[#1a3529] transition cursor-pointer shadow-md mt-2 disabled:opacity-50"
            >
              <span>{loading ? 'Resetting Password...' : 'Reset Password & Sign In'}</span>
            </button>

            <div className="flex items-center justify-between text-xs text-[#11241c]/60 pt-1">
              <button
                type="button"
                onClick={handleRequestOtp}
                className="hover:text-[#11241c] hover:underline cursor-pointer"
              >
                Resend OTP Code
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                  setSuccessMsg('');
                }}
                className="hover:text-[#11241c] cursor-pointer inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Back to Sign In</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
