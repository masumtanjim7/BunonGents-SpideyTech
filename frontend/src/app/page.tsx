'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  ArrowUpRight,
  ArrowDown,
  Plus,
  Sparkles,
  Shirt,
  Layers,
  Search,
  User,
} from 'lucide-react';
import {
  API_URL,
  Product,
  CollectionItem,
  SiteSettings,
  formatBDT,
} from '@/lib/api';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import ProductModal from '@/components/ProductModal';
import BrandLogo from '@/components/BrandLogo';

const FALLBACK_SETTINGS: SiteSettings = {
  siteName: 'Bunon Gents',
  topAnnouncement:
    "THE MEN'S COLLECTION IS HERE  ·  DISCOVER YOUR NEXT EVERYDAY FAVORITE",
  heroSubtitle: 'A NEW WAY TO WEAR EVERYDAY',
  heroTitleLine1: 'Wear what',
  heroTitleLine2: 'feels like you.',
  heroDescription:
    "Thoughtful pieces for the moments that make up your life. Discover the men's collection—easy to wear, made to stand out.",
  heroImage:
    'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?q=80&w=1800&auto=format&fit=crop',
  winterBannerSubtitle: 'THE WINTER COLLECTION',
  winterBannerTitle1: 'Cold weather.',
  winterBannerTitle2: 'Good style.',
  winterBannerDesc:
    'Layers that bring warmth and character to every day of the season.',
  winterBannerImage:
    'https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=1600&auto=format&fit=crop',
  bkashNumber: '01700-000000',
  bkashActive: true,
  nagadNumber: '01800-000000',
  nagadActive: true,
  codActive: true,
  paymentInstructions: '',
  insideDhakaShipping: 70,
  outsideDhakaShipping: 130,
  contactEmail: 'support@example.com',
  contactPhone: '+880 1700-000000',
  categories: ['Jeans', 'Shirts', 'T-shirts', 'Sweaters', 'Winter collection'],
};

const FALLBACK_COLLECTIONS: CollectionItem[] = [
  {
    _id: '1',
    numberLabel: '01 / AVAILABLE NOW',
    title: 'Men',
    slug: 'men',
    subtitle: 'EXPLORE THE COLLECTION →',
    status: 'AVAILABLE NOW',
    image:
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=1000&auto=format&fit=crop',
    order: 1,
  },
  {
    _id: '2',
    numberLabel: '02 / IN THE MAKING',
    title: 'Women',
    slug: 'women',
    subtitle: 'SOMETHING BEAUTIFUL IS ON ITS WAY',
    status: 'COMING SOON',
    image: '',
    order: 2,
  },
  {
    _id: '3',
    numberLabel: '03 / IN THE MAKING',
    title: 'Kids',
    slug: 'kids',
    subtitle: 'LITTLE LOOKS, COMING SOON',
    status: 'COMING SOON',
    image: '',
    order: 3,
  },
];

const FALLBACK_PRODUCTS: Product[] = [
  {
    _id: 'p1',
    title: 'Everyday Denim',
    slug: 'everyday-denim',
    category: 'Jeans',
    badge: 'EVERYDAY ESSENTIAL',
    price: 2250,
    originalPrice: 2650,
    description:
      'Crafted from durable mid-weight selvedge-inspired denim with subtle stretch for all-day movement.',
    fabricAndCare: '98% Organic Cotton, 2% Elastane.',
    image:
      'https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=1000&auto=format&fit=crop',
    gallery: [],
    sizes: ['30', '32', '34', '36', '38'],
    colors: ['Indigo Wash', 'Jet Black'],
    stock: 35,
    featured: true,
    inStock: true,
  },
  {
    _id: 'p2',
    title: 'The Classic Shirt',
    slug: 'the-classic-shirt',
    category: 'Shirts',
    badge: 'EASY POLISH',
    price: 1850,
    originalPrice: 2100,
    description:
      'Our signature crisp oxford weave shirt designed to take you from morning meetings to evening dinners.',
    fabricAndCare: '100% Combed Egyptian Cotton.',
    image:
      'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=1000&auto=format&fit=crop',
    gallery: [],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Crisp White', 'Forest Olive'],
    stock: 42,
    featured: true,
    inStock: true,
  },
  {
    _id: 'p3',
    title: 'Relaxed Tee',
    slug: 'relaxed-tee',
    category: 'T-shirts',
    badge: 'WEAR ON REPEAT',
    price: 1150,
    originalPrice: 1390,
    description:
      'Heavyweight 240 GSM jersey t-shirt with a relaxed drop-shoulder cut and ribbed crew neck.',
    fabricAndCare: '100% Ring-Spun Organic Cotton.',
    image:
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop',
    gallery: [],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Deep Forest', 'Charcoal Black'],
    stock: 60,
    featured: true,
    inStock: true,
  },
  {
    _id: 'p4',
    title: 'Weekend Knit',
    slug: 'weekend-knit',
    category: 'Sweaters',
    badge: 'LAYER UP',
    price: 2450,
    originalPrice: 2800,
    description:
      'Textured stripe crew-neck knit crafted for cool evenings and effortless layering.',
    fabricAndCare: '85% Fine Cotton, 15% Merino Wool.',
    image:
      'https://images.unsplash.com/photo-1610652492500-ded49ceeb378?q=80&w=1000&auto=format&fit=crop',
    gallery: [],
    sizes: ['M', 'L', 'XL', 'XXL'],
    colors: ['Espresso Stripe', 'Oatmeal'],
    stock: 22,
    featured: true,
    inStock: true,
  },
  {
    _id: 'p5',
    title: 'Cold Day Coat',
    slug: 'cold-day-coat',
    category: 'Winter collection',
    badge: 'WINTER COLLECTION',
    price: 4200,
    originalPrice: 4950,
    description:
      'Statement tailored herringbone overcoat engineered for warmth and unmistakable presence.',
    fabricAndCare: 'Wool-blend herringbone outer.',
    image:
      'https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=1000&auto=format&fit=crop',
    gallery: [],
    sizes: ['M', 'L', 'XL'],
    colors: ['Herringbone Charcoal'],
    stock: 15,
    featured: true,
    inStock: true,
  },
];

export default function HomePage() {
  const { openCart, addToCart, totalItems } = useCart();
  const { user, openAuthModal } = useAuth();

  const [settings, setSettings] = useState<SiteSettings>(FALLBACK_SETTINGS);
  const [collections, setCollections] =
    useState<CollectionItem[]>(FALLBACK_COLLECTIONS);
  const [products, setProducts] = useState<Product[]>(FALLBACK_PRODUCTS);
  const [activeCategory, setActiveCategory] = useState<string>('All pieces');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    async function loadStoreData() {
      try {
        const [settingsRes, colRes, prodRes] = await Promise.all([
          fetch(`${API_URL}/settings`),
          fetch(`${API_URL}/collections`),
          fetch(`${API_URL}/products`),
        ]);

        if (settingsRes.ok) {
          const s = await settingsRes.json();
          if (s && s.siteName) setSettings(s);
        }
        if (colRes.ok) {
          const c = await colRes.json();
          if (Array.isArray(c) && c.length > 0) setCollections(c);
        }
        if (prodRes.ok) {
          const p = await prodRes.json();
          if (Array.isArray(p) && p.length > 0) setProducts(p);
        }
      } catch {
        // Fallback data already initialized
      }
    }
    loadStoreData();
  }, []);

  const categoryTabs = [
    'All pieces',
    ...(settings.categories?.length
      ? settings.categories
      : ['Jeans', 'Shirts', 'T-shirts', 'Sweaters', 'Winter collection']),
  ];

  const filteredProducts =
    activeCategory === 'All pieces'
      ? products
      : products.filter(
          (p) => p.category.toLowerCase() === activeCategory.toLowerCase()
        );

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f3ee] text-[#11241c]">
      {/* 1. Top Announcement Bar */}
      <div className="w-full bg-[#0d1d16] text-white/80 text-[10px] sm:text-[11px] tracking-[0.22em] uppercase py-2.5 px-4 text-center font-medium border-b border-white/5">
        {settings.topAnnouncement}
      </div>

      {/* 2. Hero Section */}
      <section className="relative w-full min-h-[680px] lg:min-h-[820px] bg-[#132920] text-white overflow-hidden flex flex-col justify-between">
        {/* Background Image & Editorial Dark Forest Gradient Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src={settings.heroImage}
            alt="Bunon Gents Hero"
            className="w-full h-full object-cover object-center opacity-55 scale-105 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0e2219]/95 via-[#132920]/75 to-[#132920]/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0e2219]/90 via-transparent to-[#0e2219]/40" />
        </div>

        {/* Floating Pill Navbar */}
        <header className="relative z-20 max-w-6xl w-full mx-auto px-4 sm:px-8 pt-6">
          <nav className="w-full rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 px-5 sm:px-7 py-3.5 flex items-center justify-between shadow-lg">
            {/* Brand Logo */}
            <BrandLogo size="md" />

            {/* Center Links */}
            <div className="hidden md:flex items-center gap-8 text-xs font-medium tracking-wide text-white/85">
              <a
                href="#collections"
                className="hover:text-white transition-colors"
              >
                Collections
              </a>
              <a
                href="#shop-men"
                className="hover:text-white transition-colors"
              >
                Shop Men
              </a>
              <a
                href="#our-promise"
                className="hover:text-white transition-colors"
              >
                Our Promise
              </a>
              <Link
                href="/track-order"
                className="hover:text-white transition-colors flex items-center gap-1"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Track Order</span>
              </Link>
            </div>

            {/* Right Pill, Account & Cart Icon */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              <a
                href="#shop-men"
                className="hidden lg:inline-flex items-center px-4 py-1.5 rounded-full border border-white/25 bg-white/5 text-[10px] tracking-[0.18em] uppercase text-white/90 hover:bg-white/15 transition"
              >
                MADE FOR THE EVERYDAY
              </a>

              {user ? (
                <Link
                  href="/account"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-white/25 bg-white/10 text-xs font-medium text-white hover:bg-white/20 transition"
                >
                  <User className="w-3.5 h-3.5 text-[#e5c158]" />
                  <span className="max-w-[90px] truncate">
                    {user.name.split(' ')[0]}
                  </span>
                </Link>
              ) : (
                <button
                  onClick={() => openAuthModal('register')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-white/25 bg-white/10 text-xs font-medium text-white hover:bg-white/20 transition cursor-pointer"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Account</span>
                </button>
              )}

              <button
                onClick={openCart}
                className="relative w-10 h-10 rounded-full border border-white/25 bg-white/10 flex items-center justify-center hover:bg-white/20 transition cursor-pointer"
                aria-label="Open shopping bag"
              >
                <ShoppingBag className="w-4 h-4 text-white" />
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#e5c158] text-[#11241c] text-[10px] font-bold flex items-center justify-center shadow-xs">
                  {totalItems}
                </span>
              </button>
            </div>
          </nav>
        </header>

        {/* Hero Main Content */}
        <div className="relative z-10 max-w-6xl w-full mx-auto px-4 sm:px-8 my-auto py-16 lg:py-24">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-5">
              <span className="w-6 h-[1px] bg-white/50" />
              <span className="text-[11px] uppercase tracking-[0.22em] text-white/85 font-semibold">
                {settings.heroSubtitle}
              </span>
            </div>

            <h1 className="font-editorial text-6xl sm:text-7xl lg:text-[88px] leading-[0.96] tracking-tight text-white">
              <span className="block font-medium">
                {settings.heroTitleLine1}
              </span>
              <span className="block italic font-normal text-white/95 mt-1">
                {settings.heroTitleLine2}
              </span>
            </h1>

            <p className="mt-6 text-sm sm:text-base text-white/80 max-w-md leading-relaxed font-light">
              {settings.heroDescription}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href="#shop-men"
                className="inline-flex items-center gap-3 px-6 py-3.5 rounded-lg bg-[#f4f3ee] text-[#11241c] text-[11px] font-semibold uppercase tracking-[0.18em] hover:bg-white transition shadow-lg"
              >
                <span>EXPLORE THE COLLECTION</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Floating Glassmorphic Circular Badge on Right */}
          <div className="hidden md:flex absolute right-8 bottom-12 w-36 h-36 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex-col items-center justify-center text-center p-4 shadow-2xl">
            <Sparkles className="w-5 h-5 text-white/90 mb-1.5" />
            <span className="font-editorial text-lg font-semibold leading-tight text-white">
              New season
            </span>
            <span className="text-[9px] uppercase tracking-[0.18em] text-white/75 mt-1">
              MEN&apos;S ESSENTIALS
            </span>
          </div>
        </div>

        {/* Hero Bottom Bar */}
        <div className="relative z-10 max-w-6xl w-full mx-auto px-4 sm:px-8 pb-6 flex items-center justify-between text-[10px] tracking-[0.2em] uppercase text-white/60">
          <div className="flex items-center gap-4">
            <span className="w-12 h-[1px] bg-white/25 hidden sm:inline-block" />
            <span>BUNON GENTS / 2025</span>
          </div>
          <a
            href="#collections"
            className="inline-flex items-center gap-1.5 hover:text-white transition"
          >
            <span>SCROLL TO EXPLORE</span>
            <ArrowDown className="w-3 h-3" />
          </a>
        </div>
      </section>

      {/* 3. Section 01: Our Collections */}
      <section
        id="collections"
        className="w-full bg-[#f4f3ee] py-20 lg:py-28 px-4 sm:px-8"
      >
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-[#11241c]/55 font-semibold mb-2">
                FIND YOUR FIT / 01
              </p>
              <h2 className="font-editorial text-5xl sm:text-6xl text-[#11241c] tracking-tight">
                Our collections.
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#11241c]/65 max-w-xs leading-relaxed">
              Every collection has a story. Start with the one that&apos;s ready
              to be worn.
            </p>
          </div>

          {/* 3-Column Collection Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {collections.map((col, idx) => {
              const isAvailable = col.status === 'AVAILABLE NOW' || idx === 0;
              return (
                <div
                  key={col._id || idx}
                  onClick={() => {
                    if (isAvailable) {
                      document
                        .getElementById('shop-men')
                        ?.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className={`group relative h-[360px] sm:h-[390px] rounded-2xl overflow-hidden p-7 flex flex-col justify-between transition-all duration-500 ${
                    isAvailable
                      ? 'bg-[#2a3f36] text-white cursor-pointer shadow-md hover:shadow-xl'
                      : 'bg-gradient-to-br from-[#dce3dc] via-[#e8ede7] to-[#d5ddd6] text-[#11241c] border border-[#cfd8d0]'
                  }`}
                >
                  {isAvailable && col.image && (
                    <div className="absolute inset-0 z-0">
                      <img
                        src={col.image}
                        alt={col.title}
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700 opacity-75"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0f221a]/90 via-[#172e24]/45 to-[#172e24]/30" />
                    </div>
                  )}

                  {!isAvailable && (
                    <div className="absolute inset-0 z-0 opacity-50 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.8),_transparent_70%)]" />
                  )}

                  {/* Top Row */}
                  <div className="relative z-10 flex items-center justify-between">
                    <span
                      className={`text-[10px] uppercase tracking-[0.2em] font-semibold ${
                        isAvailable ? 'text-white/85' : 'text-[#11241c]/60'
                      }`}
                    >
                      {col.numberLabel}
                    </span>

                    {isAvailable ? (
                      <span className="w-8 h-8 rounded-full border border-white/30 bg-white/10 backdrop-blur-xs flex items-center justify-center group-hover:bg-white group-hover:text-[#11241c] transition">
                        <ArrowUpRight className="w-4 h-4" />
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full bg-white/80 border border-[#c5d0c7] text-[9px] uppercase tracking-[0.18em] font-semibold text-[#11241c]/70">
                        COMING SOON
                      </span>
                    )}
                  </div>

                  {/* Bottom Row */}
                  <div className="relative z-10">
                    <h3
                      className={`font-editorial text-4xl sm:text-5xl mb-2 ${
                        isAvailable ? 'text-white' : 'text-[#11241c]/85'
                      }`}
                    >
                      {col.title}
                    </h3>
                    <p
                      className={`text-[10px] uppercase tracking-[0.2em] font-semibold ${
                        isAvailable ? 'text-white/85' : 'text-[#11241c]/55'
                      }`}
                    >
                      {col.subtitle}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. Section 02: Made for him (Product Grid + Winter Banner) */}
      <section
        id="shop-men"
        className="w-full bg-[#e6ece8] py-20 lg:py-28 px-4 sm:px-8 border-t border-[#d8e0da]"
      >
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-[#11241c]/55 font-semibold mb-2">
                THE CURRENT EDIT / 02
              </p>
              <h2 className="font-editorial text-5xl sm:text-6xl text-[#11241c] tracking-tight">
                Made for him.
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#11241c]/65 max-w-xs leading-relaxed">
              From daily staples to colder-day layers, find the pieces
              you&apos;ll reach for again and again.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2.5 overflow-x-auto pb-4 mb-8 no-scrollbar">
            {categoryTabs.map((cat) => {
              const active = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition cursor-pointer border ${
                    active
                      ? 'bg-[#11241c] text-white border-[#11241c] shadow-xs'
                      : 'bg-transparent text-[#11241c]/75 border-[#c6d1c9] hover:border-[#11241c]'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Product Grid (4 columns on desktop matching screenshot) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product._id}
                className="group bg-[#f4f3ee] rounded-2xl p-3 border border-[#dce3de] shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between"
              >
                {/* Image Container */}
                <div
                  onClick={() => setSelectedProduct(product)}
                  className="relative h-[300px] sm:h-[310px] rounded-xl overflow-hidden bg-[#dfe6e1] cursor-pointer"
                >
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  />
                  {product.badge && (
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-[#f4f3ee]/95 text-[#11241c] text-[9px] font-semibold uppercase tracking-[0.16em] shadow-xs">
                      {product.badge}
                    </span>
                  )}
                </div>

                {/* Card Details */}
                <div className="pt-4 pb-1 px-1 flex flex-col justify-between flex-1">
                  <div
                    onClick={() => setSelectedProduct(product)}
                    className="cursor-pointer"
                  >
                    <p className="text-[9px] uppercase tracking-[0.2em] text-[#11241c]/50 font-semibold">
                      {product.category}
                    </p>
                    <h3 className="font-editorial text-2xl text-[#11241c] font-medium mt-0.5 group-hover:text-[#1b3b2b] transition-colors">
                      {product.title}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-bold text-[#11241c]">
                        {formatBDT(product.price)}
                      </span>
                      {product.originalPrice &&
                        product.originalPrice > product.price && (
                          <span className="text-[11px] text-[#11241c]/40 line-through">
                            {formatBDT(product.originalPrice)}
                          </span>
                        )}
                    </div>

                    <button
                      onClick={() => addToCart(product)}
                      className="w-8 h-8 rounded-full border border-[#cdd6d0] bg-white text-[#11241c] flex items-center justify-center hover:bg-[#11241c] hover:text-white hover:border-[#11241c] transition cursor-pointer"
                      title="Quick add to bag"
                      aria-label={`Add ${product.title} to bag`}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Winter Feature Banner inside Section 02 */}
          <div className="mt-12 relative rounded-3xl overflow-hidden min-h-[300px] sm:min-h-[340px] bg-[#0d1d16] text-white p-8 sm:p-14 flex items-center shadow-xl">
            <div className="absolute inset-0 z-0">
              <img
                src={settings.winterBannerImage}
                alt="Winter Collection"
                className="w-full h-full object-cover object-center opacity-45"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0a1812]/95 via-[#0f221a]/80 to-transparent" />
            </div>

            <div className="relative z-10 max-w-lg">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-5 h-[1px] bg-white/50" />
                <span className="text-[10px] uppercase tracking-[0.22em] text-white/80 font-semibold">
                  {settings.winterBannerSubtitle}
                </span>
              </div>

              <h3 className="font-editorial text-4xl sm:text-5xl leading-[1.05] text-white">
                <span className="block">{settings.winterBannerTitle1}</span>
                <span className="block">{settings.winterBannerTitle2}</span>
              </h3>

              <p className="text-xs sm:text-sm text-white/75 mt-3 leading-relaxed max-w-md">
                {settings.winterBannerDesc}
              </p>

              <button
                onClick={() => {
                  setActiveCategory('Winter collection');
                  document
                    .getElementById('shop-men')
                    ?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="mt-6 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] font-semibold text-white pb-1.5 border-b border-white/40 hover:border-white transition cursor-pointer"
              >
                <span>SHOP WINTER PIECES</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Our Promise / Value Props Strip */}
      <section
        id="our-promise"
        className="w-full bg-[#f4f3ee] py-16 lg:py-20 px-4 sm:px-8 border-t border-[#d8e0da]"
      >
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="md:pr-6">
            <Shirt className="w-5 h-5 text-[#11241c]/70 mb-4 stroke-[1.5]" />
            <h3 className="font-editorial text-2xl sm:text-3xl text-[#11241c] mb-2">
              Everyday, elevated.
            </h3>
            <p className="text-xs sm:text-sm text-[#11241c]/65 leading-relaxed">
              Considered styles that feel right wherever the day takes you.
            </p>
          </div>

          <div className="md:border-l md:border-[#d8e0da] md:pl-8 md:pr-6">
            <Layers className="w-5 h-5 text-[#11241c]/70 mb-4 stroke-[1.5]" />
            <h3 className="font-editorial text-2xl sm:text-3xl text-[#11241c] mb-2">
              Built to mix.
            </h3>
            <p className="text-xs sm:text-sm text-[#11241c]/65 leading-relaxed">
              Versatile pieces made to work together, your way.
            </p>
          </div>

          <div className="md:border-l md:border-[#d8e0da] md:pl-8">
            <Sparkles className="w-5 h-5 text-[#11241c]/70 mb-4 stroke-[1.5]" />
            <h3 className="font-editorial text-2xl sm:text-3xl text-[#11241c] mb-2">
              More to come.
            </h3>
            <p className="text-xs sm:text-sm text-[#11241c]/65 leading-relaxed">
              Our Men&apos;s collection is just the beginning. Women and Kids
              are on the horizon.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Footer */}
      <footer className="w-full bg-[#0e2018] text-white pt-16 pb-12 px-4 sm:px-8 mt-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between gap-12 pb-14 border-b border-white/10">
            <div className="max-w-xs">
              <BrandLogo size="lg" showTagline />
              <p className="mt-4 text-xs text-white/65 leading-relaxed">
                Fabric favorites for the way you live. Start with the
                men&apos;s collection, and stay close for what&apos;s next.
              </p>
            </div>

            <div className="flex gap-16 sm:gap-24">
              <div>
                <h4 className="text-[10px] uppercase tracking-[0.22em] text-white/50 font-semibold mb-4">
                  EXPLORE
                </h4>
                <ul className="space-y-2.5 text-xs text-white/80">
                  <li>
                    <a
                      href="#shop-men"
                      className="hover:text-white transition"
                    >
                      Shop Men
                    </a>
                  </li>
                  <li>
                    <a
                      href="#collections"
                      className="hover:text-white transition"
                    >
                      Collections
                    </a>
                  </li>
                  <li>
                    <a
                      href="#our-promise"
                      className="hover:text-white transition"
                    >
                      Our Promise
                    </a>
                  </li>
                  <li>
                    <Link
                      href="/track-order"
                      className="hover:text-white transition"
                    >
                      Track Order
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-[10px] uppercase tracking-[0.22em] text-white/50 font-semibold mb-4">
                  COMING NEXT
                </h4>
                <ul className="space-y-2.5 text-xs text-white/80">
                  <li>
                    <a
                      href="#collections"
                      className="hover:text-white transition"
                    >
                      Women
                    </a>
                  </li>
                  <li>
                    <a
                      href="#collections"
                      className="hover:text-white transition"
                    >
                      Kids
                    </a>
                  </li>
                  <li>
                    <a
                      href={`mailto:${settings.contactEmail}`}
                      className="hover:text-white transition"
                    >
                      Get in touch
                    </a>
                  </li>
                  <li>
                    <Link
                      href="/admin"
                      className="text-white/45 hover:text-white transition"
                    >
                      Admin Portal
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-white/45">
            <p>© 2025 Bunon Gents. All rights reserved.</p>
            <p>Clothes for modern men · Made for the everyday.</p>
          </div>
        </div>
      </footer>

      {/* Product Detail Modal */}
      <ProductModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
}
