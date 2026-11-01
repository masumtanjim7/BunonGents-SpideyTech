'use client';

import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, Check, ShieldCheck, Truck, Sparkles } from 'lucide-react';
import { Product, formatBDT } from '@/lib/api';
import { useCart } from '@/context/CartContext';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
}

export default function ProductModal({ product, onClose }: ProductModalProps) {
  const { addToCart } = useCart();
  const [selectedSize, setSelectedSize] = useState<string>('L');
  const [selectedColor, setSelectedColor] = useState<string>('Default');
  const [quantity, setQuantity] = useState<number>(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (product) {
      setSelectedSize(product.sizes?.[0] || 'L');
      setSelectedColor(product.colors?.[0] || 'Default');
      setQuantity(1);
      setAdded(false);
    }
  }, [product]);

  if (!product) return null;

  const handleAdd = () => {
    addToCart(product, selectedSize, selectedColor, quantity);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
      />

      <div className="relative z-10 w-full max-w-3xl rounded-3xl bg-[#f4f3ee] text-[#11241c] shadow-2xl overflow-hidden border border-[#d7ded8] grid grid-cols-1 md:grid-cols-2">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-white/90 text-[#11241c] flex items-center justify-center shadow-md hover:bg-white transition cursor-pointer"
          aria-label="Close product modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Product Image */}
        <div className="relative bg-[#dfe6e1] min-h-[340px] md:min-h-[480px]">
          <img
            src={product.image}
            alt={product.title}
            className="w-full h-full object-cover"
          />
          {product.badge && (
            <span className="absolute top-4 left-4 px-3 py-1 rounded-md bg-[#f4f3ee]/95 text-[#11241c] text-[10px] font-semibold uppercase tracking-widest shadow-xs">
              {product.badge}
            </span>
          )}
        </div>

        {/* Details */}
        <div className="p-6 sm:p-8 flex flex-col justify-between bg-[#f4f3ee]">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#11241c]/50 font-semibold">
              {product.category}
            </p>
            <h2 className="font-editorial text-3xl sm:text-4xl text-[#11241c] mt-1">
              {product.title}
            </h2>

            <div className="flex items-baseline gap-3 mt-3">
              <span className="text-2xl font-bold text-[#11241c]">
                {formatBDT(product.price)}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-sm text-[#11241c]/40 line-through">
                  {formatBDT(product.originalPrice)}
                </span>
              )}
              <span className="ml-auto text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-emerald-900/10 text-emerald-900">
                {product.inStock ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>

            <p className="text-sm text-[#11241c]/75 leading-relaxed mt-4">
              {product.description ||
                'Thoughtfully tailored everyday piece crafted with breathable premium fabric for effortless daily wear.'}
            </p>

            {/* Sizes */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="mt-5">
                <label className="block text-[11px] uppercase tracking-widest font-semibold text-[#11241c]/70 mb-2">
                  Select Size
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition cursor-pointer border ${
                        selectedSize === size
                          ? 'bg-[#11241c] text-[#f4f3ee] border-[#11241c]'
                          : 'bg-white text-[#11241c] border-[#d7ded8] hover:border-[#11241c]'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Colors */}
            {product.colors && product.colors.length > 0 && (
              <div className="mt-4">
                <label className="block text-[11px] uppercase tracking-widest font-semibold text-[#11241c]/70 mb-2">
                  Color / Finish
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition cursor-pointer border ${
                        selectedColor === color
                          ? 'bg-[#11241c] text-[#f4f3ee] border-[#11241c]'
                          : 'bg-white text-[#11241c] border-[#d7ded8] hover:border-[#11241c]'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {product.fabricAndCare && (
              <div className="mt-5 p-3 rounded-xl bg-[#ebf0ec] border border-[#d7ded8] text-xs text-[#11241c]/75 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-[#11241c] shrink-0 mt-0.5" />
                <span>{product.fabricAndCare}</span>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-[#d7ded8] space-y-3">
            <button
              onClick={handleAdd}
              disabled={!product.inStock}
              className="w-full py-3.5 px-6 rounded-xl bg-[#11241c] text-[#f4f3ee] text-xs uppercase tracking-widest font-semibold flex items-center justify-center gap-2 hover:bg-[#1b362a] transition disabled:opacity-50 cursor-pointer"
            >
              {added ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Added to Bag</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add to Bag · {formatBDT(product.price * quantity)}</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-between text-[11px] text-[#11241c]/60 pt-1">
              <span className="flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5" /> Fast Delivery across Bangladesh
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> COD / bKash / Nagad
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
