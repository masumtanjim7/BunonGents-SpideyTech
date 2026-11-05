import type { Metadata } from 'next';
import { Cormorant_Garamond, Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import CartDrawer from '@/components/CartDrawer';
import AuthModal from '@/components/AuthModal';
import WhatsAppButton from '@/components/WhatsAppButton';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Bunon Gents | Clothes For Modern Men',
  description:
    "Thoughtful pieces for the moments that make up your life. Discover the men's collection—easy to wear, made to stand out.",
  icons: {
    icon: '/b-logo.jpg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${cormorant.variable} ${inter.variable}`}>
      <body className="antialiased selection:bg-[#172e24] selection:text-[#f4f3ee]">
        <AuthProvider>
          <CartProvider>
            {children}
            <CartDrawer />
            <AuthModal />
            <WhatsAppButton />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
