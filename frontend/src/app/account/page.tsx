'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  User,
  Package,
  LogOut,
  CheckCircle2,
  Truck,
  Save,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { API_URL, Order, formatBDT } from '@/lib/api';
import BrandLogo from '@/components/BrandLogo';

export default function CustomerAccountPage() {
  const { user, token, logout, openAuthModal, loginSuccess } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Dhaka');
  const [deliveryZone, setDeliveryZone] = useState<
    'Inside Dhaka' | 'Outside Dhaka'
  >('Inside Dhaka');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setAddress(user.address || '');
      setCity(user.city || 'Dhaka');
      setDeliveryZone(user.deliveryZone || 'Inside Dhaka');
    }
  }, [user]);

  useEffect(() => {
    if (!token) return;
    setLoadingOrders(true);
    fetch(`${API_URL}/orders/my-orders`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setOrders(data);
      })
      .catch(() => {})
      .finally(() => setLoadingOrders(false));
  }, [token]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          phone,
          address,
          city,
          deliveryZone,
          newPassword: newPassword || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        loginSuccess(data, data.token);
        setNewPassword('');
        setToast('Profile updated successfully!');
        setTimeout(() => setToast(''), 3000);
      }
    } catch {}
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-[#f4f3ee] text-[#11241c]">
      {/* Header */}
      <header className="bg-[#11241c] text-white py-5 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-white/80 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Store</span>
          </Link>

          <BrandLogo size="sm" />

          {user && (
            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 text-xs text-red-300 hover:text-red-200 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-10 lg:py-14">
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#11241c] text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toast}</span>
          </div>
        )}

        {!user ? (
          <div className="max-w-md mx-auto bg-white rounded-3xl p-10 text-center border border-[#d7ded8] shadow-xs">
            <User className="w-10 h-10 text-[#11241c]/40 mx-auto mb-3" />
            <h1 className="font-editorial text-3xl mb-2">
              Sign in to Your Account
            </h1>
            <p className="text-xs text-[#11241c]/65 mb-6">
              Create your Bunon Gents account or sign in to view your orders and
              saved shipping details.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => openAuthModal('register')}
                className="px-6 py-3 rounded-xl bg-[#11241c] text-white text-xs uppercase tracking-widest font-semibold cursor-pointer"
              >
                Create Account
              </button>
              <button
                onClick={() => openAuthModal('login')}
                className="px-6 py-3 rounded-xl border border-[#11241c]/25 text-xs uppercase tracking-widest font-semibold cursor-pointer"
              >
                Sign In
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.22em] text-[#11241c]/55 font-semibold">
                  MEMBER ACCOUNT
                </p>
                <h1 className="font-editorial text-4xl sm:text-5xl text-[#11241c] mt-1">
                  Hello, {user.name}.
                </h1>
              </div>

              <div className="flex items-center gap-2 text-xs bg-white px-4 py-2 rounded-full border border-[#d7ded8]">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>Account Status: Active</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left: Profile & Saved Shipping */}
              <div className="lg:col-span-5">
                <form
                  onSubmit={handleSaveProfile}
                  className="bg-white rounded-3xl p-6 sm:p-8 border border-[#d7ded8] shadow-xs space-y-4"
                >
                  <div className="flex items-center gap-2 border-b border-[#ebf0ec] pb-3">
                    <User className="w-4 h-4" />
                    <h2 className="font-editorial text-2xl font-semibold">
                      Profile & Delivery Info
                    </h2>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#d7ded8] bg-[#f4f3ee]/50 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      disabled
                      value={user.email}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#d7ded8] bg-gray-100 text-sm text-[#11241c]/60"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="01XXXXXXXXX"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#d7ded8] bg-[#f4f3ee]/50 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold mb-1">
                        Delivery Zone
                      </label>
                      <select
                        value={deliveryZone}
                        onChange={(e) =>
                          setDeliveryZone(
                            e.target.value as 'Inside Dhaka' | 'Outside Dhaka'
                          )
                        }
                        className="w-full px-3 py-2.5 rounded-xl border border-[#d7ded8] bg-[#f4f3ee]/50 text-sm"
                      >
                        <option value="Inside Dhaka">Inside Dhaka</option>
                        <option value="Outside Dhaka">Outside Dhaka</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#d7ded8] bg-[#f4f3ee]/50 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      Default Street Address
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="House, Road, Area"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#d7ded8] bg-[#f4f3ee]/50 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      New Password (Optional)
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Leave blank to keep current"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#d7ded8] bg-[#f4f3ee]/50 text-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full py-3.5 rounded-xl bg-[#11241c] text-white text-xs uppercase tracking-widest font-semibold flex items-center justify-center gap-2 hover:bg-[#1a3529] transition cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </form>
              </div>

              {/* Right: Order History */}
              <div className="lg:col-span-7 space-y-4">
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#d7ded8] shadow-xs">
                  <div className="flex items-center justify-between border-b border-[#ebf0ec] pb-4 mb-5">
                    <div className="flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      <h2 className="font-editorial text-2xl font-semibold">
                        Order History ({orders.length})
                      </h2>
                    </div>
                  </div>

                  {loadingOrders ? (
                    <p className="text-xs text-[#11241c]/60 py-8 text-center">
                      Loading your orders...
                    </p>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-sm text-[#11241c]/60 mb-4">
                        You haven&apos;t placed any orders yet.
                      </p>
                      <Link
                        href="/"
                        className="inline-flex px-5 py-2.5 rounded-xl bg-[#11241c] text-white text-xs uppercase tracking-widest font-semibold"
                      >
                        Explore Men&apos;s Collection
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div
                          key={order._id}
                          className="p-5 rounded-2xl bg-[#f4f3ee] border border-[#d7ded8] space-y-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#d7ded8]">
                            <div>
                              <span className="font-mono text-sm font-bold">
                                {order.orderNumber}
                              </span>
                              <span className="text-xs text-[#11241c]/60 ml-3">
                                {new Date(order.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="px-3 py-1 rounded-full bg-[#11241c] text-white text-[11px] font-semibold flex items-center gap-1">
                                <Truck className="w-3 h-3" />
                                {order.orderStatus}
                              </span>
                              <span className="px-2.5 py-1 rounded-full bg-white text-[11px] font-medium">
                                {order.paymentMethod} ({order.paymentStatus})
                              </span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            {order.items.map((item, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between text-xs"
                              >
                                <span>
                                  <strong>{item.title}</strong> ({item.size} ·{' '}
                                  {item.color}) × {item.quantity}
                                </span>
                                <span className="font-semibold">
                                  {formatBDT(item.price * item.quantity)}
                                </span>
                              </div>
                            ))}
                          </div>

                          <div className="pt-2 border-t border-[#d7ded8] flex justify-between items-center text-xs font-bold">
                            <span>Total Paid / Payable</span>
                            <span className="text-sm">
                              {formatBDT(order.totalAmount)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
