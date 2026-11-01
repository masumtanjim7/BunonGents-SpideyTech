'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Search, Package, Clock, CheckCircle2, Truck } from 'lucide-react';
import { API_URL, Order, formatBDT } from '@/lib/api';
import BrandLogo from '@/components/BrandLogo';

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (searchVal: string) => {
    if (!searchVal.trim()) return;
    setLoading(true);
    setError('');
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
      setError('Unable to reach server. Please try again.');
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
    <div className="min-h-screen bg-[#f4f3ee] text-[#11241c]">
      <header className="bg-[#11241c] text-white py-5 px-4 sm:px-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-white/80 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Store</span>
          </Link>

          <BrandLogo size="sm" />

          <div className="text-xs text-white/60 hidden sm:block">
            Order Tracker
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-8 py-12">
        <div className="text-center mb-8">
          <p className="text-[10px] uppercase tracking-[0.22em] text-[#11241c]/55 font-semibold">
            REAL-TIME STATUS
          </p>
          <h1 className="font-editorial text-4xl sm:text-5xl text-[#11241c] mt-1">
            Track your order.
          </h1>
          <p className="text-xs sm:text-sm text-[#11241c]/65 mt-2">
            Enter your Order Number (e.g. BG-25XXXXXX) or Mobile Number used at
            checkout.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch(query);
          }}
          className="flex gap-2 bg-white p-2 rounded-2xl border border-[#d7ded8] shadow-xs mb-8"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter Order ID (BG-...) or Phone Number (01XXXXXXXXX)"
            className="flex-1 px-4 py-3 text-sm bg-transparent focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-[#11241c] text-white text-xs uppercase tracking-widest font-semibold flex items-center gap-2 hover:bg-[#1a3529] transition cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span>{loading ? 'Searching...' : 'Track'}</span>
          </button>
        </form>

        {error && (
          <div className="p-6 rounded-2xl bg-white border border-[#d7ded8] text-center text-sm text-[#11241c]/70">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {orders.map((order) => (
            <div
              key={order._id}
              className="bg-white rounded-3xl p-6 sm:p-8 border border-[#d7ded8] shadow-xs space-y-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#ebf0ec]">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-[#11241c]/50 font-semibold">
                    Order Number
                  </span>
                  <h3 className="font-mono text-lg font-bold text-[#11241c]">
                    {order.orderNumber}
                  </h3>
                  <p className="text-xs text-[#11241c]/60">
                    Placed on {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#11241c] text-white flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5" />
                    {order.orderStatus}
                  </span>
                  <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#ebf0ec] text-[#11241c]">
                    Payment: {order.paymentStatus} ({order.paymentMethod})
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {order.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs py-1.5"
                  >
                    <div className="flex items-center gap-3">
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-10 h-12 rounded-lg object-cover"
                        />
                      )}
                      <div>
                        <p className="font-semibold text-sm">{item.title}</p>
                        <p className="text-[#11241c]/60">
                          Size: {item.size} · {item.color} × {item.quantity}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold">
                      {formatBDT(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-[#ebf0ec] flex flex-wrap items-center justify-between gap-4 text-xs">
                <div className="text-[#11241c]/70">
                  Delivering to:{' '}
                  <span className="font-medium text-[#11241c]">
                    {order.shippingAddress.address}, {order.shippingAddress.city}
                  </span>
                </div>
                <div className="text-sm font-bold">
                  Total: {formatBDT(order.totalAmount)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f4f3ee] flex items-center justify-center text-sm">
          Loading tracker...
        </div>
      }
    >
      <TrackOrderContent />
    </Suspense>
  );
}
