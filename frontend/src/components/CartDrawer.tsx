'use client';

import React from 'react';
import Link from 'next/link';
import { X, Plus, Minus, ShoppingBag, ArrowRight, Trash2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatBDT } from '@/lib/api';

export default function CartDrawer() {
  const {
    items,
    isOpen,
    closeCart,
    removeFromCart,
    updateQuantity,
    subtotal,
    totalItems,
  } = useCart();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={closeCart}
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md bg-[#f4f3ee] text-[#11241c] shadow-2xl flex flex-col justify-between border-l border-[#d7ded8]">
          {/* Header */}
          <div className="px-6 py-5 border-b border-[#d7ded8] flex items-center justify-between bg-[#11241c] text-[#f4f3ee]">
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-5 h-5 text-[#d4af37]" />
              <div>
                <h2 className="font-editorial text-2xl tracking-wide">Your Bag</h2>
                <p className="text-[11px] uppercase tracking-widest text-white/60">
                  {totalItems} {totalItems === 1 ? 'piece' : 'pieces'} selected
                </p>
              </div>
            </div>
            <button
              onClick={closeCart}
              className="p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close bag"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Items list */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-16">
                <div className="w-16 h-16 rounded-full bg-[#e4ebe6] flex items-center justify-center mb-4">
                  <ShoppingBag className="w-7 h-7 text-[#172e24]/50" />
                </div>
                <h3 className="font-editorial text-2xl text-[#11241c] mb-1">
                  Your bag is empty
                </h3>
                <p className="text-sm text-[#11241c]/60 max-w-xs mb-6">
                  Explore our everyday essentials and add pieces that feel like you.
                </p>
                <button
                  onClick={closeCart}
                  className="px-6 py-3 rounded-lg bg-[#11241c] text-[#f4f3ee] text-xs uppercase tracking-widest font-medium hover:bg-[#172e24] transition cursor-pointer"
                >
                  Explore Collection
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.key}
                  className="flex gap-4 p-3.5 rounded-2xl bg-white border border-[#dfe6e1] shadow-xs"
                >
                  <div className="w-20 h-24 rounded-xl overflow-hidden bg-[#ebf0ec] shrink-0">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-editorial text-lg font-semibold leading-tight text-[#11241c]">
                          {item.title}
                        </h4>
                        <button
                          onClick={() => removeFromCart(item.key)}
                          className="text-[#11241c]/40 hover:text-red-600 transition p-1 cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-[#11241c]/60 mt-0.5">
                        Size: <span className="font-medium text-[#11241c]">{item.size}</span> ·{' '}
                        <span>{item.color}</span>
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className="inline-flex items-center border border-[#d7ded8] rounded-full bg-[#f4f3ee]">
                        <button
                          onClick={() => updateQuantity(item.key, item.quantity - 1)}
                          className="p-1.5 hover:bg-black/5 rounded-l-full cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 text-xs font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.key, item.quantity + 1)}
                          className="p-1.5 hover:bg-black/5 rounded-r-full cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="text-sm font-bold text-[#11241c]">
                        {formatBDT(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="p-6 border-t border-[#d7ded8] bg-white space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-[#11241c]/60">
                  <span>Subtotal</span>
                  <span>{formatBDT(subtotal)}</span>
                </div>
                <div className="flex justify-between text-xs text-[#11241c]/60">
                  <span>Shipping</span>
                  <span>Calculated at checkout</span>
                </div>
                <div className="flex justify-between text-base font-bold text-[#11241c] pt-2 border-t border-[#ebf0ec]">
                  <span>Estimated Total</span>
                  <span>{formatBDT(subtotal)}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="w-full py-3.5 px-6 rounded-xl bg-[#11241c] text-[#f4f3ee] text-xs font-semibold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#1a3529] transition shadow-md"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <p className="text-[11px] text-center text-[#11241c]/50">
                Cash on Delivery (COD), bKash & Nagad supported nationwide
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
