'use client';

import React from 'react';
import Link from 'next/link';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

export default function BrandLogo({
  size = 'md',
  showTagline = false,
}: BrandLogoProps) {
  const imgSize =
    size === 'sm'
      ? 'w-7 h-7'
      : size === 'lg'
      ? 'w-11 h-11'
      : 'w-8 h-8 sm:w-9 sm:h-9';

  const textSize =
    size === 'sm'
      ? 'text-lg'
      : size === 'lg'
      ? 'text-2xl sm:text-3xl'
      : 'text-xl sm:text-2xl';

  return (
    <Link href="/" className="inline-flex items-center gap-2.5 group">
      <div
        className={`${imgSize} rounded-lg overflow-hidden border border-[#e8e3d5]/25 bg-black p-1 shrink-0 shadow-xs flex items-center justify-center group-hover:border-[#e8e3d5]/60 transition`}
      >
        <img
          src="/b-logo.jpg"
          alt="Bunon Gents Logo"
          className="w-full h-full object-contain"
        />
      </div>
      <div className="flex flex-col leading-none">
        <div className="flex items-baseline gap-1.5">
          <span
            className={`font-editorial ${textSize} font-bold tracking-[0.14em] text-white`}
          >
            BUNON
          </span>
          <span
            className={`font-editorial italic ${textSize} font-normal text-[#f4f3ee]/90 tracking-wide`}
          >
            Gents
          </span>
        </div>
        {showTagline && (
          <span className="text-[8px] uppercase tracking-[0.26em] text-white/55 mt-0.5">
            CLOTHES FOR MODERN MEN
          </span>
        )}
      </div>
    </Link>
  );
}
