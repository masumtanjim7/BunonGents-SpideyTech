'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Search,
  Package,
  CheckCircle2,
  Truck,
  AlertCircle,
  MapPin,
  Calendar,
} from 'lucide-react';
import { API_URL, Order, formatBDT } from '@/lib/api';
import BrandLogo from '@/components/BrandLogo';

const ORDER_STEPS = [
  { key: 'Pending', label: 'Placed' },
  { key: 'Confirmed', label: 'Confirmed' },
  { key: 'Processing', label: 'Processing' },
  { key: 'Shipped', label: 'Shipped' },
  { key: 'Delivered', label: 'Delivered' },
];

const STATUS_PROGRESS: Record<string, number> = {
  Pending: 0,
  Confirmed: 1,
  Processing: 2,
  Shipped: 3,
  Delivered: 4,
};

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (searchVal: string) => {
    if (!searchVal.trim()) return;
    setLoading(true);
    setError('');
    setSearched(true);
    try {
      const res = await fetch(
        `${API_URL}/orders/track/${encodeURIComponent(searchVal.trim())}`
      );
      const data = await res.json();
      if (!res.ok) {
        setOrders([]);
        setError(data.message || 'No matching orders found.');
      } else {
        setOrders(data);
      }
    } catch {
      setError('Unable to reach server. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery);
    }
  }, [initialQuery]);

  return (
    <div className="min-h-screen bg-[#f4f3ee] text-[#11241c] flex flex-col">
      {/* Mobile-optimized Header */}
      <header className="bg-[#11241c] text-white py-3.5 sm:py-5 px-4 sm:px-8 sticky top-0 z-30 shadow-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-white/80 hover:text-white transition py-1"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Back to Store</span>
            <span className="sm:hidden text-[11px] font-semibold">Store</span>
          </Link>

          <BrandLogo size="sm" />

          <div className="text-xs text-white/60 hidden sm:block">
            Order Tracker
          </div>
          {/* Mobile spacer to ensure BrandLogo stays centered */}
          <div className="w-8 sm:hidden" />
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Page Title */}
        <div className="text-center mb-6 sm:mb-8">
          <p className="text-[10px] uppercase tracking-[0.22em] text-[#11241c]/55 font-semibold">
            REAL-TIME TRACKING
          </p>
          <h1 className="font-editorial text-3xl sm:text-4xl md:text-5xl text-[#11241c] mt-1">
            Track your order.
          </h1>
          <p className="text-xs sm:text-sm text-[#11241c]/65 mt-2 max-w-md mx-auto leading-relaxed px-2">
            Enter your Order ID (e.g. <span className="font-mono font-semibold text-[#11241c]">BG-25XXXXXX</span>) or the Mobile Number used at checkout.
          </p>
        </div>

        {/* Search Form - Mobile Responsive */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch(query);
          }}
          className="bg-white p-2 sm:p-2.5 rounded-2xl sm:rounded-full border border-[#d7ded8] shadow-xs mb-8 flex flex-col sm:flex-row gap-2 transition focus-within:border-[#11241c]/40"
        >
          <div className="relative flex-1 flex items-center">
            <Search className="w-4 h-4 text-[#11241c]/40 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Order ID (BG-...) or Phone (01XXXXXXXXX)"
              className="w-full pl-10 pr-3 py-2.5 sm:py-3 text-xs sm:text-sm bg-transparent focus:outline-none placeholder:text-[#11241c]/40"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="w-full sm:w-auto px-6 py-3 rounded-xl sm:rounded-full bg-[#11241c] text-white text-xs uppercase tracking-widest font-semibold flex items-center justify-center gap-2 hover:bg-[#1a3529] transition cursor-pointer disabled:opacity-50 shrink-0"
          >
            <Search className="w-3.5 h-3.5" />
            <span>{loading ? 'Searching...' : 'Track'}</span>
          </button>
        </form>

        {/* Error Notice */}
        {error && (
          <div className="p-5 rounded-2xl bg-white border border-red-200 text-center shadow-xs mb-6">
            <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-red-50 text-red-600 mb-2">
              <AlertCircle className="w-5 h-5" />
            </div>
            <p className="text-sm font-semibold text-red-700">{error}</p>
            <p className="text-xs text-[#11241c]/60 mt-1">
              Please verify your Order Number or phone number and try again.
            </p>
          </div>
        )}

        {/* Empty State before searching */}
        {!orders.length && !loading && !error && !searched && (
          <div className="text-center py-12 px-4 rounded-3xl bg-white/60 border border-[#d7ded8] border-dashed">
            <div className="w-12 h-12 rounded-full bg-[#11241c]/5 flex items-center justify-center mx-auto mb-3 text-[#11241c]/50">
              <Package className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-[#11241c]">Looking for an order?</p>
            <p className="text-xs text-[#11241c]/60 mt-1 max-w-xs mx-auto">
              Enter your Order Number or 11-digit phone number above to see current delivery updates.
            </p>
          </div>
        )}

        {/* Orders Results */}
        <div className="space-y-6">
          {orders.map((order) => {
            const isCancelled = order.orderStatus === 'Cancelled';
            const stepIndex = STATUS_PROGRESS[order.orderStatus] ?? 0;

            return (
              <div
                key={order._id}
                className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-7 border border-[#d7ded8] shadow-xs space-y-5 overflow-hidden"
              >
                {/* Order Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#ebf0ec]">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-[#11241c]/50 font-semibold block">
                      Order Reference
                    </span>
                    <h3 className="font-mono text-base sm:text-lg font-bold text-[#11241c] break-all">
                      {order.orderNumber}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-[#11241c]/60 mt-0.5 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#11241c]/40 shrink-0" />
                      <span>
                        Placed on{' '}
                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                        order.orderStatus === 'Delivered'
                          ? 'bg-emerald-700 text-white'
                          : isCancelled
                          ? 'bg-red-700 text-white'
                          : 'bg-[#11241c] text-white'
                      }`}
                    >
                      <Truck className="w-3.5 h-3.5 shrink-0" />
                      <span>{order.orderStatus}</span>
                    </span>

                    <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#ebf0ec] text-[#11241c] truncate max-w-full">
                      {order.paymentStatus} ({order.paymentMethod})
                    </span>
                  </div>
                </div>

                {/* Visual Status Tracker Progress Stepper */}
                {isCancelled ? (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>This order has been cancelled. Please contact customer support for further assistance.</span>
                  </div>
                ) : (
                  <div className="py-2 px-1 sm:px-2">
                    <div className="relative flex items-center justify-between">
                      {/* Background Bar */}
                      <div className="absolute left-0 top-3 sm:top-3.5 -translate-y-1/2 w-full h-1 bg-[#ebf0ec] rounded-full z-0" />
                      {/* Active Progress Bar */}
                      <div
                        className="absolute left-0 top-3 sm:top-3.5 -translate-y-1/2 h-1 bg-[#11241c] rounded-full z-0 transition-all duration-500"
                        style={{
                          width: `${Math.min(100, Math.max(0, (stepIndex / 4) * 100))}%`,
                        }}
                      />

                      {ORDER_STEPS.map((s, idx) => {
                        const isDone = idx <= stepIndex;
                        const isCurrent = idx === stepIndex;
                        return (
                          <div key={s.key} className="relative z-10 flex flex-col items-center">
                            <div
                              className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                                isDone
                                  ? 'bg-[#11241c] text-white shadow-xs'
                                  : 'bg-[#ebf0ec] text-[#11241c]/40'
                              } ${isCurrent ? 'ring-2 sm:ring-3 ring-[#11241c]/25' : ''}`}
                            >
                              {isDone ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#e5c158]" />
                              ) : (
                                idx + 1
                              )}
                            </div>
                            <span
                              className={`text-[9px] sm:text-[11px] mt-1.5 transition-colors text-center ${
                                isCurrent
                                  ? 'font-bold text-[#11241c]'
                                  : isDone
                                  ? 'font-medium text-[#11241c]/80'
                                  : 'text-[#11241c]/40'
                              }`}
                            >
                              {s.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Items List */}
                <div className="space-y-3 pt-2">
                  <span className="text-[10px] uppercase tracking-widest text-[#11241c]/50 font-semibold block">
                    Ordered Items ({order.items.length})
                  </span>
                  <div className="divide-y divide-[#f4f3ee]">
                    {order.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-start sm:items-center justify-between gap-3 text-xs py-2.5 first:pt-0 last:pb-0"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.title}
                              className="w-12 h-14 rounded-lg object-cover shrink-0 border border-[#ebf0ec]"
                            />
                          ) : (
                            <div className="w-12 h-14 rounded-lg bg-[#ebf0ec] flex items-center justify-center text-xs text-[#11241c]/40 shrink-0">
                              <Package className="w-5 h-5" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-xs sm:text-sm text-[#11241c] truncate">
                              {item.title}
                            </p>
                            <p className="text-[#11241c]/60 text-[11px] sm:text-xs mt-0.5">
                              Size: <span className="font-medium text-[#11241c]">{item.size}</span>
                              {item.color && item.color !== 'Default' && (
                                <> · Color: <span className="font-medium text-[#11241c]">{item.color}</span></>
                              )}
                              {' '}· Qty: <span className="font-medium text-[#11241c]">{item.quantity}</span>
                            </p>
                            <p className="text-[#11241c]/50 text-[10px] mt-0.5 sm:hidden font-mono">
                              {formatBDT(item.price)} each
                            </p>
                          </div>
                        </div>
                        <span className="font-bold text-xs sm:text-sm text-[#11241c] shrink-0 font-mono text-right pl-2">
                          {formatBDT(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delivery & Pricing Summary */}
                <div className="pt-4 border-t border-[#ebf0ec] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="text-[#11241c]/70 text-[11px] sm:text-xs flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-[#11241c]/40 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[#11241c]/50 uppercase tracking-wider text-[9px] block font-semibold">
                        Delivery Destination
                      </span>
                      <span className="font-medium text-[#11241c] block mt-0.5 break-words">
                        {order.shippingAddress.address}, {order.shippingAddress.city}
                        {order.shippingAddress.area ? ` (${order.shippingAddress.area})` : ''}
                      </span>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center pt-2 sm:pt-0 border-t sm:border-t-0 border-[#f4f3ee]">
                    <span className="text-xs text-[#11241c]/60 sm:text-[11px] uppercase tracking-wider">
                      Total Order Amount
                    </span>
                    <span className="text-base sm:text-lg font-bold font-mono text-[#11241c]">
                      {formatBDT(order.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f4f3ee] flex items-center justify-center text-sm font-medium text-[#11241c]/60">
          Loading tracker...
        </div>
      }
    >
      <TrackOrderContent />
    </Suspense>
  );
}
