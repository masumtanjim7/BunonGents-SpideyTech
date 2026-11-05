'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  Check,
  ShieldCheck,
  Truck,
  Wallet,
  Smartphone,
  ShoppingBag,
  UserCheck,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { API_URL, SiteSettings, formatBDT, Order } from '@/lib/api';
import BrandLogo from '@/components/BrandLogo';

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const { user, token, openAuthModal } = useAuth();

  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [deliveryZone, setDeliveryZone] = useState<'Inside Dhaka' | 'Outside Dhaka'>(
    'Inside Dhaka'
  );
  const [notes, setNotes] = useState('');

  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'bKash' | 'Nagad'>('COD');
  const [senderNumber, setSenderNumber] = useState('');
  const [transactionId, setTransactionId] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [copiedText, setCopiedText] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/settings`)
      .then((r) => r.json())
      .then((data) => {
        if (data) setSettings(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (user) {
      if (!customerName && user.name) setCustomerName(user.name);
      if (!customerPhone && user.phone) setCustomerPhone(user.phone);
      if (!customerEmail && user.email) setCustomerEmail(user.email);
      if (!address && user.address) setAddress(user.address);
      if (user.city) setCity(user.city);
      if (user.deliveryZone) setDeliveryZone(user.deliveryZone);
    }
  }, [user]);

  const insideFee = settings?.insideDhakaShipping ?? 70;
  const outsideFee = settings?.outsideDhakaShipping ?? 130;
  const shippingCost = deliveryZone === 'Inside Dhaka' ? insideFee : outsideFee;
  const totalAmount = subtotal + shippingCost;

  const copyNumber = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedText(num);
    setTimeout(() => setCopiedText(''), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!user || !token) {
      openAuthModal('register');
      return;
    }

    if (items.length === 0) {
      setError('Your bag is empty.');
      return;
    }

    if (paymentMethod !== 'COD' && (!senderNumber.trim() || !transactionId.trim())) {
      setError(
        `Please enter your ${paymentMethod} Sender Number and Transaction ID (TrxID).`
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customerName,
          customerPhone,
          customerEmail,
          shippingAddress: {
            address,
            city: city || 'Dhaka',
            area,
            deliveryZone,
            notes,
          },
          items: items.map((i) => ({
            product: i.productId.length === 24 ? i.productId : undefined,
            title: i.title,
            price: i.price,
            quantity: i.quantity,
            size: i.size,
            color: i.color,
            image: i.image,
          })),
          subtotal,
          shippingCost,
          totalAmount,
          paymentMethod,
          paymentDetails: {
            senderNumber: paymentMethod === 'COD' ? '' : senderNumber,
            transactionId: paymentMethod === 'COD' ? '' : transactionId,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to place order');
      }

      setCompletedOrder(data);
      clearCart();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  if (completedOrder) {
    return (
      <div className="min-h-screen bg-[#f4f3ee] text-[#11241c] py-16 px-4 sm:px-8 flex items-center justify-center">
        <div className="max-w-xl w-full bg-white rounded-3xl p-8 sm:p-10 border border-[#d7ded8] shadow-xl text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-900/10 text-emerald-900 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <p className="text-[11px] uppercase tracking-[0.22em] text-[#11241c]/55 font-semibold">
            ORDER CONFIRMED
          </p>
          <h1 className="font-editorial text-4xl sm:text-5xl text-[#11241c] mt-1">
            Thank you, {completedOrder.customerName}.
          </h1>
          <p className="text-sm text-[#11241c]/70 mt-3">
            Your order has been received. Save your order number below to track
            delivery status anytime.
          </p>

          <div className="mt-6 p-5 rounded-2xl bg-[#f4f3ee] border border-[#d7ded8] text-left space-y-2.5 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-[#d7ded8]">
              <span className="text-[#11241c]/60">Order Number</span>
              <span className="font-mono text-sm font-bold bg-[#11241c] text-white px-3 py-1 rounded-md">
                {completedOrder.orderNumber}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#11241c]/60">Phone</span>
              <span className="font-medium">{completedOrder.customerPhone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#11241c]/60">Payment Method</span>
              <span className="font-semibold">{completedOrder.paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#11241c]/60">Total Amount</span>
              <span className="text-sm font-bold">
                {formatBDT(completedOrder.totalAmount)}
              </span>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href={`/track-order?q=${completedOrder.orderNumber}`}
              className="px-6 py-3.5 rounded-xl bg-[#11241c] text-white text-xs uppercase tracking-widest font-semibold hover:bg-[#1a3529] transition"
            >
              Track Order Status
            </Link>
            <Link
              href="/"
              className="px-6 py-3.5 rounded-xl border border-[#11241c]/20 text-[#11241c] text-xs uppercase tracking-widest font-semibold hover:bg-[#f4f3ee] transition"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

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

          <div className="text-xs text-white/60 hidden sm:block">
            Secure Checkout
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-10 lg:py-14">
        <div className="mb-8">
          <p className="text-[10px] uppercase tracking-[0.22em] text-[#11241c]/55 font-semibold">
            COMPLETE YOUR ORDER
          </p>
          <h1 className="font-editorial text-4xl sm:text-5xl text-[#11241c] mt-1">
            Checkout.
          </h1>
        </div>

        {items.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-[#d7ded8]">
            <ShoppingBag className="w-10 h-10 text-[#11241c]/40 mx-auto mb-3" />
            <h2 className="font-editorial text-3xl mb-2">Your bag is empty</h2>
            <p className="text-sm text-[#11241c]/60 mb-6">
              Add some everyday essentials before checking out.
            </p>
            <Link
              href="/"
              className="inline-flex px-6 py-3 rounded-xl bg-[#11241c] text-white text-xs uppercase tracking-widest font-semibold"
            >
              Browse Men&apos;s Collection
            </Link>
          </div>
        ) : !user ? (
          <div className="bg-white rounded-3xl p-10 sm:p-14 text-center border border-[#d7ded8] max-w-xl mx-auto shadow-sm">
            <div className="w-14 h-14 rounded-full bg-[#11241c] text-white flex items-center justify-center mx-auto mb-4">
              <UserCheck className="w-6 h-6" />
            </div>
            <h2 className="font-editorial text-3xl sm:text-4xl mb-2">
              Create an Account to Order
            </h2>
            <p className="text-sm text-[#11241c]/65 mb-6">
              Please create your Bunon Gents account or sign in so you can place
              your order, save your delivery address, and track all your orders.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => openAuthModal('register')}
                className="px-6 py-3.5 rounded-xl bg-[#11241c] text-white text-xs uppercase tracking-widest font-semibold cursor-pointer"
              >
                Create Account
              </button>
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className="px-6 py-3.5 rounded-xl border border-[#11241c]/25 text-[#11241c] text-xs uppercase tracking-widest font-semibold cursor-pointer"
              >
                Sign In
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            {/* Left Column: Customer & Payment */}
            <div className="lg:col-span-7 space-y-6">
              {error && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                  {error}
                </div>
              )}

              {/* Shipping Info Card */}
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#d7ded8] shadow-xs space-y-5">
                <h2 className="font-editorial text-2xl font-semibold border-b border-[#ebf0ec] pb-3">
                  1. Delivery Details
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Tanjim Hasan"
                      className="w-full px-4 py-2.5 rounded-xl border border-[#d7ded8] bg-[#f4f3ee]/50 text-sm focus:outline-none focus:border-[#11241c]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5">
                      Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="01XXXXXXXXX"
                      className="w-full px-4 py-2.5 rounded-xl border border-[#d7ded8] bg-[#f4f3ee]/50 text-sm focus:outline-none focus:border-[#11241c]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5">
                      Delivery Zone <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={deliveryZone}
                      onChange={(e) =>
                        setDeliveryZone(
                          e.target.value as 'Inside Dhaka' | 'Outside Dhaka'
                        )
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-[#d7ded8] bg-[#f4f3ee]/50 text-sm focus:outline-none focus:border-[#11241c]"
                    >
                      <option value="Inside Dhaka">
                        Inside Dhaka ({formatBDT(insideFee)})
                      </option>
                      <option value="Outside Dhaka">
                        Outside Dhaka ({formatBDT(outsideFee)})
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1.5">
                      City / District <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Dhaka, Chattogram, Sylhet..."
                      className="w-full px-4 py-2.5 rounded-xl border border-[#d7ded8] bg-[#f4f3ee]/50 text-sm focus:outline-none focus:border-[#11241c]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">
                    Full Street Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="House #, Road #, Area / Thana"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#d7ded8] bg-[#f4f3ee]/50 text-sm focus:outline-none focus:border-[#11241c]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5">
                      Email (Optional)
                    </label>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-4 py-2.5 rounded-xl border border-[#d7ded8] bg-[#f4f3ee]/50 text-sm focus:outline-none focus:border-[#11241c]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5">
                      Order Notes (Optional)
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Special delivery instructions"
                      className="w-full px-4 py-2.5 rounded-xl border border-[#d7ded8] bg-[#f4f3ee]/50 text-sm focus:outline-none focus:border-[#11241c]"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method Card */}
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#d7ded8] shadow-xs space-y-5">
                <h2 className="font-editorial text-2xl font-semibold border-b border-[#ebf0ec] pb-3">
                  2. Payment Method
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* COD */}
                  {settings?.codActive !== false && (
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('COD')}
                      className={`p-4 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                        paymentMethod === 'COD'
                          ? 'border-[#11241c] bg-[#11241c] text-white shadow-sm'
                          : 'border-[#d7ded8] bg-[#f4f3ee]/60 text-[#11241c] hover:border-[#11241c]'
                      }`}
                    >
                      <Wallet className="w-5 h-5 mb-2" />
                      <div>
                        <p className="text-xs font-bold">Cash on Delivery</p>
                        <p className="text-[10px] opacity-70">
                          Pay when you receive
                        </p>
                      </div>
                    </button>
                  )}

                  {/* bKash */}
                  {settings?.bkashActive !== false && (
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('bKash')}
                      className={`p-4 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                        paymentMethod === 'bKash'
                          ? 'border-[#e2136e] bg-[#e2136e] text-white shadow-sm'
                          : 'border-[#d7ded8] bg-[#f4f3ee]/60 text-[#11241c] hover:border-[#e2136e]'
                      }`}
                    >
                      <Smartphone className="w-5 h-5 mb-2" />
                      <div>
                        <p className="text-xs font-bold">bKash</p>
                        <p className="text-[10px] opacity-75">
                          Manual Send Money
                        </p>
                      </div>
                    </button>
                  )}

                  {/* Nagad */}
                  {settings?.nagadActive !== false && (
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('Nagad')}
                      className={`p-4 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                        paymentMethod === 'Nagad'
                          ? 'border-[#f7941d] bg-[#f7941d] text-white shadow-sm'
                          : 'border-[#d7ded8] bg-[#f4f3ee]/60 text-[#11241c] hover:border-[#f7941d]'
                      }`}
                    >
                      <Smartphone className="w-5 h-5 mb-2" />
                      <div>
                        <p className="text-xs font-bold">Nagad</p>
                        <p className="text-[10px] opacity-75">
                          Manual Send Money
                        </p>
                      </div>
                    </button>
                  )}
                </div>

                {/* Manual bKash / Nagad Box */}
                {(paymentMethod === 'bKash' || paymentMethod === 'Nagad') && (
                  <div
                    className={`p-5 rounded-2xl border space-y-4 ${
                      paymentMethod === 'bKash'
                        ? 'bg-pink-50/70 border-pink-200'
                        : 'bg-orange-50/70 border-orange-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-black/10">
                      <div>
                        <span className="text-[10px] uppercase tracking-widest font-bold opacity-60">
                          {paymentMethod} Merchant / Personal Number
                        </span>
                        <p className="text-base font-bold text-[#11241c] mt-0.5">
                          {paymentMethod === 'bKash'
                            ? settings?.bkashNumber || '01700-000000 (Personal)'
                            : settings?.nagadNumber || '01800-000000 (Personal)'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          copyNumber(
                            paymentMethod === 'bKash'
                              ? settings?.bkashNumber || '01700-000000'
                              : settings?.nagadNumber || '01800-000000'
                          )
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-black/10 text-xs font-medium hover:bg-black/5 transition cursor-pointer self-start sm:self-auto"
                      >
                        {copiedText ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Number</span>
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-xs text-[#11241c]/75 leading-relaxed">
                      {settings?.paymentInstructions ||
                        `Please Send Money ${formatBDT(
                          totalAmount
                        )} to the ${paymentMethod} number above, then provide your Sender Number and Transaction ID (TrxID) below.`}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold mb-1">
                          Your {paymentMethod} Sender Number{' '}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          required
                          value={senderNumber}
                          onChange={(e) => setSenderNumber(e.target.value)}
                          placeholder="01XXXXXXXXX"
                          className="w-full px-3.5 py-2 rounded-xl border border-black/15 bg-white text-sm focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1">
                          Transaction ID (TrxID){' '}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={transactionId}
                          onChange={(e) => setTransactionId(e.target.value)}
                          placeholder="e.g. BJK892L0Q"
                          className="w-full px-3.5 py-2 rounded-xl border border-black/15 bg-white text-sm uppercase font-mono focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Order Summary */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#d7ded8] shadow-xs sticky top-8 space-y-6">
                <h2 className="font-editorial text-2xl font-semibold border-b border-[#ebf0ec] pb-3">
                  Order Summary
                </h2>

                <div className="space-y-4 max-h-[340px] overflow-y-auto pr-1">
                  {items.map((item) => (
                    <div key={item.key} className="flex items-center gap-3.5">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-14 h-16 rounded-lg object-cover bg-[#ebf0ec] shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-editorial text-base font-semibold truncate">
                          {item.title}
                        </h4>
                        <p className="text-xs text-[#11241c]/60">
                          Size: {item.size} · {item.color} × {item.quantity}
                        </p>
                      </div>
                      <span className="text-xs font-bold">
                        {formatBDT(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2.5 pt-4 border-t border-[#ebf0ec] text-xs">
                  <div className="flex justify-between text-[#11241c]/70">
                    <span>Subtotal</span>
                    <span>{formatBDT(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-[#11241c]/70">
                    <span>Delivery ({deliveryZone})</span>
                    <span>{formatBDT(shippingCost)}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-[#11241c] pt-3 border-t border-[#ebf0ec]">
                    <span>Total Payable</span>
                    <span>{formatBDT(totalAmount)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 px-6 rounded-xl bg-[#11241c] text-white text-xs uppercase tracking-[0.18em] font-semibold hover:bg-[#1a3529] transition disabled:opacity-50 cursor-pointer shadow-md"
                >
                  {submitting
                    ? 'Placing Order...'
                    : `Confirm Order · ${formatBDT(totalAmount)}`}
                </button>

                <div className="pt-2 space-y-2 text-[11px] text-[#11241c]/60">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-[#11241c]" />
                    <span>Fast delivery within 2-4 business days</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#11241c]" />
                    <span>100% quality checked before dispatch</span>
                  </div>
                </div>
              </div>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
