'use client';

import React, { useState, useEffect } from 'react';
import { X, UserCheck, Lock, Mail, Phone, MapPin, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { API_URL } from '@/lib/api';
import BrandLogo from '@/components/BrandLogo';

export default function AuthModal() {
  const {
    isAuthModalOpen,
    authModalMode,
    closeAuthModal,
    loginSuccess,
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Dhaka');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setMode(authModalMode);
    setError('');
  }, [authModalMode, isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
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
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/65 mt-2">
              {mode === 'register'
                ? 'CREATE YOUR ACCOUNT TO SHOP & ORDER'
                : 'WELCOME BACK TO BUNON GENTS'}
            </p>
          </div>
          <button
            onClick={closeAuthModal}
            className="p-2 rounded-full hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switch Tabs */}
        <div className="grid grid-cols-2 bg-[#e4ebe6] p-1.5 mx-6 mt-5 rounded-xl border border-[#d7ded8]">
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError('');
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              {error}
            </div>
          )}

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
            <label className="block text-xs font-semibold mb-1">
              Password <span className="text-red-500">*</span>
            </label>
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
            className="w-full py-3.5 px-6 rounded-xl bg-[#11241c] text-white text-xs uppercase tracking-[0.18em] font-semibold flex items-center justify-center gap-2 hover:bg-[#1a3529] transition cursor-pointer shadow-md mt-2"
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
      </div>
    </div>
  );
}
