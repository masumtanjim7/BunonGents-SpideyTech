'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  FolderKanban,
  LogOut,
  Plus,
  Pencil,
  Trash2,
  Upload,
  CheckCircle2,
  ExternalLink,
  Search,
  Sparkles,
  Smartphone,
  DollarSign,
  Eye,
  X,
  Lock,
  Users,
  UserCheck,
  UserX,
  ShieldCheck,
  KeyRound,
  Mail,
  ArrowLeft,
  Image as ImageIcon,
  MessageCircle,
  Truck,
  Save,
  Menu,
  ChevronRight,
} from 'lucide-react';
import {
  API_URL,
  Product,
  CollectionItem,
  Order,
  SiteSettings,
  UserProfile,
  formatBDT,
  uploadImageToImgBB,
} from '@/lib/api';
import BrandLogo from '@/components/BrandLogo';

type AdminTab =
  | 'overview'
  | 'orders'
  | 'customers'
  | 'products'
  | 'collections'
  | 'storefront'
  | 'payments'
  | 'admins';

interface DashboardStats {
  totalProducts: number;
  totalCollections: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  deliveredOrders: number;
  totalCustomers?: number;
  activeCustomers?: number;
  blockedCustomers?: number;
  paymentBreakdown: {
    COD: number;
    bKash: number;
    Nagad: number;
  };
  recentOrders: Order[];
}

const TAB_HEADERS: Record<AdminTab, { title: string; subtitle: string }> = {
  overview: {
    title: 'Dashboard Overview',
    subtitle: 'Real-time store performance, revenue metrics, and recent orders',
  },
  orders: {
    title: 'Orders Management',
    subtitle: 'Verify payments, inspect items, and update delivery statuses',
  },
  customers: {
    title: 'Customer Directory',
    subtitle: 'View registered members, order history, and account access',
  },
  products: {
    title: 'Product Catalog',
    subtitle: 'Manage menswear pieces, multi-photo galleries, pricing, and inventory',
  },
  collections: {
    title: 'Storefront Collections',
    subtitle: 'Curate featured collection cards displayed on the home page',
  },
  storefront: {
    title: 'Hero & Storefront Content',
    subtitle: 'Customize hero headlines, background imagery, announcement bar, and contact info',
  },
  payments: {
    title: 'Payments, Shipping & WhatsApp',
    subtitle: 'Configure bKash, Nagad, COD, delivery zone charges, and WhatsApp chat',
  },
  admins: {
    title: 'Admin Team & Security',
    subtitle: 'Manage administrator accounts, team access, and your login credentials',
  },
};

export default function AdminDashboardPage() {
  const [token, setToken] = useState<string | null>(null);
  const [adminUser, setAdminUser] = useState<{ name: string; email: string } | null>(
    null
  );

  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // Active Tab & Mobile Menu Drawer
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [mobileAdminMenuOpen, setMobileAdminMenuOpen] = useState(false);

  // Data States
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [adminsList, setAdminsList] = useState<UserProfile[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [toast, setToast] = useState<string>('');

  // Admin Login & Password Reset Flow State
  const [authMode, setAuthMode] = useState<'login' | 'forgot' | 'verify_otp'>('login');
  const [resetEmail, setResetEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Multiple Admin Management State
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmailInput, setNewAdminEmailInput] = useState('');
  const [newAdminPhone, setNewAdminPhone] = useState('');
  const [newAdminPassInput, setNewAdminPassInput] = useState('');
  const [creatingAdmin, setCreatingAdmin] = useState(false);

  // Product Catalog Filter & Category Manager State
  const [adminProdCategory, setAdminProdCategory] = useState('All');
  const [adminProdSearch, setAdminProdSearch] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [savingCategory, setSavingCategory] = useState(false);
  const [showInlineCategoryAdd, setShowInlineCategoryAdd] = useState(false);
  const [inlineCategoryName, setInlineCategoryName] = useState('');

  // Product Form Modal State
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prodTitle, setProdTitle] = useState('');
  const [prodCategory, setProdCategory] = useState('Shirts');
  const [prodBadge, setProdBadge] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodOriginalPrice, setProdOriginalPrice] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodFabric, setProdFabric] = useState('');
  const [prodImage, setProdImage] = useState('');
  const [prodGallery, setProdGallery] = useState<string[]>([]);
  const [customGalleryUrl, setCustomGalleryUrl] = useState('');
  const [uploadingGalleryImg, setUploadingGalleryImg] = useState(false);
  const [prodSizes, setProdSizes] = useState('');
  const [prodColors, setProdColors] = useState('');
  const [customBadgeInput, setCustomBadgeInput] = useState('');
  const [customColorInput, setCustomColorInput] = useState('');
  const [prodStock, setProdStock] = useState('');
  const [prodInStock, setProdInStock] = useState(true);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);

  // Collection Form State
  const [showColModal, setShowColModal] = useState(false);
  const [editingCol, setEditingCol] = useState<CollectionItem | null>(null);
  const [colNumberLabel, setColNumberLabel] = useState('');
  const [colTitle, setColTitle] = useState('');
  const [colSubtitle, setColSubtitle] = useState('');
  const [colStatus, setColStatus] = useState<'AVAILABLE NOW' | 'COMING SOON'>(
    'AVAILABLE NOW'
  );
  const [colImage, setColImage] = useState('');
  const [colOrder, setColOrder] = useState('1');

  // Order filter state
  const [orderFilter, setOrderFilter] = useState('All');
  const [orderSearch, setOrderSearch] = useState('');
  const [selectedOrderModal, setSelectedOrderModal] = useState<Order | null>(
    null
  );

  // Customer filter & modal state
  const [userSearch, setUserSearch] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState<
    'All' | 'Active' | 'Suspended'
  >('All');
  const [selectedUserModal, setSelectedUserModal] =
    useState<UserProfile | null>(null);

  // Admin password change state
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  useEffect(() => {
    const savedToken = localStorage.getItem('bunon_admin_token');
    const savedUser = localStorage.getItem('bunon_admin_user');
    if (savedToken) {
      setToken(savedToken);
      if (savedUser) {
        try {
          const u = JSON.parse(savedUser);
          setAdminUser(u);
          setNewAdminEmail(u.email || '');
        } catch {}
      }
    }
  }, []);

  useEffect(() => {
    if (mobileAdminMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileAdminMenuOpen]);

  const fetchAllAdminData = async (authToken: string) => {
    try {
      const headers = { Authorization: `Bearer ${authToken}` };
      const [statsRes, prodRes, colRes, ordRes, setRes, usrRes, admRes] =
        await Promise.all([
          fetch(`${API_URL}/settings/stats`, { headers }),
          fetch(`${API_URL}/products`),
          fetch(`${API_URL}/collections`),
          fetch(`${API_URL}/orders`, { headers }),
          fetch(`${API_URL}/settings`),
          fetch(`${API_URL}/auth/users`, { headers }),
          fetch(`${API_URL}/auth/admins`, { headers }),
        ]);

      if (statsRes.status === 401) {
        handleLogout();
        return;
      }

      if (statsRes.ok) setStats(await statsRes.json());
      if (prodRes.ok) setProducts(await prodRes.json());
      if (colRes.ok) setCollections(await colRes.json());
      if (ordRes.ok) setOrders(await ordRes.json());
      if (setRes.ok) setSettings(await setRes.json());
      if (usrRes.ok) setUsersList(await usrRes.json());
      if (admRes.ok) setAdminsList(await admRes.json());
    } catch (e) {
      console.error('Admin fetch error:', e);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAllAdminData(token);
    }
  }, [token]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoggingIn(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Invalid credentials');
      }
      localStorage.setItem('bunon_admin_token', data.token);
      localStorage.setItem(
        'bunon_admin_user',
        JSON.stringify({ name: data.name, email: data.email })
      );
      setToken(data.token);
      setAdminUser({ name: data.name, email: data.email });
      setNewAdminEmail(data.email);
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('bunon_admin_token');
    localStorage.removeItem('bunon_admin_user');
    setToken(null);
    setAdminUser(null);
  };

  // Open Product Modal for Create/Edit
  const openCreateProduct = () => {
    setEditingProduct(null);
    setProdTitle('');
    setProdCategory(
      settings?.categories && settings.categories.length > 0
        ? settings.categories[0]
        : 'Shirts'
    );
    setProdBadge('');
    setProdPrice('');
    setProdOriginalPrice('');
    setProdDesc('');
    setProdFabric('');
    setProdImage('');
    setProdGallery([]);
    setCustomGalleryUrl('');
    setProdSizes('');
    setProdColors('');
    setCustomBadgeInput('');
    setCustomColorInput('');
    setProdStock('');
    setProdInStock(true);
    setShowProductModal(true);
  };

  const openEditProduct = (p: Product) => {
    setEditingProduct(p);
    setProdTitle(p.title);
    setProdCategory(p.category);
    setProdBadge(p.badge || '');
    setProdPrice(String(p.price));
    setProdOriginalPrice(p.originalPrice ? String(p.originalPrice) : '');
    setProdDesc(p.description || '');
    setProdFabric(p.fabricAndCare || '');
    setProdImage(p.image);
    setProdGallery(p.gallery || []);
    setCustomGalleryUrl('');
    setProdSizes((p.sizes || []).join(', '));
    setProdColors((p.colors || []).join(', '));
    setCustomBadgeInput('');
    setCustomColorInput('');
    setProdStock(String(p.stock ?? 25));
    setProdInStock(p.inStock ?? true);
    setShowProductModal(true);
  };

  const handleAddGalleryUrl = () => {
    if (!customGalleryUrl.trim()) return;
    setProdGallery((prev) => [...prev, customGalleryUrl.trim()]);
    setCustomGalleryUrl('');
  };

  const handleRemoveGalleryImage = (idx: number) => {
    setProdGallery((prev) => prev.filter((_, i) => i !== idx));
  };

  const STANDARD_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

  const selectedSizesArray = prodSizes
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const toggleProductSize = (size: string) => {
    const exists = selectedSizesArray.some(
      (s) => s.toUpperCase() === size.toUpperCase()
    );
    let updated: string[];
    if (exists) {
      updated = selectedSizesArray.filter(
        (s) => s.toUpperCase() !== size.toUpperCase()
      );
    } else {
      const next = [...selectedSizesArray, size];
      updated = [
        ...STANDARD_SIZES.filter((std) =>
          next.some((n) => n.toUpperCase() === std)
        ),
        ...next.filter((n) => !STANDARD_SIZES.includes(n.toUpperCase())),
      ];
    }
    setProdSizes(updated.join(', '));
  };

  const toggleAllStandardSizes = () => {
    const allSelected = STANDARD_SIZES.every((std) =>
      selectedSizesArray.some((s) => s.toUpperCase() === std)
    );
    if (allSelected) {
      setProdSizes('');
    } else {
      setProdSizes(STANDARD_SIZES.join(', '));
    }
  };

  // Preset Editorial Badges (Single-Select Only)
  const PRESET_BADGES = [
    'EVERYDAY ESSENTIAL',
    'EASY POLISH',
    'WEAR ON REPEAT',
    'LAYER UP',
    'WINTER COLLECTION',
    'NEW ARRIVAL',
    'BEST SELLER',
    'LIMITED EDITION',
  ];

  const badgeOptions =
    prodBadge.trim() &&
    !PRESET_BADGES.some((b) => b.toUpperCase() === prodBadge.trim().toUpperCase())
      ? [...PRESET_BADGES, prodBadge.trim().toUpperCase()]
      : PRESET_BADGES;

  const handleSelectSingleBadge = (badgeLabel: string) => {
    if (prodBadge.trim().toUpperCase() === badgeLabel.toUpperCase()) {
      setProdBadge('');
    } else {
      setProdBadge(badgeLabel.toUpperCase());
    }
  };

  const handleAddCustomBadge = () => {
    const cleaned = customBadgeInput.trim().toUpperCase();
    if (!cleaned) return;
    setProdBadge(cleaned);
    setCustomBadgeInput('');
  };

  // Preset Basic Menswear Colors (Multi-Select + Custom Input)
  const PRESET_COLORS: { name: string; hex: string }[] = [
    { name: 'Black', hex: '#141414' },
    { name: 'White', hex: '#ffffff' },
    { name: 'Maroon', hex: '#6b1d2f' },
    { name: 'Navy Blue', hex: '#1b2a4a' },
    { name: 'Olive Green', hex: '#4b5d43' },
    { name: 'Charcoal', hex: '#363b3e' },
    { name: 'Beige', hex: '#d8c8b0' },
    { name: 'Grey', hex: '#8a9196' },
    { name: 'Brown', hex: '#60402b' },
    { name: 'Cream', hex: '#f3efe3' },
    { name: 'Sky Blue', hex: '#8bb8d8' },
    { name: 'Khaki', hex: '#b8a37a' },
  ];

  const selectedColorsArray = prodColors
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean);

  const allColorOptions: { name: string; hex: string }[] = [
    ...PRESET_COLORS,
    ...selectedColorsArray
      .filter(
        (c) =>
          !PRESET_COLORS.some(
            (p) => p.name.toLowerCase() === c.toLowerCase()
          )
      )
      .map((c) => ({ name: c, hex: '#11241c' })),
  ];

  const toggleProductColor = (colorName: string) => {
    const exists = selectedColorsArray.some(
      (c) => c.toLowerCase() === colorName.toLowerCase()
    );
    let updated: string[];
    if (exists) {
      updated = selectedColorsArray.filter(
        (c) => c.toLowerCase() !== colorName.toLowerCase()
      );
    } else {
      updated = [...selectedColorsArray, colorName];
    }
    setProdColors(updated.join(', '));
  };

  const handleAddCustomColor = () => {
    const cleaned = customColorInput.trim();
    if (!cleaned) return;
    const exists = selectedColorsArray.some(
      (c) => c.toLowerCase() === cleaned.toLowerCase()
    );
    if (!exists) {
      setProdColors([...selectedColorsArray, cleaned].join(', '));
    }
    setCustomColorInput('');
  };

  const handleSetGalleryAsPrimary = (idx: number) => {
    const chosen = prodGallery[idx];
    const oldPrimary = prodImage;
    setProdImage(chosen);
    setProdGallery((prev) => {
      const next = [...prev];
      if (oldPrimary) {
        next[idx] = oldPrimary;
      } else {
        next.splice(idx, 1);
      }
      return next;
    });
  };

  const handleGalleryImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !token) return;
    setUploadingGalleryImg(true);
    try {
      const uploaded: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const url = await uploadImageToImgBB(files[i], token);
        uploaded.push(url);
      }
      setProdGallery((prev) => [...prev, ...uploaded]);
      showToast(`${uploaded.length} image(s) added to gallery!`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gallery image upload failed');
    } finally {
      setUploadingGalleryImg(false);
    }
  };

  const handleImageFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
    onSuccess: (url: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    setUploadingImg(true);
    try {
      const url = await uploadImageToImgBB(file, token);
      onSuccess(url);
      showToast('Image uploaded to ImgBB!');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'ImgBB Upload failed');
    } finally {
      setUploadingImg(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSavingProduct(true);
    try {
      const primaryImg =
        prodImage || (prodGallery.length > 0 ? prodGallery[0] : '');
      const payload = {
        title: prodTitle,
        category: prodCategory,
        badge: prodBadge || 'EVERYDAY ESSENTIAL',
        price: Number(prodPrice),
        originalPrice: prodOriginalPrice ? Number(prodOriginalPrice) : null,
        description: prodDesc,
        fabricAndCare:
          prodFabric ||
          '100% Premium breathable cotton. Machine wash cold.',
        image: primaryImg,
        gallery: prodGallery.filter(Boolean),
        sizes: prodSizes.trim()
          ? prodSizes
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : ['S', 'M', 'L', 'XL', 'XXL'],
        colors: prodColors.trim()
          ? prodColors
              .split(',')
              .map((c) => c.trim())
              .filter(Boolean)
          : ['Charcoal', 'Forest Olive', 'Warm Cream'],
        stock: prodStock ? Number(prodStock) : 25,
        inStock: prodInStock,
      };

      const url = editingProduct
        ? `${API_URL}/products/${editingProduct._id}`
        : `${API_URL}/products`;

      const res = await fetch(url, {
        method: editingProduct ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save product');

      setShowProductModal(false);
      fetchAllAdminData(token);
      showToast(
        editingProduct
          ? 'Product updated successfully!'
          : 'New product added to store!'
      );
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error saving product');
    } finally {
      setSavingProduct(false);
    }
  };

  // Admin Password Reset Flow Handlers
  const handleRequestResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetMessage(null);
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to send OTP code');
      setResetMessage({ type: 'success', text: data.message });
      setAuthMode('verify_otp');
    } catch (err: unknown) {
      setResetMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error sending reset code',
      });
    } finally {
      setResetLoading(false);
    }
  };

  const handleConfirmResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetNewPassword !== resetConfirmPassword) {
      setResetMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }
    if (resetNewPassword.length < 6) {
      setResetMessage({
        type: 'error',
        text: 'Password must be at least 6 characters long',
      });
      return;
    }
    setResetLoading(true);
    setResetMessage(null);
    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: resetEmail,
          otp: resetOtp.trim(),
          newPassword: resetNewPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to reset password');
      showToast('Password reset successfully!');
      setAuthMode('login');
      setLoginEmail(resetEmail);
      setLoginPassword('');
      setResetOtp('');
      setResetNewPassword('');
      setResetConfirmPassword('');
      setResetMessage(null);
    } catch (err: unknown) {
      setResetMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error resetting password',
      });
    } finally {
      setResetLoading(false);
    }
  };

  // Multiple Admin Management Handlers
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setCreatingAdmin(true);
    try {
      const res = await fetch(`${API_URL}/auth/admins`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newAdminName,
          email: newAdminEmailInput,
          phone: newAdminPhone,
          password: newAdminPassInput,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create admin');
      showToast(data.message || 'New admin added successfully!');
      setShowAddAdminModal(false);
      setNewAdminName('');
      setNewAdminEmailInput('');
      setNewAdminPhone('');
      setNewAdminPassInput('');
      fetchAllAdminData(token);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to create admin');
    } finally {
      setCreatingAdmin(false);
    }
  };

  const handleDeleteAdmin = async (adminId: string, adminEmail: string) => {
    if (!token) return;
    if (
      !confirm(
        `Are you sure you want to remove admin access for ${adminEmail}?`
      )
    )
      return;
    try {
      const res = await fetch(`${API_URL}/auth/users/${adminId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete admin');
      showToast(data.message || 'Admin removed successfully');
      fetchAllAdminData(token);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to remove admin');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!token || !confirm('Are you sure you want to delete this product?'))
      return;
    try {
      await fetch(`${API_URL}/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchAllAdminData(token);
      showToast('Product removed.');
    } catch {}
  };

  // Collection Handlers
  const openEditCollection = (c?: CollectionItem) => {
    if (c) {
      setEditingCol(c);
      setColNumberLabel(c.numberLabel);
      setColTitle(c.title);
      setColSubtitle(c.subtitle);
      setColStatus(c.status);
      setColImage(c.image || '');
      setColOrder(String(c.order || 1));
    } else {
      setEditingCol(null);
      setColNumberLabel('');
      setColTitle('');
      setColSubtitle('');
      setColStatus('AVAILABLE NOW');
      setColImage('');
      setColOrder(String(collections.length + 1));
    }
    setShowColModal(true);
  };

  const handleSaveCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      const payload = {
        numberLabel:
          colNumberLabel.trim() ||
          `0${collections.length + 1} / ${colStatus}`,
        title: colTitle,
        subtitle: colSubtitle.trim() || 'EXPLORE THE COLLECTION →',
        status: colStatus,
        image: colImage,
        order: Number(colOrder),
      };
      const url = editingCol
        ? `${API_URL}/collections/${editingCol._id}`
        : `${API_URL}/collections`;

      const res = await fetch(url, {
        method: editingCol ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setShowColModal(false);
        fetchAllAdminData(token);
        showToast('Collection saved!');
      }
    } catch {}
  };

  const handleDeleteCollection = async (id: string) => {
    if (!token || !confirm('Remove this collection card?')) return;
    await fetch(`${API_URL}/collections/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchAllAdminData(token);
    showToast('Collection deleted.');
  };

  // Order Status Update
  const handleUpdateOrder = async (
    orderId: string,
    updates: { orderStatus?: string; paymentStatus?: string }
  ) => {
    if (!token) return;
    const res = await fetch(`${API_URL}/orders/${orderId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      const updated = await res.json();
      if (selectedOrderModal && selectedOrderModal._id === orderId) {
        setSelectedOrderModal(updated);
      }
      fetchAllAdminData(token);
      showToast('Order status updated!');
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !settings) return;
    const res = await fetch(`${API_URL}/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(settings),
    });
    if (res.ok) {
      const updated = await res.json();
      setSettings(updated);
      showToast('Settings saved successfully!');
    }
  };

  // Add New Product Category
  const handleAddCategory = async (
    rawName: string,
    selectForProduct = false
  ) => {
    const trimmed = rawName.trim();
    if (!trimmed || !token) return;

    const currentCats =
      settings?.categories && settings.categories.length > 0
        ? settings.categories
        : ['Jeans', 'Shirts', 'T-shirts', 'Sweaters', 'Winter collection'];

    const exists = currentCats.some(
      (c) => c.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      showToast(`Category "${trimmed}" already exists.`);
      if (selectForProduct) {
        const matched =
          currentCats.find((c) => c.toLowerCase() === trimmed.toLowerCase()) ||
          trimmed;
        setProdCategory(matched);
        setShowInlineCategoryAdd(false);
        setInlineCategoryName('');
      }
      return;
    }

    const updatedCategories = [...currentCats, trimmed];
    setSavingCategory(true);
    try {
      const res = await fetch(`${API_URL}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...(settings || {}),
          categories: updatedCategories,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setSettings(updated);
        setNewCategoryName('');
        if (selectForProduct) {
          setProdCategory(trimmed);
          setShowInlineCategoryAdd(false);
          setInlineCategoryName('');
        }
        showToast(`Category "${trimmed}" created!`);
      }
    } finally {
      setSavingCategory(false);
    }
  };

  // Delete Product Category
  const handleDeleteCategory = async (catToDelete: string) => {
    if (!token) return;
    const currentCats =
      settings?.categories && settings.categories.length > 0
        ? settings.categories
        : ['Jeans', 'Shirts', 'T-shirts', 'Sweaters', 'Winter collection'];

    if (currentCats.length <= 1) {
      alert('At least one product category must remain.');
      return;
    }

    if (
      !confirm(
        `Remove category "${catToDelete}" from the category filter bar?`
      )
    ) {
      return;
    }

    const updatedCategories = currentCats.filter((c) => c !== catToDelete);
    setSavingCategory(true);
    try {
      const res = await fetch(`${API_URL}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...(settings || {}),
          categories: updatedCategories,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setSettings(updated);
        if (adminProdCategory.toLowerCase() === catToDelete.toLowerCase()) {
          setAdminProdCategory('All');
        }
        showToast(`Category "${catToDelete}" removed.`);
      }
    } finally {
      setSavingCategory(false);
    }
  };

  const handleUpdateAdminCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    const res = await fetch(`${API_URL}/auth/credentials`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        email: newAdminEmail,
        newPassword: newAdminPassword || undefined,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setNewAdminPassword('');
      setAdminUser({ name: data.name, email: data.email });
      localStorage.setItem(
        'bunon_admin_user',
        JSON.stringify({ name: data.name, email: data.email })
      );
      showToast('Admin credentials updated!');
    } else {
      alert(data.message || 'Failed to update credentials');
    }
  };

  // Toggle User Active/Suspended Status
  const handleToggleUserStatus = async (u: UserProfile) => {
    if (!token) return;
    const res = await fetch(`${API_URL}/auth/users/${u._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ isActive: !u.isActive }),
    });
    if (res.ok) {
      fetchAllAdminData(token);
      if (selectedUserModal && selectedUserModal._id === u._id) {
        setSelectedUserModal({ ...selectedUserModal, isActive: !u.isActive });
      }
      showToast(
        !u.isActive
          ? `${u.name}'s account activated!`
          : `${u.name}'s account suspended.`
      );
    }
  };

  const handleDeleteUser = async (u: UserProfile) => {
    if (
      !token ||
      !confirm(`Are you sure you want to delete ${u.name}'s account?`)
    )
      return;
    const res = await fetch(`${API_URL}/auth/users/${u._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setSelectedUserModal(null);
      fetchAllAdminData(token);
      showToast('User account deleted.');
    } else {
      const d = await res.json();
      alert(d.message || 'Could not delete user');
    }
  };

  // LOGIN & ADMIN PASSWORD RESET SCREEN
  if (!token) {
    return (
      <div className="min-h-screen bg-[#0e2018] text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#152d22] border border-white/10 rounded-3xl p-7 sm:p-10 shadow-2xl">
          <div className="text-center mb-6 flex flex-col items-center">
            <BrandLogo size="lg" showTagline />
            <p className="text-[10px] uppercase tracking-[0.22em] text-white/50 mt-3 font-semibold">
              ADMINISTRATION PORTAL
            </p>
          </div>

          {/* Feedback Messages */}
          {loginError && authMode === 'login' && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-500/15 border border-red-400/30 text-red-200 text-xs text-center">
              {loginError}
            </div>
          )}

          {resetMessage && (
            <div
              className={`mb-5 p-3.5 rounded-xl border text-xs text-center ${
                resetMessage.type === 'success'
                  ? 'bg-emerald-500/15 border-emerald-400/30 text-emerald-200'
                  : 'bg-red-500/15 border-red-400/30 text-red-200'
              }`}
            >
              {resetMessage.text}
            </div>
          )}

          {/* VIEW 1: REGULAR LOGIN */}
          {authMode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs text-white/75 mb-1.5 font-medium">
                  Admin Email
                </label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="Enter admin email (e.g. admin@bunongents.com)"
                  className="w-full px-4 py-3 rounded-xl bg-black/25 border border-white/15 text-sm text-white focus:outline-none focus:border-white/50"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs text-white/75 font-medium">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(loginEmail);
                      setResetMessage(null);
                      setAuthMode('forgot');
                    }}
                    className="text-[11px] text-[#e5c158] hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter your admin password"
                  className="w-full px-4 py-3 rounded-xl bg-black/25 border border-white/15 text-sm text-white focus:outline-none focus:border-white/50"
                />
              </div>

              <button
                type="submit"
                disabled={loggingIn}
                className="w-full py-3.5 rounded-xl bg-[#f4f3ee] text-[#11241c] text-xs uppercase tracking-[0.18em] font-bold hover:bg-white transition cursor-pointer mt-2"
              >
                {loggingIn ? 'Signing in...' : 'Sign In to Dashboard'}
              </button>
            </form>
          )}

          {/* VIEW 2: FORGOT PASSWORD (REQUEST OTP VIA NODEMAILER) */}
          {authMode === 'forgot' && (
            <form onSubmit={handleRequestResetOtp} className="space-y-4">
              <div className="text-center mb-4">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-2 text-[#e5c158]">
                  <Mail className="w-6 h-6" />
                </div>
                <h3 className="font-editorial text-xl font-semibold">
                  Reset Admin Password
                </h3>
                <p className="text-xs text-white/60 mt-1">
                  Enter your admin email. We will dispatch a 6-digit OTP code to
                  your inbox using Nodemailer.
                </p>
              </div>

              <div>
                <label className="block text-xs text-white/75 mb-1.5 font-medium">
                  Admin Email Address
                </label>
                <input
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="admin@bunongents.com"
                  className="w-full px-4 py-3 rounded-xl bg-black/25 border border-white/15 text-sm text-white focus:outline-none focus:border-white/50"
                />
              </div>

              <button
                type="submit"
                disabled={resetLoading}
                className="w-full py-3.5 rounded-xl bg-[#e5c158] text-[#11241c] text-xs uppercase tracking-[0.18em] font-bold hover:bg-[#ebd27c] transition cursor-pointer mt-2"
              >
                {resetLoading ? 'Sending OTP Code...' : 'Send OTP to Email'}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setResetMessage(null);
                    setAuthMode('login');
                  }}
                  className="text-xs text-white/60 hover:text-white transition cursor-pointer inline-flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </button>
              </div>
            </form>
          )}

          {/* VIEW 3: VERIFY OTP & ENTER NEW PASSWORD */}
          {authMode === 'verify_otp' && (
            <form onSubmit={handleConfirmResetPassword} className="space-y-4">
              <div className="text-center mb-4">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-2 text-emerald-400">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h3 className="font-editorial text-xl font-semibold">
                  Enter 6-Digit OTP Code
                </h3>
                <p className="text-xs text-white/60 mt-1">
                  We sent a verification code to{' '}
                  <strong className="text-white">{resetEmail}</strong>. Valid for
                  10 minutes.
                </p>
              </div>

              <div>
                <label className="block text-xs text-white/75 mb-1.5 font-medium text-center">
                  Verification Code (OTP)
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={resetOtp}
                  onChange={(e) => setResetOtp(e.target.value)}
                  placeholder="123456"
                  className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/20 text-center text-xl font-mono tracking-[8px] text-white focus:outline-none focus:border-[#e5c158]"
                />
              </div>

              <div>
                <label className="block text-xs text-white/75 mb-1.5 font-medium">
                  New Password (min 6 characters)
                </label>
                <input
                  type="password"
                  required
                  value={resetNewPassword}
                  onChange={(e) => setResetNewPassword(e.target.value)}
                  placeholder="Enter new strong password"
                  className="w-full px-4 py-3 rounded-xl bg-black/25 border border-white/15 text-sm text-white focus:outline-none focus:border-white/50"
                />
              </div>

              <div>
                <label className="block text-xs text-white/75 mb-1.5 font-medium">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={resetConfirmPassword}
                  onChange={(e) => setResetConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full px-4 py-3 rounded-xl bg-black/25 border border-white/15 text-sm text-white focus:outline-none focus:border-white/50"
                />
              </div>

              <button
                type="submit"
                disabled={resetLoading}
                className="w-full py-3.5 rounded-xl bg-[#e5c158] text-[#11241c] text-xs uppercase tracking-[0.18em] font-bold hover:bg-[#ebd27c] transition cursor-pointer mt-2"
              >
                {resetLoading ? 'Resetting Password...' : 'Save & Reset Password'}
              </button>

              <div className="flex items-center justify-between text-xs text-white/60 pt-2">
                <button
                  type="button"
                  onClick={handleRequestResetOtp}
                  className="hover:text-white transition cursor-pointer underline"
                >
                  Resend OTP Code
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setResetMessage(null);
                    setAuthMode('login');
                  }}
                  className="hover:text-white transition cursor-pointer inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Back to Sign In</span>
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 pt-5 border-t border-white/10 text-center">
            <Link
              href="/"
              className="text-xs text-white/50 hover:text-white transition"
            >
              ← Return to Bunon Gents Storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Computed lists & counts
  const customersOnly = usersList.filter((u) => u.role === 'customer');
  const pendingOrdersCount = orders.filter((o) => o.orderStatus === 'Pending').length;

  const filteredOrders = orders.filter((o) => {
    const matchesStatus =
      orderFilter === 'All' || o.orderStatus === orderFilter;
    const matchesSearch =
      !orderSearch.trim() ||
      o.orderNumber.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.customerName.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.customerPhone.includes(orderSearch) ||
      (o.paymentDetails?.transactionId || '')
        .toLowerCase()
        .includes(orderSearch.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const configuredCategories =
    settings?.categories && settings.categories.length > 0
      ? settings.categories
      : ['Jeans', 'Shirts', 'T-shirts', 'Sweaters', 'Winter collection'];

  const productCategories = [
    'All',
    ...configuredCategories,
    ...products
      .map((p) => p.category)
      .filter(
        (cat) =>
          cat &&
          !configuredCategories.some(
            (c) => c.toLowerCase() === cat.toLowerCase()
          )
      )
      .filter(
        (cat, idx, arr) =>
          arr.findIndex((c) => c.toLowerCase() === cat.toLowerCase()) === idx
      ),
  ];

  const filteredAdminProducts = products.filter((p) => {
    const matchesCat =
      adminProdCategory === 'All' ||
      p.category.toLowerCase() === adminProdCategory.toLowerCase();
    const matchesSearch =
      !adminProdSearch.trim() ||
      p.title.toLowerCase().includes(adminProdSearch.toLowerCase()) ||
      (p.badge || '').toLowerCase().includes(adminProdSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const navGroups: {
    groupLabel: string;
    items: {
      id: AdminTab;
      label: string;
      icon: React.ComponentType<{ className?: string }>;
      badge?: string;
      highlightBadge?: boolean;
    }[];
  }[] = [
    {
      groupLabel: 'Main',
      items: [
        { id: 'overview' as AdminTab, label: 'Overview', icon: LayoutDashboard },
      ],
    },
    {
      groupLabel: 'Commerce',
      items: [
        {
          id: 'orders' as AdminTab,
          label: 'Orders',
          icon: ShoppingCart,
          badge: pendingOrdersCount > 0 ? `${pendingOrdersCount} new` : `${orders.length}`,
          highlightBadge: pendingOrdersCount > 0,
        },
        {
          id: 'customers' as AdminTab,
          label: 'Customers',
          icon: Users,
          badge: `${customersOnly.length}`,
        },
      ],
    },
    {
      groupLabel: 'Catalog',
      items: [
        {
          id: 'products' as AdminTab,
          label: 'Products',
          icon: Package,
          badge: `${products.length}`,
        },
        {
          id: 'collections' as AdminTab,
          label: 'Collections',
          icon: FolderKanban,
          badge: `${collections.length}`,
        },
      ],
    },
    {
      groupLabel: 'Configuration',
      items: [
        {
          id: 'storefront' as AdminTab,
          label: 'Hero & Storefront',
          icon: Sparkles,
        },
        {
          id: 'payments' as AdminTab,
          label: 'Payments & WhatsApp',
          icon: Smartphone,
        },
        {
          id: 'admins' as AdminTab,
          label: 'Admin Team & Security',
          icon: ShieldCheck,
          badge: `${adminsList.length || 1}`,
        },
      ],
    },
  ];

  const getOrderStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Delivered':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Shipped':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Processing':
      case 'Confirmed':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Cancelled':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-amber-100 text-amber-800 border-amber-200';
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f3ee] text-[#11241c] flex flex-col lg:flex-row">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#11241c] text-white px-5 py-3 rounded-xl shadow-2xl border border-white/15 flex items-center gap-2.5 text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Left Sidebar (Desktop) & Sticky Top Bar (Mobile/Tablet) */}
      <aside className="w-full lg:w-68 bg-[#0e2018] text-white flex flex-col justify-between shrink-0 border-b lg:border-b-0 lg:border-r border-white/10 sticky top-0 z-30 lg:h-screen">
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Sidebar Brand Header */}
          <div className="px-4 py-3.5 sm:p-5 lg:p-6 border-b border-white/10 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              <BrandLogo size="sm" />
              <span className="px-2 py-0.5 rounded-md bg-[#e5c158]/15 border border-[#e5c158]/30 text-[9px] font-bold uppercase tracking-widest text-[#e5c158] shrink-0">
                Admin
              </span>
            </div>

            {/* Mobile Active Section Pill + Hamburger Menu Toggle */}
            <div className="flex items-center gap-2 lg:hidden shrink-0">
              <button
                type="button"
                onClick={() => setMobileAdminMenuOpen(true)}
                className="hidden xs:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/8 border border-white/10 text-[11px] font-medium text-white/85"
              >
                <span className="truncate max-w-[110px]">
                  {TAB_HEADERS[activeTab].title}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setMobileAdminMenuOpen(true)}
                aria-label="Open Admin Menu"
                className="relative inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[#f4f3ee] text-[#11241c] text-xs font-bold shadow-xs active:scale-95 transition cursor-pointer"
              >
                <Menu className="w-4 h-4" />
                <span>Menu</span>
                {pendingOrdersCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                )}
              </button>
            </div>
          </div>

          {/* Desktop Grouped Navigation */}
          <nav className="hidden lg:flex flex-col flex-1 overflow-y-auto p-4 space-y-5">
            {navGroups.map((group) => (
              <div key={group.groupLabel}>
                <p className="px-3 mb-1.5 text-[10px] uppercase tracking-[0.2em] text-white/40 font-semibold">
                  {group.groupLabel}
                </p>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer w-full text-left ${
                          active
                            ? 'bg-[#f4f3ee] text-[#11241c] font-semibold shadow-xs'
                            : 'text-white/75 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Icon className="w-4 h-4 shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </div>
                        {item.badge && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                              active
                                ? 'bg-[#11241c] text-white'
                                : item.highlightBadge
                                ? 'bg-[#e5c158] text-[#11241c]'
                                : 'bg-white/10 text-white/75'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Mobile & Tablet Quick Tab Strip */}
          <nav className="flex lg:hidden items-center gap-1.5 px-3 py-2 overflow-x-auto scrollbar-none bg-black/15">
            {navGroups.flatMap((g) => g.items).map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-medium transition cursor-pointer whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-[#f4f3ee] text-[#11241c] font-semibold shadow-xs'
                      : 'text-white/75 bg-white/5 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                        active
                          ? 'bg-[#11241c] text-white'
                          : item.highlightBadge
                          ? 'bg-[#e5c158] text-[#11241c]'
                          : 'bg-white/15 text-white/80'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Desktop Sidebar Footer */}
        <div className="hidden lg:block p-4 border-t border-white/10 space-y-2 bg-black/15">
          {adminUser && (
            <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 mb-2">
              <p className="text-[10px] uppercase tracking-wider text-white/45 font-semibold">
                Signed In Admin
              </p>
              <p className="text-xs font-semibold text-white truncate mt-0.5">
                {adminUser.name}
              </p>
              <p className="text-[11px] text-white/60 truncate">
                {adminUser.email}
              </p>
            </div>
          )}
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-white/85 transition"
          >
            <span>View Live Storefront</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs text-red-300 hover:bg-red-500/15 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Admin Navigation Slide-Over Drawer */}
      {mobileAdminMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/65 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileAdminMenuOpen(false)}
          />

          {/* Slide-Over Panel */}
          <div className="relative z-10 w-[85%] max-w-xs bg-[#0e2018] text-white h-full flex flex-col justify-between shadow-2xl border-r border-white/10 overflow-hidden">
            {/* Drawer Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/20">
              <div className="flex items-center gap-2">
                <BrandLogo size="sm" />
                <span className="px-2 py-0.5 rounded-md bg-[#e5c158]/15 border border-[#e5c158]/30 text-[9px] font-bold uppercase tracking-widest text-[#e5c158]">
                  Admin
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileAdminMenuOpen(false)}
                aria-label="Close Menu"
                className="p-2 rounded-xl bg-white/10 text-white/80 hover:text-white hover:bg-white/20 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Grouped Navigation Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {navGroups.map((group) => (
                <div key={group.groupLabel}>
                  <p className="px-3 mb-1.5 text-[10px] uppercase tracking-[0.2em] text-white/40 font-semibold">
                    {group.groupLabel}
                  </p>
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const active = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveTab(item.id);
                            setMobileAdminMenuOpen(false);
                          }}
                          className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-medium transition cursor-pointer w-full text-left ${
                            active
                              ? 'bg-[#f4f3ee] text-[#11241c] font-semibold shadow-sm'
                              : 'text-white/80 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Icon className="w-4 h-4 shrink-0" />
                            <span className="truncate">{item.label}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {item.badge && (
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  active
                                    ? 'bg-[#11241c] text-white'
                                    : item.highlightBadge
                                    ? 'bg-[#e5c158] text-[#11241c]'
                                    : 'bg-white/15 text-white/85'
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}
                            <ChevronRight
                              className={`w-3.5 h-3.5 ${
                                active ? 'text-[#11241c]' : 'text-white/30'
                              }`}
                            />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Drawer Footer: Admin Profile + Storefront + Logout */}
            <div className="p-4 border-t border-white/10 space-y-2.5 bg-black/25">
              {adminUser && (
                <div className="px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-[9px] uppercase tracking-wider text-white/45 font-semibold">
                    Signed In Administrator
                  </p>
                  <p className="text-xs font-semibold text-white truncate mt-0.5">
                    {adminUser.name}
                  </p>
                  <p className="text-[11px] text-white/60 truncate">
                    {adminUser.email}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/"
                  target="_blank"
                  onClick={() => setMobileAdminMenuOpen(false)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-medium text-white transition"
                >
                  <span>Live Store</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMobileAdminMenuOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-xs font-semibold text-red-200 transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-7 lg:p-10 overflow-y-auto">
        {/* Contextual Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-6 sm:mb-8 border-b border-[#d7ded8]">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#11241c]/50 font-semibold">
              BUNON GENTS CONTROL CENTER
            </p>
            <h1 className="font-editorial text-3xl sm:text-4xl text-[#11241c] mt-0.5">
              {TAB_HEADERS[activeTab].title}
            </h1>
            <p className="text-xs text-[#11241c]/65 mt-1">
              {TAB_HEADERS[activeTab].subtitle}
            </p>
          </div>

          <div className="hidden sm:flex items-center gap-2.5 shrink-0">
            <Link
              href="/"
              target="_blank"
              className="px-4 py-2.5 rounded-xl bg-white border border-[#d7ded8] text-xs font-semibold hover:border-[#11241c] transition flex items-center gap-1.5 shadow-2xs"
            >
              <span>Live Store</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* ========================================================= */}
        {/* TAB 1: OVERVIEW                                           */}
        {/* ========================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-6 sm:space-y-8">
            {/* KPI Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#d7ded8] shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-[#11241c]/60 text-xs mb-2">
                  <span className="font-semibold uppercase tracking-wider text-[10px]">
                    Total Revenue
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-700">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <p className="font-editorial text-3xl font-bold text-[#11241c]">
                    {formatBDT(stats?.totalRevenue || 0)}
                  </p>
                  <p className="text-[11px] text-[#11241c]/55 mt-1">
                    {stats?.deliveredOrders || 0} delivered · excludes cancelled
                  </p>
                </div>
              </div>

              <div
                onClick={() => setActiveTab('orders')}
                className="bg-white p-5 sm:p-6 rounded-2xl border border-[#d7ded8] shadow-xs flex flex-col justify-between cursor-pointer hover:border-[#11241c]/40 transition"
              >
                <div className="flex items-center justify-between text-[#11241c]/60 text-xs mb-2">
                  <span className="font-semibold uppercase tracking-wider text-[10px]">
                    Total Orders
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-700">
                    <ShoppingCart className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <p className="font-editorial text-3xl font-bold text-[#11241c]">
                    {orders.length}
                  </p>
                  <p className="text-[11px] text-amber-700 font-semibold mt-1">
                    {pendingOrdersCount} pending action →
                  </p>
                </div>
              </div>

              <div
                onClick={() => setActiveTab('customers')}
                className="bg-white p-5 sm:p-6 rounded-2xl border border-[#d7ded8] shadow-xs flex flex-col justify-between cursor-pointer hover:border-[#11241c]/40 transition"
              >
                <div className="flex items-center justify-between text-[#11241c]/60 text-xs mb-2">
                  <span className="font-semibold uppercase tracking-wider text-[10px]">
                    Registered Customers
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-700">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <p className="font-editorial text-3xl font-bold text-[#11241c]">
                    {customersOnly.length}
                  </p>
                  <p className="text-[11px] text-[#11241c]/55 mt-1">
                    {customersOnly.filter((u) => u.isActive !== false).length} active accounts →
                  </p>
                </div>
              </div>

              <div
                onClick={() => setActiveTab('products')}
                className="bg-white p-5 sm:p-6 rounded-2xl border border-[#d7ded8] shadow-xs flex flex-col justify-between cursor-pointer hover:border-[#11241c]/40 transition"
              >
                <div className="flex items-center justify-between text-[#11241c]/60 text-xs mb-2">
                  <span className="font-semibold uppercase tracking-wider text-[10px]">
                    Product Catalog
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-[#11241c]/10 flex items-center justify-center text-[#11241c]">
                    <Package className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <p className="font-editorial text-3xl font-bold text-[#11241c]">
                    {products.length} Pieces
                  </p>
                  <p className="text-[11px] text-[#11241c]/55 mt-1">
                    Across {collections.length} collections →
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Action Bar */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#d7ded8] shadow-xs flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#11241c]/60">
                Quick Shortcuts
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    setActiveTab('products');
                    openCreateProduct();
                  }}
                  className="px-3.5 py-2 rounded-xl bg-[#11241c] text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-[#1b362a] transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Product</span>
                </button>
                <button
                  onClick={() => setActiveTab('storefront')}
                  className="px-3.5 py-2 rounded-xl bg-[#f4f3ee] hover:bg-[#e5ebe7] text-[#11241c] text-xs font-semibold flex items-center gap-1.5 border border-[#d7ded8] transition cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Customize Hero</span>
                </button>
                <button
                  onClick={() => setActiveTab('payments')}
                  className="px-3.5 py-2 rounded-xl bg-[#f4f3ee] hover:bg-[#e5ebe7] text-[#11241c] text-xs font-semibold flex items-center gap-1.5 border border-[#d7ded8] transition cursor-pointer"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Payments & WhatsApp</span>
                </button>
                <button
                  onClick={() => setActiveTab('admins')}
                  className="px-3.5 py-2 rounded-xl bg-[#f4f3ee] hover:bg-[#e5ebe7] text-[#11241c] text-xs font-semibold flex items-center gap-1.5 border border-[#d7ded8] transition cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin Team ({adminsList.length || 1})</span>
                </button>
              </div>
            </div>

            {/* Active Checkout & WhatsApp Configuration Banner */}
            {settings && (
              <div className="bg-[#11241c] text-white rounded-2xl p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-md">
                <div className="space-y-2">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-[#e5c158] font-semibold block">
                    ACTIVE STORE & PAYMENT CHANNELS
                  </span>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm">
                    <p>
                      <span className="text-pink-400 font-semibold">bKash:</span>{' '}
                      <span className="font-mono">{settings.bkashNumber}</span>
                    </p>
                    <p>
                      <span className="text-orange-400 font-semibold">Nagad:</span>{' '}
                      <span className="font-mono">{settings.nagadNumber}</span>
                    </p>
                    <p>
                      <span className="text-emerald-400 font-semibold">WhatsApp:</span>{' '}
                      <span className="font-mono">
                        {settings.whatsappNumber || '+880 1700-000000'}
                      </span>
                    </p>
                    <p className="text-white/75 text-xs">
                      Shipping: Dhaka ৳{settings.insideDhakaShipping} / Outside ৳
                      {settings.outsideDhakaShipping}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('payments')}
                  className="self-start lg:self-auto px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold transition cursor-pointer shrink-0"
                >
                  Configure Channels →
                </button>
              </div>
            )}

            {/* Recent Orders Table */}
            <div className="bg-white rounded-2xl border border-[#d7ded8] overflow-hidden shadow-xs">
              <div className="p-5 sm:p-6 border-b border-[#ebf0ec] flex items-center justify-between">
                <div>
                  <h2 className="font-editorial text-2xl font-semibold">
                    Recent Orders
                  </h2>
                  <p className="text-xs text-[#11241c]/55">
                    Latest 6 customer purchases placed on the storefront
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="px-3.5 py-2 rounded-xl bg-[#f4f3ee] hover:bg-[#11241c] hover:text-white text-xs font-semibold transition cursor-pointer"
                >
                  View All ({orders.length}) →
                </button>
              </div>

              {orders.length === 0 ? (
                <div className="p-10 text-center text-sm text-[#11241c]/60">
                  No customer orders placed yet.
                </div>
              ) : (
                <>
                  {/* Mobile Stacked Order Cards */}
                  <div className="md:hidden divide-y divide-[#ebf0ec]">
                    {orders.slice(0, 6).map((o) => (
                      <div key={o._id} className="p-4 space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono font-bold text-xs break-all">
                            {o.orderNumber}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border shrink-0 ${getOrderStatusBadgeClass(
                              o.orderStatus
                            )}`}
                          >
                            {o.orderStatus}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <div>
                            <p className="font-semibold text-[#11241c]">
                              {o.customerName}
                            </p>
                            <p className="text-[11px] text-[#11241c]/60">
                              {o.customerPhone} · {o.paymentMethod}
                            </p>
                          </div>
                          <p className="font-bold font-mono text-sm">
                            {formatBDT(o.totalAmount)}
                          </p>
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          {o.paymentDetails?.transactionId ? (
                            <span className="text-[10px] font-mono text-pink-700">
                              TrxID: {o.paymentDetails.transactionId}
                            </span>
                          ) : (
                            <span className="text-[10px] text-[#11241c]/45">
                              {new Date(o.createdAt).toLocaleDateString()}
                            </span>
                          )}
                          <button
                            onClick={() => setSelectedOrderModal(o)}
                            className="px-3 py-1.5 rounded-lg bg-[#11241c] text-white text-xs font-medium cursor-pointer"
                          >
                            Manage Order
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#f4f3ee] text-[#11241c]/60 uppercase tracking-wider text-[10px]">
                          <th className="py-3.5 px-5">Order ID</th>
                          <th className="py-3.5 px-5">Customer</th>
                          <th className="py-3.5 px-5">Payment</th>
                          <th className="py-3.5 px-5">Total</th>
                          <th className="py-3.5 px-5">Status</th>
                          <th className="py-3.5 px-5 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#ebf0ec]">
                        {orders.slice(0, 6).map((o) => (
                          <tr key={o._id} className="hover:bg-[#f4f3ee]/40">
                            <td className="py-3.5 px-5 font-mono font-bold">
                              {o.orderNumber}
                            </td>
                            <td className="py-3.5 px-5">
                              <p className="font-semibold">{o.customerName}</p>
                              <p className="text-[#11241c]/60">{o.customerPhone}</p>
                            </td>
                            <td className="py-3.5 px-5">
                              <span className="font-semibold">
                                {o.paymentMethod}
                              </span>
                              {o.paymentDetails?.transactionId && (
                                <span className="block text-[10px] font-mono text-pink-700">
                                  TrxID: {o.paymentDetails.transactionId}
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-5 font-bold font-mono">
                              {formatBDT(o.totalAmount)}
                            </td>
                            <td className="py-3.5 px-5">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${getOrderStatusBadgeClass(
                                  o.orderStatus
                                )}`}
                              >
                                {o.orderStatus}
                              </span>
                            </td>
                            <td className="py-3.5 px-5 text-right">
                              <button
                                onClick={() => setSelectedOrderModal(o)}
                                className="px-3 py-1.5 rounded-lg border border-[#d7ded8] hover:bg-[#11241c] hover:text-white transition cursor-pointer font-medium"
                              >
                                Manage
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: ORDERS                                             */}
        {/* ========================================================= */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#d7ded8] shadow-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  'All',
                  'Pending',
                  'Confirmed',
                  'Processing',
                  'Shipped',
                  'Delivered',
                  'Cancelled',
                ].map((st) => {
                  const count =
                    st === 'All'
                      ? orders.length
                      : orders.filter((o) => o.orderStatus === st).length;
                  return (
                    <button
                      key={st}
                      onClick={() => setOrderFilter(st)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                        orderFilter === st
                          ? 'bg-[#11241c] text-white shadow-2xs'
                          : 'bg-[#f4f3ee] text-[#11241c]/70 hover:text-[#11241c]'
                      }`}
                    >
                      <span>{st}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                          orderFilter === st
                            ? 'bg-white/20 text-white'
                            : 'bg-black/5 text-[#11241c]/60'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="relative w-full md:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#11241c]/40" />
                <input
                  type="text"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Search Order ID, Phone, TrxID..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#d7ded8] text-xs focus:outline-none focus:border-[#11241c]"
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#d7ded8] overflow-hidden shadow-xs">
              {filteredOrders.length === 0 ? (
                <div className="p-12 text-center text-sm text-[#11241c]/60">
                  No matching orders found.
                </div>
              ) : (
                <>
                  {/* Mobile Orders Card List */}
                  <div className="md:hidden divide-y divide-[#ebf0ec]">
                    {filteredOrders.map((order) => (
                      <div key={order._id} className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-mono font-bold text-xs break-all block">
                              {order.orderNumber}
                            </span>
                            <span className="text-[10px] text-[#11241c]/50">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <span className="font-bold font-mono text-sm text-[#11241c]">
                            {formatBDT(order.totalAmount)}
                          </span>
                        </div>

                        <div className="bg-[#f4f3ee]/70 p-3 rounded-xl text-xs space-y-1">
                          <p className="font-semibold">{order.customerName}</p>
                          <p className="text-[#11241c]/70">
                            {order.customerPhone}
                          </p>
                          <p className="text-[11px] text-[#11241c]/55">
                            {order.shippingAddress.address},{' '}
                            {order.shippingAddress.city}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              order.paymentMethod === 'bKash'
                                ? 'bg-pink-100 text-pink-800'
                                : order.paymentMethod === 'Nagad'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {order.paymentMethod} ({order.paymentStatus})
                          </span>
                          {order.paymentDetails?.transactionId && (
                            <span className="text-[11px] font-mono text-pink-700">
                              TrxID: <strong>{order.paymentDetails.transactionId}</strong>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <select
                            value={order.orderStatus}
                            onChange={(e) =>
                              handleUpdateOrder(order._id, {
                                orderStatus: e.target.value,
                              })
                            }
                            className="flex-1 px-3 py-2 rounded-xl border border-[#d7ded8] bg-[#f4f3ee] text-xs font-semibold cursor-pointer"
                          >
                            {[
                              'Pending',
                              'Confirmed',
                              'Processing',
                              'Shipped',
                              'Delivered',
                              'Cancelled',
                            ].map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>

                          <button
                            onClick={() => setSelectedOrderModal(order)}
                            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#11241c] text-white text-xs font-medium cursor-pointer shrink-0"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Orders Table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#f4f3ee] text-[#11241c]/60 uppercase tracking-wider text-[10px]">
                          <th className="py-3.5 px-5">Order</th>
                          <th className="py-3.5 px-5">Customer & Address</th>
                          <th className="py-3.5 px-5">Payment & TrxID</th>
                          <th className="py-3.5 px-5">Amount</th>
                          <th className="py-3.5 px-5">Order Status</th>
                          <th className="py-3.5 px-5 text-right">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#ebf0ec]">
                        {filteredOrders.map((order) => (
                          <tr key={order._id} className="hover:bg-[#f4f3ee]/40">
                            <td className="py-4 px-5">
                              <span className="font-mono font-bold block">
                                {order.orderNumber}
                              </span>
                              <span className="text-[10px] text-[#11241c]/50">
                                {new Date(order.createdAt).toLocaleDateString()}
                              </span>
                            </td>
                            <td className="py-4 px-5">
                              <p className="font-semibold">{order.customerName}</p>
                              <p className="text-[#11241c]/70">
                                {order.customerPhone}
                              </p>
                              <p className="text-[11px] text-[#11241c]/55 truncate max-w-xs">
                                {order.shippingAddress.address},{' '}
                                {order.shippingAddress.city}
                              </p>
                            </td>
                            <td className="py-4 px-5">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                  order.paymentMethod === 'bKash'
                                    ? 'bg-pink-100 text-pink-800'
                                    : order.paymentMethod === 'Nagad'
                                    ? 'bg-orange-100 text-orange-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {order.paymentMethod} ({order.paymentStatus})
                              </span>
                              {order.paymentDetails?.transactionId && (
                                <div className="mt-1 text-[11px] font-mono">
                                  <span className="text-[#11241c]/60">From:</span>{' '}
                                  {order.paymentDetails.senderNumber}
                                  <br />
                                  <span className="text-[#11241c]/60">
                                    TrxID:
                                  </span>{' '}
                                  <strong>
                                    {order.paymentDetails.transactionId}
                                  </strong>
                                </div>
                              )}
                            </td>
                            <td className="py-4 px-5 font-bold font-mono text-sm">
                              {formatBDT(order.totalAmount)}
                            </td>
                            <td className="py-4 px-5">
                              <select
                                value={order.orderStatus}
                                onChange={(e) =>
                                  handleUpdateOrder(order._id, {
                                    orderStatus: e.target.value,
                                  })
                                }
                                className="px-3 py-1.5 rounded-lg border border-[#d7ded8] bg-[#f4f3ee] text-xs font-semibold cursor-pointer"
                              >
                                {[
                                  'Pending',
                                  'Confirmed',
                                  'Processing',
                                  'Shipped',
                                  'Delivered',
                                  'Cancelled',
                                ].map((st) => (
                                  <option key={st} value={st}>
                                    {st}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="py-4 px-5 text-right">
                              <button
                                onClick={() => setSelectedOrderModal(order)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#11241c] text-white text-xs font-medium cursor-pointer hover:bg-[#1c382c] transition"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>View</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: CUSTOMERS                                          */}
        {/* ========================================================= */}
        {activeTab === 'customers' && (
          <div className="space-y-6">
            {/* Customer Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#d7ded8] shadow-xs">
                <div className="flex items-center justify-between text-xs text-[#11241c]/60 mb-2">
                  <span>Total Registered Customers</span>
                  <Users className="w-4 h-4 text-[#11241c]" />
                </div>
                <p className="font-editorial text-3xl font-bold">
                  {customersOnly.length}
                </p>
              </div>

              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#d7ded8] shadow-xs">
                <div className="flex items-center justify-between text-xs text-[#11241c]/60 mb-2">
                  <span>Active Users</span>
                  <UserCheck className="w-4 h-4 text-emerald-700" />
                </div>
                <p className="font-editorial text-3xl font-bold text-emerald-900">
                  {customersOnly.filter((u) => u.isActive !== false).length}
                </p>
              </div>

              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#d7ded8] shadow-xs">
                <div className="flex items-center justify-between text-xs text-[#11241c]/60 mb-2">
                  <span>Suspended / Blocked Users</span>
                  <UserX className="w-4 h-4 text-red-600" />
                </div>
                <p className="font-editorial text-3xl font-bold text-red-700">
                  {customersOnly.filter((u) => u.isActive === false).length}
                </p>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#d7ded8] shadow-xs">
              <div className="flex items-center gap-2">
                {(['All', 'Active', 'Suspended'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setUserStatusFilter(st)}
                    className={`px-4 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
                      userStatusFilter === st
                        ? 'bg-[#11241c] text-white'
                        : 'bg-[#f4f3ee] text-[#11241c]/70 hover:text-[#11241c]'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#11241c]/40" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search name, email, phone..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#d7ded8] text-xs focus:outline-none focus:border-[#11241c]"
                />
              </div>
            </div>

            {/* Customers Table */}
            <div className="bg-white rounded-2xl border border-[#d7ded8] overflow-hidden shadow-xs">
              {customersOnly.length === 0 ? (
                <div className="p-12 text-center text-sm text-[#11241c]/60">
                  No customer accounts created yet.
                </div>
              ) : (
                <>
                  {/* Mobile Customer Cards */}
                  <div className="md:hidden divide-y divide-[#ebf0ec]">
                    {customersOnly
                      .filter((u) => {
                        if (userStatusFilter === 'Active')
                          return u.isActive !== false;
                        if (userStatusFilter === 'Suspended')
                          return u.isActive === false;
                        return true;
                      })
                      .filter((u) => {
                        if (!userSearch.trim()) return true;
                        const q = userSearch.toLowerCase();
                        return (
                          u.name.toLowerCase().includes(q) ||
                          u.email.toLowerCase().includes(q) ||
                          (u.phone || '').includes(q)
                        );
                      })
                      .map((u) => (
                        <div key={u._id} className="p-4 space-y-3 text-xs">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-bold text-sm truncate">
                                {u.name}
                              </p>
                              <p className="text-[#11241c]/65 truncate">
                                {u.email}
                              </p>
                              <p className="text-[#11241c]/60 mt-0.5">
                                {u.phone || 'No phone'}
                              </p>
                            </div>
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${
                                u.isActive !== false
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {u.isActive !== false ? 'Active' : 'Suspended'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between bg-[#f4f3ee]/70 px-3 py-2 rounded-xl">
                            <span>
                              <strong>{u.ordersCount || 0}</strong> orders
                            </span>
                            <span className="text-emerald-800 font-semibold font-mono">
                              {formatBDT(u.totalSpent || 0)} spent
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSelectedUserModal(u)}
                              className="flex-1 py-2 rounded-xl bg-[#11241c] text-white text-xs font-medium cursor-pointer"
                            >
                              Details
                            </button>
                            <button
                              onClick={() => handleToggleUserStatus(u)}
                              className={`flex-1 py-2 rounded-xl text-xs font-medium border cursor-pointer ${
                                u.isActive !== false
                                  ? 'border-amber-300 bg-amber-50 text-amber-800'
                                  : 'border-emerald-300 bg-emerald-50 text-emerald-800'
                              }`}
                            >
                              {u.isActive !== false ? 'Suspend' : 'Activate'}
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>

                  {/* Desktop Customers Table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#f4f3ee] text-[#11241c]/60 uppercase tracking-wider text-[10px]">
                          <th className="py-3.5 px-5">Customer</th>
                          <th className="py-3.5 px-5">Phone & Location</th>
                          <th className="py-3.5 px-5">Orders & Spent</th>
                          <th className="py-3.5 px-5">Joined / Last Login</th>
                          <th className="py-3.5 px-5">Status</th>
                          <th className="py-3.5 px-5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#ebf0ec]">
                        {customersOnly
                          .filter((u) => {
                            if (userStatusFilter === 'Active')
                              return u.isActive !== false;
                            if (userStatusFilter === 'Suspended')
                              return u.isActive === false;
                            return true;
                          })
                          .filter((u) => {
                            if (!userSearch.trim()) return true;
                            const q = userSearch.toLowerCase();
                            return (
                              u.name.toLowerCase().includes(q) ||
                              u.email.toLowerCase().includes(q) ||
                              (u.phone || '').includes(q)
                            );
                          })
                          .map((u) => (
                            <tr key={u._id} className="hover:bg-[#f4f3ee]/40">
                              <td className="py-4 px-5">
                                <p className="font-bold text-sm">{u.name}</p>
                                <p className="text-[#11241c]/65">{u.email}</p>
                              </td>
                              <td className="py-4 px-5">
                                <p className="font-medium">
                                  {u.phone || 'No phone'}
                                </p>
                                <p className="text-[11px] text-[#11241c]/55 truncate max-w-xs">
                                  {u.address
                                    ? `${u.address}, ${u.city || ''}`
                                    : 'No saved address'}
                                </p>
                              </td>
                              <td className="py-4 px-5">
                                <p className="font-bold">
                                  {u.ordersCount || 0} orders
                                </p>
                                <p className="text-emerald-800 font-semibold font-mono">
                                  {formatBDT(u.totalSpent || 0)} spent
                                </p>
                              </td>
                              <td className="py-4 px-5 text-[11px] text-[#11241c]/65">
                                <p>
                                  Joined:{' '}
                                  {u.createdAt
                                    ? new Date(u.createdAt).toLocaleDateString()
                                    : '-'}
                                </p>
                                <p>
                                  Active:{' '}
                                  {u.lastLogin
                                    ? new Date(u.lastLogin).toLocaleDateString()
                                    : '-'}
                                </p>
                              </td>
                              <td className="py-4 px-5">
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                                    u.isActive !== false
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-red-100 text-red-700'
                                  }`}
                                >
                                  {u.isActive !== false ? 'Active' : 'Suspended'}
                                </span>
                              </td>
                              <td className="py-4 px-5 text-right space-x-2">
                                <button
                                  onClick={() => setSelectedUserModal(u)}
                                  className="px-3 py-1.5 rounded-lg bg-[#11241c] text-white text-xs font-medium cursor-pointer"
                                >
                                  Details
                                </button>
                                <button
                                  onClick={() => handleToggleUserStatus(u)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer ${
                                    u.isActive !== false
                                      ? 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'
                                      : 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                                  }`}
                                >
                                  {u.isActive !== false ? 'Suspend' : 'Activate'}
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: PRODUCTS                                           */}
        {/* ========================================================= */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            {/* Catalog Filter & Action Bar */}
            <div className="bg-white p-4 rounded-2xl border border-[#d7ded8] shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-1.5">
                {productCategories.map((cat) => {
                  const count =
                    cat === 'All'
                      ? products.length
                      : products.filter(
                          (p) => p.category.toLowerCase() === cat.toLowerCase()
                        ).length;
                  return (
                    <button
                      key={cat}
                      onClick={() => setAdminProdCategory(cat)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                        adminProdCategory === cat
                          ? 'bg-[#11241c] text-white'
                          : 'bg-[#f4f3ee] text-[#11241c]/70 hover:text-[#11241c]'
                      }`}
                    >
                      <span>{cat}</span>
                      <span
                        className={`text-[10px] px-1.5 rounded-full ${
                          adminProdCategory === cat
                            ? 'bg-white/20 text-white'
                            : 'bg-black/5 text-[#11241c]/55'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}

                {/* Add / Manage Category Pill Button */}
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(true)}
                  className="px-3.5 py-1.5 rounded-full text-xs font-semibold border border-dashed border-[#11241c]/35 bg-[#f4f3ee]/60 text-[#11241c] hover:bg-[#11241c] hover:text-white hover:border-[#11241c] transition cursor-pointer flex items-center gap-1"
                  title="Create or manage product categories"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Category</span>
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <div className="relative flex-1 sm:w-56">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#11241c]/40" />
                  <input
                    type="text"
                    value={adminProdSearch}
                    onChange={(e) => setAdminProdSearch(e.target.value)}
                    placeholder="Search piece title..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#d7ded8] text-xs focus:outline-none focus:border-[#11241c]"
                  />
                </div>
                <button
                  onClick={openCreateProduct}
                  className="px-4 py-2.5 rounded-xl bg-[#11241c] text-white text-xs uppercase tracking-widest font-semibold flex items-center justify-center gap-2 hover:bg-[#1b362a] transition cursor-pointer shadow-xs shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Piece</span>
                </button>
              </div>
            </div>

            {filteredAdminProducts.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-[#d7ded8] text-sm text-[#11241c]/60">
                No products match the selected filter.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredAdminProducts.map((p) => {
                  const totalPhotos =
                    (p.image ? 1 : 0) + (p.gallery ? p.gallery.length : 0);
                  return (
                    <div
                      key={p._id}
                      className="bg-white rounded-2xl p-3.5 border border-[#d7ded8] shadow-xs flex flex-col justify-between hover:border-[#11241c]/30 transition"
                    >
                      <div>
                        <div className="relative h-56 rounded-xl overflow-hidden bg-[#ebf0ec] mb-3">
                          <img
                            src={p.image}
                            alt={p.title}
                            className="w-full h-full object-cover"
                          />
                          {p.badge && (
                            <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-md bg-white/90 text-[9px] font-bold uppercase tracking-wider shadow-2xs">
                              {p.badge}
                            </span>
                          )}
                          {totalPhotos > 1 && (
                            <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/65 text-white text-[10px] font-medium flex items-center gap-1 backdrop-blur-xs">
                              <ImageIcon className="w-3 h-3" />
                              <span>{totalPhotos}</span>
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] uppercase tracking-widest text-[#11241c]/50 font-semibold">
                          {p.category}
                        </p>
                        <h3 className="font-editorial text-2xl font-semibold text-[#11241c] truncate">
                          {p.title}
                        </h3>
                        <div className="flex items-center justify-between mt-1.5">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-sm font-bold font-mono">
                              {formatBDT(p.price)}
                            </span>
                            {p.originalPrice && p.originalPrice > p.price && (
                              <span className="text-[11px] text-[#11241c]/40 line-through font-mono">
                                {formatBDT(p.originalPrice)}
                              </span>
                            )}
                          </div>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              p.inStock
                                ? 'bg-emerald-50 text-emerald-800'
                                : 'bg-red-50 text-red-700'
                            }`}
                          >
                            {p.inStock ? `Stock: ${p.stock}` : 'Out of Stock'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[#ebf0ec]">
                        <button
                          onClick={() => openEditProduct(p)}
                          className="flex-1 py-2 rounded-lg bg-[#f4f3ee] hover:bg-[#11241c] hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>Edit Piece</span>
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p._id)}
                          className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition cursor-pointer"
                          title="Delete product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: COLLECTIONS                                        */}
        {/* ========================================================= */}
        {activeTab === 'collections' && (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-2xl border border-[#d7ded8] shadow-xs flex flex-wrap items-center justify-between gap-4">
              <p className="text-xs text-[#11241c]/70">
                Manage the featured collection cards displayed in the &quot;Our Collections&quot; section on the storefront.
              </p>
              <button
                onClick={() => openEditCollection()}
                className="px-5 py-2.5 rounded-xl bg-[#11241c] text-white text-xs uppercase tracking-widest font-semibold flex items-center gap-2 cursor-pointer hover:bg-[#1a3529] transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add Collection Card</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {collections.map((col) => (
                <div
                  key={col._id}
                  className="bg-white rounded-2xl p-6 border border-[#d7ded8] shadow-xs flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-[#11241c]/60 font-semibold">
                      <span>{col.numberLabel}</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#ebf0ec] text-[#11241c]">
                        {col.status}
                      </span>
                    </div>
                    <h3 className="font-editorial text-4xl mt-2">{col.title}</h3>
                    <p className="text-xs text-[#11241c]/60 mt-1">
                      {col.subtitle}
                    </p>
                    {col.image && (
                      <img
                        src={col.image}
                        alt={col.title}
                        className="w-full h-40 object-cover rounded-xl mt-3"
                      />
                    )}
                  </div>

                  <div className="flex gap-2 pt-3 border-t border-[#ebf0ec]">
                    <button
                      onClick={() => openEditCollection(col)}
                      className="flex-1 py-2 rounded-lg bg-[#f4f3ee] hover:bg-[#11241c] hover:text-white text-xs font-semibold transition cursor-pointer"
                    >
                      Edit Card
                    </button>
                    <button
                      onClick={() => handleDeleteCollection(col._id)}
                      className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 6: HERO & STOREFRONT CONTENT                          */}
        {/* ========================================================= */}
        {activeTab === 'storefront' && settings && (
          <form
            onSubmit={handleSaveSettings}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8"
          >
            {/* Left Column: Hero & Storefront Inputs */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#d7ded8] shadow-xs space-y-5">
                <div className="flex items-center gap-2.5 border-b border-[#ebf0ec] pb-3">
                  <Sparkles className="w-5 h-5 text-[#11241c]" />
                  <h2 className="font-editorial text-2xl font-semibold">
                    Hero Section &amp; Announcement Bar
                  </h2>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">
                    Top Announcement Bar Text
                  </label>
                  <input
                    type="text"
                    value={settings.topAnnouncement || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        topAnnouncement: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-[#d7ded8] bg-[#f4f3ee]/50 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">
                    Hero Small Subtitle / Kicker Badge
                  </label>
                  <input
                    type="text"
                    value={settings.heroSubtitle || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        heroSubtitle: e.target.value,
                      })
                    }
                    placeholder="A NEW WAY TO WEAR EVERYDAY"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#d7ded8] bg-[#f4f3ee]/50 text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5">
                      Hero Headline Line 1
                    </label>
                    <input
                      type="text"
                      value={settings.heroTitleLine1 || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          heroTitleLine1: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-[#d7ded8] bg-[#f4f3ee]/50 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5">
                      Hero Headline Line 2 (Italic Accent)
                    </label>
                    <input
                      type="text"
                      value={settings.heroTitleLine2 || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          heroTitleLine2: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-[#d7ded8] bg-[#f4f3ee]/50 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">
                    Hero Description Paragraph
                  </label>
                  <textarea
                    rows={3}
                    value={settings.heroDescription || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        heroDescription: e.target.value,
                      })
                    }
                    placeholder="Thoughtful pieces for the moments that make up your life..."
                    className="w-full px-4 py-2.5 rounded-xl border border-[#d7ded8] bg-[#f4f3ee]/50 text-sm leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">
                    Hero Background Image (Upload via ImgBB or paste URL)
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={settings.heroImage || ''}
                      onChange={(e) =>
                        setSettings({ ...settings, heroImage: e.target.value })
                      }
                      className="flex-1 px-4 py-2.5 rounded-xl border border-[#d7ded8] bg-[#f4f3ee]/50 text-sm"
                    />
                    <label className="px-4 py-2.5 rounded-xl bg-[#11241c] text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shrink-0">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploadingImg ? '...' : 'Upload'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          handleImageFileSelect(e, (url) =>
                            setSettings({ ...settings, heroImage: url })
                          )
                        }
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Store Contact Details Card */}
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#d7ded8] shadow-xs space-y-4">
                <h3 className="font-editorial text-2xl font-semibold border-b border-[#ebf0ec] pb-3">
                  Store Contact &amp; Footer Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5">
                      Support Email Address
                    </label>
                    <input
                      type="email"
                      value={settings.contactEmail || ''}
                      onChange={(e) =>
                        setSettings({ ...settings, contactEmail: e.target.value })
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-[#d7ded8] bg-[#f4f3ee]/50 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5">
                      Customer Hotline Phone
                    </label>
                    <input
                      type="text"
                      value={settings.contactPhone || ''}
                      onChange={(e) =>
                        setSettings({ ...settings, contactPhone: e.target.value })
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-[#d7ded8] bg-[#f4f3ee]/50 text-sm"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#11241c] text-white text-xs uppercase tracking-widest font-semibold hover:bg-[#1a3529] transition cursor-pointer shadow-md flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Storefront Content</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Live Hero Preview */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-2xl p-6 border border-[#d7ded8] shadow-xs space-y-4 lg:sticky lg:top-8">
                <div className="flex items-center justify-between border-b border-[#ebf0ec] pb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#11241c]/60">
                    Live Storefront Preview
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    Real-time
                  </span>
                </div>

                {/* Top announcement preview */}
                <div className="rounded-lg bg-[#0d1d16] text-white/85 text-[9px] tracking-[0.2em] uppercase py-2 px-3 text-center truncate">
                  {settings.topAnnouncement || "THE MEN'S COLLECTION IS HERE"}
                </div>

                {/* Hero Box Preview */}
                <div className="relative rounded-2xl overflow-hidden bg-[#132920] text-white p-6 shadow-md border border-white/10 min-h-[260px] flex flex-col justify-end">
                  {settings.heroImage && (
                    <img
                      src={settings.heroImage}
                      alt="Hero Live Preview"
                      className="absolute inset-0 w-full h-full object-cover opacity-45"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0e2219] via-[#132920]/75 to-transparent" />
                  <div className="relative z-10 space-y-2">
                    <span className="text-[10px] tracking-[0.2em] uppercase font-bold text-[#e5c158] block">
                      {settings.heroSubtitle || 'A NEW WAY TO WEAR EVERYDAY'}
                    </span>
                    <h3 className="font-editorial text-3xl sm:text-4xl font-bold leading-none">
                      <span className="block">
                        {settings.heroTitleLine1 || 'Wear what'}
                      </span>
                      <span className="block italic font-normal text-white/90 mt-1">
                        {settings.heroTitleLine2 || 'feels like you.'}
                      </span>
                    </h3>
                    <p className="text-xs text-white/80 line-clamp-3 leading-relaxed pt-1">
                      {settings.heroDescription ||
                        "Thoughtful pieces for the moments that make up your life. Discover the men's collection—easy to wear, made to stand out."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </form>
        )}

        {/* ========================================================= */}
        {/* TAB 7: PAYMENTS, SHIPPING & WHATSAPP                      */}
        {/* ========================================================= */}
        {activeTab === 'payments' && settings && (
          <form onSubmit={handleSaveSettings} className="space-y-6 max-w-5xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Mobile Banking & COD Card */}
              <div className="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-8 border border-[#d7ded8] shadow-xs space-y-5">
                <div className="flex items-center gap-2.5 border-b border-[#ebf0ec] pb-3">
                  <Smartphone className="w-5 h-5 text-pink-600" />
                  <h2 className="font-editorial text-2xl font-semibold">
                    bKash, Nagad &amp; Cash on Delivery
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-[#f4f3ee]/60 border border-[#d7ded8] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-pink-700">
                        bKash Number
                      </label>
                      <input
                        type="checkbox"
                        checked={settings.bkashActive}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            bkashActive: e.target.checked,
                          })
                        }
                        className="w-4 h-4 accent-pink-600 cursor-pointer"
                      />
                    </div>
                    <input
                      type="text"
                      value={settings.bkashNumber}
                      onChange={(e) =>
                        setSettings({ ...settings, bkashNumber: e.target.value })
                      }
                      placeholder="017XX-XXXXXX"
                      className="w-full px-3.5 py-2 rounded-lg border border-[#d7ded8] bg-white text-xs font-mono"
                    />
                  </div>

                  <div className="p-4 rounded-xl bg-[#f4f3ee]/60 border border-[#d7ded8] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-orange-700">
                        Nagad Number
                      </label>
                      <input
                        type="checkbox"
                        checked={settings.nagadActive}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            nagadActive: e.target.checked,
                          })
                        }
                        className="w-4 h-4 accent-orange-600 cursor-pointer"
                      />
                    </div>
                    <input
                      type="text"
                      value={settings.nagadNumber}
                      onChange={(e) =>
                        setSettings({ ...settings, nagadNumber: e.target.value })
                      }
                      placeholder="018XX-XXXXXX"
                      className="w-full px-3.5 py-2 rounded-lg border border-[#d7ded8] bg-white text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#f4f3ee]/60 border border-[#d7ded8] flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold">
                      Cash on Delivery (COD)
                    </p>
                    <p className="text-[11px] text-[#11241c]/60">
                      Allow customers to pay cash upon receiving their order
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.codActive}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        codActive: e.target.checked,
                      })
                    }
                    className="w-4 h-4 accent-[#11241c] cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">
                    Checkout Payment Instructions
                  </label>
                  <textarea
                    rows={2}
                    value={settings.paymentInstructions}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        paymentInstructions: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-[#d7ded8] bg-[#f4f3ee]/50 text-xs leading-relaxed"
                  />
                </div>
              </div>

              {/* Delivery Zone Fees Card */}
              <div className="lg:col-span-5 bg-white rounded-2xl p-6 sm:p-8 border border-[#d7ded8] shadow-xs flex flex-col justify-between space-y-5">
                <div className="space-y-4">
                  <div className="flex items-center gap-2.5 border-b border-[#ebf0ec] pb-3">
                    <Truck className="w-5 h-5 text-[#11241c]" />
                    <h2 className="font-editorial text-2xl font-semibold">
                      Delivery Zone Charges
                    </h2>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1.5">
                      Inside Dhaka Delivery Fee (৳)
                    </label>
                    <input
                      type="number"
                      value={settings.insideDhakaShipping}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          insideDhakaShipping: Number(e.target.value),
                        })
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-[#d7ded8] bg-[#f4f3ee]/50 text-sm font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1.5">
                      Outside Dhaka Delivery Fee (৳)
                    </label>
                    <input
                      type="number"
                      value={settings.outsideDhakaShipping}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          outsideDhakaShipping: Number(e.target.value),
                        })
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-[#d7ded8] bg-[#f4f3ee]/50 text-sm font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-[11px] text-emerald-900">
                  Delivery fees are automatically added to the customer&apos;s order total during checkout based on their selected zone.
                </div>
              </div>
            </div>

            {/* WhatsApp Live Support Configuration */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#d7ded8] shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#ebf0ec] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-editorial text-2xl font-semibold">
                      WhatsApp Floating Chat Button
                    </h2>
                    <p className="text-xs text-[#11241c]/60">
                      Let customers message your team directly from the bottom-right corner of the site
                    </p>
                  </div>
                </div>

                <label className="inline-flex items-center gap-2 text-xs font-semibold cursor-pointer shrink-0 bg-[#f4f3ee] px-3.5 py-2 rounded-xl border border-[#d7ded8]">
                  <input
                    type="checkbox"
                    checked={settings.whatsappActive ?? true}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        whatsappActive: e.target.checked,
                      })
                    }
                    className="w-4 h-4 accent-emerald-600 rounded"
                  />
                  <span>Show Button on Storefront</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">
                    WhatsApp Phone Number
                  </label>
                  <input
                    type="text"
                    value={settings.whatsappNumber ?? ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        whatsappNumber: e.target.value,
                      })
                    }
                    placeholder="+880 1700-000000 or 017XXXXXXXX"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#d7ded8] bg-[#f4f3ee]/50 text-sm font-mono"
                  />
                  <p className="text-[11px] text-[#11241c]/50 mt-1">
                    Supports local (017XXXXXXXX) or international (+88017XXXXXXXX) format.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">
                    Pre-filled Customer Greeting
                  </label>
                  <input
                    type="text"
                    value={settings.whatsappMessage ?? ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        whatsappMessage: e.target.value,
                      })
                    }
                    placeholder="Hello Bunon Gents! I would like to inquire about your collection."
                    className="w-full px-4 py-2.5 rounded-xl border border-[#d7ded8] bg-[#f4f3ee]/50 text-sm"
                  />
                  <p className="text-[11px] text-[#11241c]/50 mt-1">
                    Default message pre-populated when a customer clicks the WhatsApp icon.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-[#ebf0ec]">
                {settings.whatsappNumber ? (
                  <a
                    href={`https://wa.me/${settings.whatsappNumber
                      .replace(/\D/g, '')
                      .replace(/^01/, '8801')}?text=${encodeURIComponent(
                      settings.whatsappMessage || 'Hello Bunon Gents!'
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold hover:bg-emerald-100 transition border border-emerald-200"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Test WhatsApp Chat Link</span>
                  </a>
                ) : (
                  <div />
                )}

                <button
                  type="submit"
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#11241c] text-white text-xs uppercase tracking-widest font-semibold hover:bg-[#1a3529] transition cursor-pointer shadow-md flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Payment &amp; WhatsApp Settings</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* ========================================================= */}
        {/* TAB 8: ADMIN TEAM & SECURITY                              */}
        {/* ========================================================= */}
        {activeTab === 'admins' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 max-w-5xl">
            {/* Left Column: Multiple Admin Team Directory */}
            <div className="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-8 border border-[#d7ded8] shadow-xs space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ebf0ec] pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#11241c]/10 flex items-center justify-center text-[#11241c]">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-editorial text-2xl font-semibold">
                      Administrator Team ({adminsList.length || 1})
                    </h2>
                    <p className="text-xs text-[#11241c]/60">
                      Team members with full dashboard and order management privileges
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddAdminModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#11241c] text-white text-xs font-semibold hover:bg-[#1d3d2f] transition cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Admin</span>
                </button>
              </div>

              <div className="divide-y divide-[#ebf0ec]">
                {(adminsList.length > 0
                  ? adminsList
                  : usersList.filter((u) => u.role === 'admin')
                ).map((adm) => {
                  const isSelf =
                    adminUser?.email?.toLowerCase() ===
                    adm.email?.toLowerCase();
                  return (
                    <div
                      key={adm._id}
                      className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-[#11241c] text-[#e5c158] font-bold flex items-center justify-center text-xs shrink-0">
                          {adm.name?.charAt(0).toUpperCase() || 'A'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-[#11241c] truncate">
                              {adm.name}
                            </span>
                            {isSelf && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[9px] uppercase">
                                You
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#11241c]/60 truncate">
                            {adm.email}
                            {adm.phone ? ` · ${adm.phone}` : ''}
                          </p>
                        </div>
                      </div>

                      {!isSelf && (
                        <button
                          type="button"
                          onClick={() => handleDeleteAdmin(adm._id, adm.email)}
                          className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-600 text-red-600 hover:text-white text-xs font-medium transition cursor-pointer flex items-center gap-1 shrink-0"
                          title="Remove admin privileges"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Remove</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Update Current Admin Credentials */}
            <div className="lg:col-span-5">
              <form
                onSubmit={handleUpdateAdminCredentials}
                className="bg-white rounded-2xl p-6 sm:p-8 border border-[#d7ded8] shadow-xs space-y-4"
              >
                <div className="flex items-center gap-2.5 border-b border-[#ebf0ec] pb-3">
                  <Lock className="w-4 h-4 text-[#11241c]" />
                  <h3 className="font-editorial text-2xl font-semibold">
                    My Login Credentials
                  </h3>
                </div>

                <p className="text-xs text-[#11241c]/60 leading-relaxed">
                  Update your own administrator email address or change your password.
                </p>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">
                    My Admin Email
                  </label>
                  <input
                    type="email"
                    required
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#d7ded8] bg-[#f4f3ee]/50 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">
                    New Password (leave blank to keep current)
                  </label>
                  <input
                    type="password"
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#d7ded8] bg-[#f4f3ee]/50 text-xs"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-[#11241c] text-white text-xs uppercase tracking-widest font-semibold hover:bg-[#1b382b] transition cursor-pointer shadow-sm"
                >
                  Update My Credentials
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* MODAL: MANAGE PRODUCT CATEGORIES */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-[#d7ded8] shadow-2xl space-y-5 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-[#ebf0ec]">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[#11241c]/50 font-semibold">
                  Catalog Organization
                </span>
                <h2 className="font-editorial text-2xl sm:text-3xl font-semibold">
                  Product Categories
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                className="p-2 rounded-full hover:bg-black/5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Create New Category Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddCategory(newCategoryName);
              }}
              className="space-y-2"
            >
              <label className="block text-xs font-semibold text-[#11241c]">
                Create New Category Tab
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g. Jackets, Panjabi, Polos, Trousers..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#d7ded8] bg-[#f4f3ee]/60 text-xs focus:outline-none focus:border-[#11241c]"
                />
                <button
                  type="submit"
                  disabled={!newCategoryName.trim() || savingCategory}
                  className="px-4 py-2.5 rounded-xl bg-[#11241c] text-white text-xs font-semibold hover:bg-[#1a3529] transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{savingCategory ? 'Adding...' : 'Add'}</span>
                </button>
              </div>
              <p className="text-[11px] text-[#11241c]/55">
                New categories immediately appear in the Admin Product Catalog filter bar, Product creation dropdown, and Live Storefront.
              </p>
            </form>

            {/* Existing Categories List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              <p className="text-[10px] uppercase tracking-wider text-[#11241c]/50 font-semibold">
                Active Categories ({configuredCategories.length})
              </p>
              <div className="divide-y divide-[#ebf0ec] border border-[#d7ded8] rounded-2xl overflow-hidden bg-[#f4f3ee]/40">
                {configuredCategories.map((cat) => {
                  const count = products.filter(
                    (p) => p.category.toLowerCase() === cat.toLowerCase()
                  ).length;
                  return (
                    <div
                      key={cat}
                      className="px-4 py-3 flex items-center justify-between gap-3 text-xs bg-white/80 hover:bg-white transition"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="font-semibold text-[#11241c] truncate">
                          {cat}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-[#ebf0ec] text-[#11241c]/70 text-[10px] font-semibold">
                          {count} {count === 1 ? 'piece' : 'pieces'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat)}
                        disabled={savingCategory || configuredCategories.length <= 1}
                        className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition cursor-pointer disabled:opacity-30"
                        title={`Remove ${cat}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 border-t border-[#ebf0ec] flex justify-end">
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                className="px-5 py-2.5 rounded-xl bg-[#11241c] text-white text-xs font-semibold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD NEW ADMIN */}
      {showAddAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-[#d7ded8] shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#ebf0ec] mb-5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#11241c]" />
                <h2 className="font-editorial text-2xl font-semibold">
                  Add New Administrator
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowAddAdminModal(false)}
                className="p-1.5 rounded-full hover:bg-black/5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-[#11241c]">
                  Admin Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#d7ded8] bg-[#f4f3ee]/50 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-[#11241c]">
                  Admin Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={newAdminEmailInput}
                  onChange={(e) => setNewAdminEmailInput(e.target.value)}
                  placeholder="admin2@bunongents.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#d7ded8] bg-[#f4f3ee]/50 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-[#11241c]">
                  Phone Number (Optional)
                </label>
                <input
                  type="text"
                  value={newAdminPhone}
                  onChange={(e) => setNewAdminPhone(e.target.value)}
                  placeholder="+880 1700-000000"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#d7ded8] bg-[#f4f3ee]/50 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-[#11241c]">
                  Initial Password (min 6 characters) *
                </label>
                <input
                  type="password"
                  required
                  value={newAdminPassInput}
                  onChange={(e) => setNewAdminPassInput(e.target.value)}
                  placeholder="Set initial login password"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#d7ded8] bg-[#f4f3ee]/50 text-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddAdminModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#d7ded8] text-xs font-semibold hover:bg-black/5 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingAdmin}
                  className="px-6 py-2.5 rounded-xl bg-[#11241c] text-white text-xs font-semibold hover:bg-[#1d3d2f] transition cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {creatingAdmin ? 'Adding Admin...' : 'Confirm & Add Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRODUCT CREATE / EDIT MODAL */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 border border-[#d7ded8] shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#ebf0ec] mb-5">
              <h2 className="font-editorial text-3xl font-semibold">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button
                onClick={() => setShowProductModal(false)}
                className="p-2 rounded-full hover:bg-black/5 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={prodTitle}
                    onChange={(e) => setProdTitle(e.target.value)}
                    placeholder="e.g. Everyday Denim"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#d7ded8] text-sm"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold">Category *</label>
                    <button
                      type="button"
                      onClick={() =>
                        setShowInlineCategoryAdd(!showInlineCategoryAdd)
                      }
                      className="text-[11px] font-semibold text-emerald-800 hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>
                        {showInlineCategoryAdd ? 'Cancel' : 'Add Category'}
                      </span>
                    </button>
                  </div>

                  {showInlineCategoryAdd ? (
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={inlineCategoryName}
                        onChange={(e) => setInlineCategoryName(e.target.value)}
                        placeholder="e.g. Jackets, Panjabi, Polos..."
                        className="flex-1 px-3 py-2 rounded-xl border border-emerald-700 text-xs bg-[#f4f3ee]/50 focus:outline-none"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCategory(inlineCategoryName, true);
                          }
                        }}
                      />
                      <button
                        type="button"
                        disabled={!inlineCategoryName.trim() || savingCategory}
                        onClick={() =>
                          handleAddCategory(inlineCategoryName, true)
                        }
                        className="px-3.5 py-2 rounded-xl bg-[#11241c] text-white text-xs font-semibold hover:bg-[#1a3529] disabled:opacity-50 cursor-pointer shrink-0"
                      >
                        {savingCategory ? '...' : 'Add'}
                      </button>
                    </div>
                  ) : (
                    <select
                      value={prodCategory}
                      onChange={(e) => setProdCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#d7ded8] text-sm bg-white"
                    >
                      {productCategories
                        .filter((c) => c !== 'All')
                        .map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">
                    Price in BDT (৳) *
                  </label>
                  <input
                    type="number"
                    required
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    placeholder="1850"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#d7ded8] text-sm"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">
                    Original Price (Optional ৳)
                  </label>
                  <input
                    type="number"
                    value={prodOriginalPrice}
                    onChange={(e) => setProdOriginalPrice(e.target.value)}
                    placeholder="2200"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#d7ded8] text-sm"
                  />
                </div>
              </div>

              {/* Top Left Badge: Single-Select Checkboxes + Custom Input */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-[#f4f3ee]/70 border border-[#d7ded8] space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <label className="block font-semibold text-xs text-[#11241c]">
                      Top Left Badge (Select only 1 option)
                    </label>
                    <p className="text-[10px] text-[#11241c]/55">
                      Choose a signature label for the product card or type a custom one below
                    </p>
                  </div>
                  {prodBadge && (
                    <span className="px-2.5 py-1 rounded-md bg-[#11241c] text-[#e5c158] text-[10px] font-bold uppercase tracking-wider">
                      Selected: {prodBadge}
                    </span>
                  )}
                </div>

                {/* Clickable Single-Select Badge Checkboxes */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {badgeOptions.map((badgeLabel) => {
                    const isSelected =
                      prodBadge.trim().toUpperCase() ===
                      badgeLabel.toUpperCase();
                    return (
                      <label
                        key={badgeLabel}
                        onClick={() => handleSelectSingleBadge(badgeLabel)}
                        className={`flex items-center gap-2 px-2.5 py-2 rounded-xl border text-[10px] font-bold uppercase tracking-wider cursor-pointer select-none transition ${
                          isSelected
                            ? 'bg-[#11241c] text-white border-[#11241c] shadow-xs'
                            : 'bg-white text-[#11241c]/75 border-[#d7ded8] hover:border-[#11241c]/45'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="sr-only"
                        />
                        <span
                          className={`w-3.5 h-3.5 rounded flex items-center justify-center border text-[9px] leading-none shrink-0 ${
                            isSelected
                              ? 'bg-[#e5c158] border-[#e5c158] text-[#11241c]'
                              : 'border-[#c2ccc5] bg-[#f4f3ee]'
                          }`}
                        >
                          {isSelected ? '✓' : ''}
                        </span>
                        <span className="truncate">{badgeLabel}</span>
                      </label>
                    );
                  })}
                </div>

                {/* Custom Badge Input */}
                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <input
                    type="text"
                    value={customBadgeInput}
                    onChange={(e) => setCustomBadgeInput(e.target.value)}
                    placeholder="Not in the list? Type custom badge (e.g. SUMMER LINEN)..."
                    className="flex-1 px-3.5 py-2 rounded-xl border border-[#d7ded8] bg-white text-xs focus:outline-none focus:border-[#11241c]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomBadge();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomBadge}
                    disabled={!customBadgeInput.trim()}
                    className="px-4 py-2 rounded-xl bg-[#11241c] text-white text-xs font-semibold hover:bg-[#1a3529] transition cursor-pointer disabled:opacity-45 flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add &amp; Select Badge</span>
                  </button>
                </div>
              </div>

              {/* Product Images: Primary & Multiple Gallery Images */}
              <div className="space-y-3 p-4 rounded-2xl bg-[#f4f3ee]/70 border border-[#d7ded8]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-[#11241c]" />
                    <label className="font-semibold text-xs text-[#11241c]">
                      Product Images &amp; Gallery ({prodImage ? 1 + prodGallery.length : prodGallery.length} total)
                    </label>
                  </div>
                  <span className="text-[10px] text-[#11241c]/60">
                    Supports multiple photos with instant thumbnail preview
                  </span>
                </div>

                {/* Primary Image Input */}
                <div>
                  <div className="text-[11px] font-semibold text-[#11241c]/80 mb-1 flex items-center justify-between">
                    <span>Primary Cover Photo *</span>
                    <span className="text-[10px] text-emerald-800 font-medium">Main catalog thumbnail</span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      required={prodGallery.length === 0}
                      value={prodImage}
                      onChange={(e) => setProdImage(e.target.value)}
                      placeholder="Paste primary image URL (https://...)"
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#d7ded8] bg-white text-xs"
                    />
                    <label className="px-4 py-2.5 rounded-xl bg-[#11241c] text-white font-semibold flex items-center justify-center gap-2 cursor-pointer shrink-0">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploadingImg ? 'Uploading...' : 'Upload Cover'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          handleImageFileSelect(e, (url) => setProdImage(url))
                        }
                      />
                    </label>
                  </div>
                </div>

                {/* Additional Gallery Photos */}
                <div>
                  <div className="text-[11px] font-semibold text-[#11241c]/80 mb-1 flex items-center justify-between">
                    <span>Additional Gallery Photos (Multiple angles / details)</span>
                    <span className="text-[10px] text-[#11241c]/60">{prodGallery.length} additional added</span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex gap-2 flex-1">
                      <input
                        type="text"
                        value={customGalleryUrl}
                        onChange={(e) => setCustomGalleryUrl(e.target.value)}
                        placeholder="Paste additional image URL"
                        className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#d7ded8] bg-white text-xs"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddGalleryUrl();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleAddGalleryUrl}
                        disabled={!customGalleryUrl.trim()}
                        className="px-3.5 py-2.5 rounded-xl bg-[#2a3f36] text-white font-semibold hover:bg-[#1a2923] transition disabled:opacity-50 cursor-pointer shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <label className="px-4 py-2.5 rounded-xl border border-[#11241c] bg-white text-[#11241c] font-semibold flex items-center justify-center gap-1.5 cursor-pointer shrink-0 hover:bg-[#ebf0ec] transition">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploadingGalleryImg ? 'Uploading...' : 'Upload More'}</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={handleGalleryImageUpload}
                      />
                    </label>
                  </div>
                </div>

                {/* Image Previews Grid */}
                <div className="pt-2">
                  <div className="text-[10px] uppercase tracking-wider font-semibold text-[#11241c]/60 mb-2">
                    Current Images Preview (Click &quot;Make Primary&quot; to reorder):
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {prodImage && (
                      <div className="relative group w-24 h-28 rounded-xl overflow-hidden border-2 border-emerald-700 bg-white shadow-xs">
                        <img
                          src={prodImage}
                          alt="Primary"
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-emerald-700 text-white text-[9px] font-bold">
                          Primary
                        </span>
                      </div>
                    )}

                    {prodGallery.map((url, idx) => (
                      <div
                        key={idx}
                        className="relative group w-24 h-28 rounded-xl overflow-hidden border border-[#d7ded8] bg-white shadow-xs hover:border-[#11241c]"
                      >
                        <img
                          src={url}
                          alt={`Gallery ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/55 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition flex flex-col items-center justify-center gap-1.5 p-1 text-white">
                          <button
                            type="button"
                            onClick={() => handleSetGalleryAsPrimary(idx)}
                            className="px-2 py-1 rounded bg-white/20 hover:bg-white text-[9px] hover:text-[#11241c] font-medium transition cursor-pointer"
                          >
                            Make Primary
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveGalleryImage(idx)}
                            className="p-1 rounded-full bg-red-600/80 hover:bg-red-600 text-white transition cursor-pointer"
                            title="Remove image"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {!prodImage && prodGallery.length === 0 && (
                      <div className="w-full py-4 text-center text-xs text-[#11241c]/50 border border-dashed border-[#c2ccc5] rounded-xl bg-white/50">
                        No images added yet. Upload or paste image URLs above.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Available Sizes */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-[#f4f3ee]/70 border border-[#d7ded8] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-xs text-[#11241c]">
                    Available Sizes ({selectedSizesArray.length} selected)
                  </label>
                  <button
                    type="button"
                    onClick={toggleAllStandardSizes}
                    className="text-[11px] font-semibold text-emerald-800 hover:underline cursor-pointer"
                  >
                    {STANDARD_SIZES.every((std) =>
                      selectedSizesArray.some((s) => s.toUpperCase() === std)
                    )
                      ? 'Clear All'
                      : 'Select All (S–XXL)'}
                  </button>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {STANDARD_SIZES.map((sz) => {
                    const isChecked = selectedSizesArray.some(
                      (s) => s.toUpperCase() === sz
                    );
                    return (
                      <label
                        key={sz}
                        onClick={() => toggleProductSize(sz)}
                        className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl border text-xs font-bold cursor-pointer select-none transition ${
                          isChecked
                            ? 'bg-[#11241c] text-white border-[#11241c] shadow-xs'
                            : 'bg-white text-[#11241c]/75 border-[#d7ded8] hover:border-[#11241c]/50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="sr-only"
                        />
                        <span
                          className={`w-3.5 h-3.5 rounded flex items-center justify-center border text-[9px] leading-none ${
                            isChecked
                              ? 'bg-[#e5c158] border-[#e5c158] text-[#11241c]'
                              : 'border-[#c2ccc5] bg-[#f4f3ee]'
                          }`}
                        >
                          {isChecked ? '✓' : ''}
                        </span>
                        <span>{sz}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Available Colors: Multi-Select Checkboxes + Custom Input */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-[#f4f3ee]/70 border border-[#d7ded8] space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <label className="block font-semibold text-xs text-[#11241c]">
                      Available Colors ({selectedColorsArray.length} selected)
                    </label>
                    <p className="text-[10px] text-[#11241c]/55">
                      Tick one or more colors below, or add any custom shade using the input box
                    </p>
                  </div>
                  {selectedColorsArray.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setProdColors('')}
                      className="text-[11px] font-semibold text-red-600 hover:underline cursor-pointer"
                    >
                      Clear Colors
                    </button>
                  )}
                </div>

                {/* Clickable Color Checkboxes */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {allColorOptions.map((colObj) => {
                    const isChecked = selectedColorsArray.some(
                      (c) => c.toLowerCase() === colObj.name.toLowerCase()
                    );
                    return (
                      <label
                        key={colObj.name}
                        onClick={() => toggleProductColor(colObj.name)}
                        className={`flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl border text-xs font-semibold cursor-pointer select-none transition ${
                          isChecked
                            ? 'bg-[#11241c] text-white border-[#11241c] shadow-xs'
                            : 'bg-white text-[#11241c]/80 border-[#d7ded8] hover:border-[#11241c]/45'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="sr-only"
                          />
                          <span
                            className={`w-3.5 h-3.5 rounded flex items-center justify-center border text-[9px] leading-none shrink-0 ${
                              isChecked
                                ? 'bg-[#e5c158] border-[#e5c158] text-[#11241c]'
                                : 'border-[#c2ccc5] bg-[#f4f3ee]'
                            }`}
                          >
                            {isChecked ? '✓' : ''}
                          </span>
                          <span className="truncate">{colObj.name}</span>
                        </div>
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0"
                          style={{ backgroundColor: colObj.hex }}
                        />
                      </label>
                    );
                  })}
                </div>

                {/* Custom Color Input */}
                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <input
                    type="text"
                    value={customColorInput}
                    onChange={(e) => setCustomColorInput(e.target.value)}
                    placeholder="Add custom color (e.g. Forest Olive, Rust, Teal, Mustard)..."
                    className="flex-1 px-3.5 py-2 rounded-xl border border-[#d7ded8] bg-white text-xs focus:outline-none focus:border-[#11241c]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomColor();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomColor}
                    disabled={!customColorInput.trim()}
                    className="px-4 py-2 rounded-xl bg-[#11241c] text-white text-xs font-semibold hover:bg-[#1a3529] transition cursor-pointer disabled:opacity-45 flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Color</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={prodDesc}
                  onChange={(e) => setProdDesc(e.target.value)}
                  placeholder="Describe the fit, fabric feel, and everyday styling details..."
                  className="w-full px-3.5 py-2 rounded-xl border border-[#d7ded8] text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 items-center">
                <div>
                  <label className="block font-semibold mb-1">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    value={prodStock}
                    onChange={(e) => setProdStock(e.target.value)}
                    placeholder="e.g. 25"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#d7ded8] text-sm"
                  />
                </div>
                <label className="inline-flex items-center gap-2 font-semibold mt-5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prodInStock}
                    onChange={(e) => setProdInStock(e.target.checked)}
                  />
                  <span>Available In Stock</span>
                </label>
              </div>

              <div className="pt-4 border-t border-[#ebf0ec] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-[#d7ded8] font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProduct || uploadingImg}
                  className="px-6 py-2.5 rounded-xl bg-[#11241c] text-white font-semibold cursor-pointer"
                >
                  {savingProduct ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COLLECTION MODAL */}
      {showColModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-[#d7ded8] shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#ebf0ec] mb-5">
              <h2 className="font-editorial text-3xl font-semibold">
                {editingCol ? 'Edit Collection Card' : 'New Collection Card'}
              </h2>
              <button
                onClick={() => setShowColModal(false)}
                className="p-2 rounded-full hover:bg-black/5 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCollection} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Top Label</label>
                  <input
                    type="text"
                    value={colNumberLabel}
                    onChange={(e) => setColNumberLabel(e.target.value)}
                    placeholder="01 / AVAILABLE NOW"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#d7ded8] text-sm"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Status</label>
                  <select
                    value={colStatus}
                    onChange={(e) =>
                      setColStatus(
                        e.target.value as 'AVAILABLE NOW' | 'COMING SOON'
                      )
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-[#d7ded8] text-sm bg-white"
                  >
                    <option value="AVAILABLE NOW">AVAILABLE NOW</option>
                    <option value="COMING SOON">COMING SOON</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={colTitle}
                  onChange={(e) => setColTitle(e.target.value)}
                  placeholder="Men / Women / Kids"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#d7ded8] text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Subtitle</label>
                <input
                  type="text"
                  value={colSubtitle}
                  onChange={(e) => setColSubtitle(e.target.value)}
                  placeholder="e.g. EXPLORE THE COLLECTION →"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#d7ded8] text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">
                  Background Image (ImgBB Upload or URL)
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={colImage}
                    onChange={(e) => setColImage(e.target.value)}
                    placeholder="Paste image URL (https://...) or upload via ImgBB"
                    className="flex-1 px-3.5 py-2 rounded-xl border border-[#d7ded8] text-sm"
                  />
                  <label className="px-4 py-2 rounded-xl bg-[#11241c] text-white font-semibold flex items-center justify-center gap-1.5 cursor-pointer shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <span>ImgBB</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        handleImageFileSelect(e, (url) => setColImage(url))
                      }
                    />
                  </label>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowColModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#d7ded8]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-[#11241c] text-white font-semibold cursor-pointer"
                >
                  Save Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ORDER DETAIL MODAL */}
      {selectedOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 border border-[#d7ded8] shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#ebf0ec] pb-4">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[#11241c]/50 font-semibold">
                  Order Details
                </span>
                <h3 className="font-mono text-xl font-bold">
                  {selectedOrderModal.orderNumber}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrderModal(null)}
                className="p-2 rounded-full hover:bg-black/5 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-[#f4f3ee] p-4 rounded-2xl">
              <div>
                <p className="text-[#11241c]/60">Customer</p>
                <p className="font-bold text-sm">
                  {selectedOrderModal.customerName}
                </p>
                <p>{selectedOrderModal.customerPhone}</p>
              </div>
              <div>
                <p className="text-[#11241c]/60">Delivery Address</p>
                <p className="font-semibold">
                  {selectedOrderModal.shippingAddress.address}
                </p>
                <p>
                  {selectedOrderModal.shippingAddress.city} (
                  {selectedOrderModal.shippingAddress.deliveryZone})
                </p>
              </div>
            </div>

            {/* Payment Verification Box */}
            <div className="p-4 rounded-2xl border border-[#d7ded8] text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold">
                  Payment Method: {selectedOrderModal.paymentMethod}
                </span>
                <select
                  value={selectedOrderModal.paymentStatus}
                  onChange={(e) =>
                    handleUpdateOrder(selectedOrderModal._id, {
                      paymentStatus: e.target.value,
                    })
                  }
                  className="px-3 py-1 rounded-lg border border-[#d7ded8] bg-[#f4f3ee] font-semibold"
                >
                  <option value="Pending">Payment: Pending</option>
                  <option value="Verified">Payment: Verified</option>
                  <option value="Failed">Payment: Failed</option>
                </select>
              </div>
              {selectedOrderModal.paymentDetails?.transactionId && (
                <div className="pt-2 border-t border-[#ebf0ec] font-mono">
                  <p>
                    Sender Number:{' '}
                    <strong>
                      {selectedOrderModal.paymentDetails.senderNumber}
                    </strong>
                  </p>
                  <p>
                    Transaction ID (TrxID):{' '}
                    <strong className="text-pink-700">
                      {selectedOrderModal.paymentDetails.transactionId}
                    </strong>
                  </p>
                </div>
              )}
            </div>

            {/* Items */}
            <div className="space-y-2.5 text-xs">
              <p className="font-semibold uppercase tracking-wider text-[10px] text-[#11241c]/60">
                Ordered Items
              </p>
              {selectedOrderModal.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-2 border-b border-[#ebf0ec]"
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
                      <p className="font-bold">{item.title}</p>
                      <p className="text-[#11241c]/60">
                        Size: {item.size} · {item.color} × {item.quantity}
                      </p>
                    </div>
                  </div>
                  <span className="font-bold font-mono">
                    {formatBDT(item.price * item.quantity)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between pt-2 text-sm font-bold">
                <span>Total Amount (incl. Shipping)</span>
                <span className="font-mono">
                  {formatBDT(selectedOrderModal.totalAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOMER DETAIL MODAL */}
      {selectedUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 border border-[#d7ded8] shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#ebf0ec] pb-4">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[#11241c]/50 font-semibold">
                  Customer Profile
                </span>
                <h3 className="font-editorial text-3xl font-bold">
                  {selectedUserModal.name}
                </h3>
                <p className="text-xs text-[#11241c]/65">
                  {selectedUserModal.email}
                </p>
              </div>
              <button
                onClick={() => setSelectedUserModal(null)}
                className="p-2 rounded-full hover:bg-black/5 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs bg-[#f4f3ee] p-4 rounded-2xl">
              <div>
                <p className="text-[#11241c]/60">Mobile Number</p>
                <p className="font-bold text-sm mt-0.5">
                  {selectedUserModal.phone || 'Not provided'}
                </p>
              </div>
              <div>
                <p className="text-[#11241c]/60">Total Orders</p>
                <p className="font-bold text-sm mt-0.5">
                  {selectedUserModal.ordersCount || 0} orders
                </p>
              </div>
              <div>
                <p className="text-[#11241c]/60">Lifetime Spend</p>
                <p className="font-bold text-sm text-emerald-800 mt-0.5 font-mono">
                  {formatBDT(selectedUserModal.totalSpent || 0)}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-[#d7ded8] text-xs space-y-1.5">
              <p className="font-semibold text-[#11241c]/60 uppercase tracking-wider text-[10px]">
                Saved Shipping Address
              </p>
              <p className="font-medium text-sm">
                {selectedUserModal.address || 'No default address saved yet'}
              </p>
              <p className="text-[#11241c]/70">
                City: {selectedUserModal.city || 'Dhaka'} · Zone:{' '}
                {selectedUserModal.deliveryZone || 'Inside Dhaka'}
              </p>
            </div>

            {/* Customer's Recent Orders */}
            <div className="space-y-2.5 text-xs">
              <p className="font-semibold uppercase tracking-wider text-[10px] text-[#11241c]/60">
                Recent Orders by {selectedUserModal.name}
              </p>
              {!selectedUserModal.recentOrders ||
              selectedUserModal.recentOrders.length === 0 ? (
                <p className="text-[#11241c]/55 py-3">
                  No orders placed by this user yet.
                </p>
              ) : (
                selectedUserModal.recentOrders.map((ord) => (
                  <div
                    key={ord._id}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#f4f3ee] border border-[#d7ded8]"
                  >
                    <div>
                      <span className="font-mono font-bold">
                        {ord.orderNumber}
                      </span>
                      <span className="text-[#11241c]/60 ml-2">
                        ({new Date(ord.createdAt).toLocaleDateString()})
                      </span>
                      <p className="text-[11px] text-[#11241c]/70 mt-0.5">
                        {ord.paymentMethod} · Status:{' '}
                        <strong>{ord.orderStatus}</strong>
                      </p>
                    </div>
                    <span className="font-bold font-mono">
                      {formatBDT(ord.totalAmount)}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="pt-4 border-t border-[#ebf0ec] flex items-center justify-between gap-3">
              <button
                onClick={() => handleToggleUserStatus(selectedUserModal)}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer ${
                  selectedUserModal.isActive !== false
                    ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                    : 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200'
                }`}
              >
                {selectedUserModal.isActive !== false
                  ? 'Suspend User Account'
                  : 'Activate User Account'}
              </button>

              <button
                onClick={() => handleDeleteUser(selectedUserModal)}
                className="px-4 py-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white text-xs font-semibold transition cursor-pointer"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
