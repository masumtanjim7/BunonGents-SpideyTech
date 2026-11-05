'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  ShoppingBag,
  Check,
  ShieldCheck,
  Truck,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
} from 'lucide-react';
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
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const allImages = useMemo(() => {
    if (!product) return [];
    const list = [product.image, ...(product.gallery || [])].filter(Boolean);
    return Array.from(new Set(list));
  }, [product]);

  useEffect(() => {
    if (product) {
      document.body.style.overflow = 'hidden';
      setSelectedSize(product.sizes?.[0] || 'L');
      setSelectedColor(product.colors?.[0] || 'Default');
      setQuantity(1);
      setAdded(false);
      setActiveImageIndex(0);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [product]);

  if (!product) return null;

  const currentImage = allImages[activeImageIndex] || product.image;

  const handlePrevImage = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : allImages.length - 1));
  };

  const handleNextImage = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActiveImageIndex((prev) => (prev < allImages.length - 1 ? prev + 1 : 0));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (diff > 45) {
      handleNextImage();
    } else if (diff < -45) {
      handlePrevImage();
    }
    setTouchStartX(null);
  };

  const handleAdd = () => {
    addToCart(product, selectedSize, selectedColor, quantity);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 md:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
      />

      {/* Modal Dialog Card */}
      <div className="relative z-10 w-full max-w-3xl rounded-2xl sm:rounded-3xl bg-[#f4f3ee] text-[#11241c] shadow-2xl overflow-hidden border border-[#d7ded8] flex flex-col md:grid md:grid-cols-2 max-h-[92vh] sm:max-h-[88vh]">
        {/* Floating Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-30 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/90 hover:bg-white text-[#11241c] flex items-center justify-center shadow-lg transition cursor-pointer backdrop-blur-md border border-black/5"
          aria-label="Close product modal"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Product Image & Gallery Thumbnails */}
        <div
          className="relative bg-[#dfe6e1] shrink-0 h-64 sm:h-72 md:h-full md:min-h-[480px] flex flex-col justify-between group overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="relative flex-1 overflow-hidden">
            <img
              src={currentImage}
              alt={product.title}
              className="w-full h-full object-cover transition-all duration-300"
            />

            {product.badge && (
              <span className="absolute top-3.5 left-3.5 sm:top-4 sm:left-4 px-2.5 py-1 rounded-md bg-[#f4f3ee]/95 text-[#11241c] text-[10px] font-semibold uppercase tracking-widest shadow-xs">
                {product.badge}
              </span>
            )}

            {/* Navigation Arrows (Visible on mobile, hover-only on desktop) */}
            {allImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => handlePrevImage(e)}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/75 text-white flex items-center justify-center backdrop-blur-xs transition opacity-90 md:opacity-0 md:group-hover:opacity-100 cursor-pointer z-20"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={(e) => handleNextImage(e)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/75 text-white flex items-center justify-center backdrop-blur-xs transition opacity-90 md:opacity-0 md:group-hover:opacity-100 cursor-pointer z-20"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Mobile image pagination dots */}
                <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 md:hidden z-20 bg-black/35 backdrop-blur-xs px-2.5 py-1 rounded-full pointer-events-none">
                  {allImages.map((_, idx) => (
                    <span
                      key={idx}
                      className={`h-1.5 rounded-full transition-all ${
                        activeImageIndex === idx
                          ? 'bg-white w-3.5'
                          : 'bg-white/50 w-1.5'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Multiple Image Thumbnails */}
          {allImages.length > 1 && (
            <div className="p-2 sm:p-2.5 bg-white/80 backdrop-blur-md flex items-center gap-2 overflow-x-auto border-t border-black/5 scrollbar-none">
              {allImages.map((imgUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative w-10 h-12 sm:w-12 sm:h-14 rounded-lg overflow-hidden border-2 transition shrink-0 cursor-pointer ${
                    activeImageIndex === idx
                      ? 'border-[#11241c] scale-105 shadow-xs'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={imgUrl}
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Scrollable Details Column */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 md:p-8 flex flex-col justify-between bg-[#f4f3ee]">
          <div>
            <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-[#11241c]/50 font-semibold">
              {product.category}
            </p>
            <h2 className="font-editorial text-2xl sm:text-3xl md:text-4xl text-[#11241c] mt-0.5 leading-tight">
              {product.title}
            </h2>

            <div className="flex items-baseline gap-2.5 sm:gap-3 mt-2.5 sm:mt-3">
              <span className="text-xl sm:text-2xl font-bold font-mono text-[#11241c]">
                {formatBDT(product.price)}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-xs sm:text-sm text-[#11241c]/40 line-through font-mono">
                  {formatBDT(product.originalPrice)}
                </span>
              )}
              <span
                className={`ml-auto text-[10px] sm:text-[11px] font-medium px-2.5 py-0.5 rounded-full ${
                  product.inStock
                    ? 'bg-emerald-900/10 text-emerald-900'
                    : 'bg-red-900/10 text-red-800'
                }`}
              >
                {product.inStock ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-[#11241c]/75 leading-relaxed mt-3 sm:mt-4">
              {product.description ||
                'Thoughtfully tailored everyday piece crafted with breathable premium fabric for effortless daily wear.'}
            </p>

            {/* Sizes */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="mt-4 sm:mt-5">
                <label className="block text-[10px] sm:text-[11px] uppercase tracking-widest font-semibold text-[#11241c]/70 mb-2">
                  Select Size
                </label>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-xs font-medium transition cursor-pointer border ${
                        selectedSize === size
                          ? 'bg-[#11241c] text-[#f4f3ee] border-[#11241c] shadow-xs'
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
              <div className="mt-3.5 sm:mt-4">
                <label className="block text-[10px] sm:text-[11px] uppercase tracking-widest font-semibold text-[#11241c]/70 mb-2">
                  Color / Finish
                </label>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-xs font-medium transition cursor-pointer border ${
                        selectedColor === color
                          ? 'bg-[#11241c] text-[#f4f3ee] border-[#11241c] shadow-xs'
                          : 'bg-white text-[#11241c] border-[#d7ded8] hover:border-[#11241c]'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Fabric & Care */}
            {product.fabricAndCare && (
              <div className="mt-4 p-2.5 sm:p-3 rounded-xl bg-[#ebf0ec] border border-[#d7ded8] text-[11px] sm:text-xs text-[#11241c]/75 flex items-start gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#11241c] shrink-0 mt-0.5" />
                <span className="leading-snug">{product.fabricAndCare}</span>
              </div>
            )}
          </div>

          {/* Action Row: Quantity & Add to Bag */}
          <div className="mt-5 sm:mt-6 pt-4 border-t border-[#d7ded8] space-y-3">
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Quantity Counter */}
              <div className="inline-flex items-center rounded-xl border border-[#d7ded8] bg-white p-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-[#11241c] hover:bg-[#ebf0ec] disabled:opacity-30 transition cursor-pointer"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
                <span className="w-7 sm:w-8 text-center text-xs sm:text-sm font-bold font-mono">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                  disabled={quantity >= 10}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-[#11241c] hover:bg-[#ebf0ec] disabled:opacity-30 transition cursor-pointer"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
              </div>

              {/* Add to Bag Button */}
              <button
                onClick={handleAdd}
                disabled={!product.inStock}
                className="flex-1 py-3 sm:py-3.5 px-4 rounded-xl bg-[#11241c] text-[#f4f3ee] text-xs uppercase tracking-widest font-semibold flex items-center justify-center gap-2 hover:bg-[#1b362a] transition disabled:opacity-50 cursor-pointer shadow-md"
              >
                {added ? (
                  <>
                    <Check className="w-4 h-4 text-[#e5c158]" />
                    <span>Added to Bag</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>Add · {formatBDT(product.price * quantity)}</span>
                  </>
                )}
              </button>
            </div>

            {/* Delivery & Payment Assurance badges */}
            <div className="flex flex-col xs:flex-row items-center justify-between gap-1 text-[10px] sm:text-[11px] text-[#11241c]/60 pt-1">
              <span className="flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-emerald-800 shrink-0" />
                <span>Fast Delivery Across Bangladesh</span>
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-800 shrink-0" />
                <span>COD / bKash / Nagad</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
