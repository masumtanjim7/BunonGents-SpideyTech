'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { API_URL, SiteSettings } from '@/lib/api';

function formatWhatsAppNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  // Convert Bangladesh local 01XXXXXXXXX (11 digits) to 8801XXXXXXXXX
  if (digits.length === 11 && digits.startsWith('01')) {
    return '88' + digits;
  }
  return digits;
}

export default function WhatsAppButton() {
  const pathname = usePathname();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchSettings() {
      try {
        const res = await fetch(`${API_URL}/settings`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setSettings(data);
        }
      } catch {
        // Fallback default
        if (isMounted) {
          setSettings({
            siteName: 'Bunon Gents',
            topAnnouncement: '',
            heroSubtitle: '',
            heroTitleLine1: '',
            heroTitleLine2: '',
            heroDescription: '',
            heroImage: '',
            winterBannerSubtitle: '',
            winterBannerTitle1: '',
            winterBannerTitle2: '',
            winterBannerDesc: '',
            winterBannerImage: '',
            bkashNumber: '',
            bkashActive: true,
            nagadNumber: '',
            nagadActive: true,
            codActive: true,
            paymentInstructions: '',
            insideDhakaShipping: 70,
            outsideDhakaShipping: 130,
            contactEmail: '',
            contactPhone: '+8801700000000',
            categories: [],
            whatsappNumber: '+880 1700-000000',
            whatsappActive: true,
            whatsappMessage:
              'Hello Bunon Gents! I would like to inquire about your collection.',
          });
        }
      }
    }
    fetchSettings();
    return () => {
      isMounted = false;
    };
  }, []);

  // Do not show WhatsApp widget inside admin dashboard
  if (pathname && pathname.startsWith('/admin')) {
    return null;
  }

  // Do not show if disabled in settings
  if (settings && settings.whatsappActive === false) {
    return null;
  }

  const rawNumber = settings?.whatsappNumber || '+880 1700-000000';
  const cleanNumber = formatWhatsAppNumber(rawNumber);
  if (!cleanNumber) return null;

  const defaultMsg =
    settings?.whatsappMessage ||
    'Hello Bunon Gents! I would like to inquire about your collection.';
  const waUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(
    defaultMsg
  )}`;

  return (
    <div
      className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 flex items-center group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Floating Tooltip / Message pill */}
      <div
        className={`hidden sm:flex items-center gap-2 mr-3 px-3.5 py-1.5 rounded-full bg-white text-[#11241c] text-xs font-semibold shadow-lg border border-[#d7ded8] transition-all duration-300 pointer-events-none ${
          hovered
            ? 'opacity-100 translate-x-0'
            : 'opacity-0 translate-x-2'
        }`}
      >
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>Chat with us</span>
      </div>

      {/* WhatsApp Button */}
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with Bunon Gents on WhatsApp"
        className="relative w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white flex items-center justify-center shadow-lg hover:shadow-xl shadow-emerald-950/25 transition-all duration-300 transform hover:scale-110 active:scale-95 group cursor-pointer"
      >
        {/* Pulse ring */}
        <span className="absolute -inset-1 rounded-full bg-[#25D366]/30 animate-ping pointer-events-none group-hover:hidden" />

        {/* WhatsApp Icon */}
        <svg
          className="w-7 h-7 sm:w-8 sm:h-8 fill-current drop-shadow-xs"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>

        {/* Small active badge dot */}
        <span className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-300 border-2 border-white" />
      </a>
    </div>
  );
}
