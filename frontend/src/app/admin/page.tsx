'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  FolderKanban,
  Settings as SettingsIcon,
  LogOut,
  Plus,
  Pencil,
  Trash2,
  Upload,
  CheckCircle2,
  Clock,
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
  | 'products'
  | 'orders'
  | 'customers'
  | 'collections'
  | 'settings';

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

export default function AdminDashboardPage() {
  const [token, setToken] = useState<string | null>(null);
  const [adminUser, setAdminUser] = useState<{ name: string; email: string } | null>(
    null
  );

  // Login State
  const [loginEmail, setLoginEmail] = useState('support@example.com');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  // Data States
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [toast, setToast] = useState<string>('');

  // Product Form Modal State
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prodTitle, setProdTitle] = useState('');
  const [prodCategory, setProdCategory] = useState('Shirts');
  const [prodBadge, setProdBadge] = useState('EVERYDAY ESSENTIAL');
  const [prodPrice, setProdPrice] = useState('');
  const [prodOriginalPrice, setProdOriginalPrice] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodFabric, setProdFabric] = useState('');
  const [prodImage, setProdImage] = useState('');
  const [prodSizes, setProdSizes] = useState('S, M, L, XL, XXL');
  const [prodColors, setProdColors] = useState('Charcoal, Forest Olive, Warm Cream');
  const [prodStock, setProdStock] = useState('30');
  const [prodInStock, setProdInStock] = useState(true);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);

  // Collection Form State
  const [showColModal, setShowColModal] = useState(false);
  const [editingCol, setEditingCol] = useState<CollectionItem | null>(null);
  const [colNumberLabel, setColNumberLabel] = useState('01 / AVAILABLE NOW');
  const [colTitle, setColTitle] = useState('');
  const [colSubtitle, setColSubtitle] = useState('EXPLORE THE COLLECTION →');
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

  const fetchAllAdminData = async (authToken: string) => {
    try {
      const headers = { Authorization: `Bearer ${authToken}` };
      const [statsRes, prodRes, colRes, ordRes, setRes, usrRes] =
        await Promise.all([
          fetch(`${API_URL}/settings/stats`, { headers }),
          fetch(`${API_URL}/products`),
          fetch(`${API_URL}/collections`),
          fetch(`${API_URL}/orders`, { headers }),
          fetch(`${API_URL}/settings`),
          fetch(`${API_URL}/auth/users`, { headers }),
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
    setProdCategory('Shirts');
    setProdBadge('EVERYDAY ESSENTIAL');
    setProdPrice('');
    setProdOriginalPrice('');
    setProdDesc('');
    setProdFabric('100% Premium breathable cotton. Machine wash cold.');
    setProdImage('');
    setProdSizes('S, M, L, XL, XXL');
    setProdColors('Charcoal, Forest Olive, Warm Cream');
    setProdStock('25');
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
    setProdSizes((p.sizes || []).join(', '));
    setProdColors((p.colors || []).join(', '));
    setProdStock(String(p.stock ?? 25));
    setProdInStock(p.inStock ?? true);
    setShowProductModal(true);
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
      const payload = {
        title: prodTitle,
        category: prodCategory,
        badge: prodBadge,
        price: Number(prodPrice),
        originalPrice: prodOriginalPrice ? Number(prodOriginalPrice) : null,
        description: prodDesc,
        fabricAndCare: prodFabric,
        image: prodImage,
        sizes: prodSizes
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        colors: prodColors
          .split(',')
          .map((c) => c.trim())
          .filter(Boolean),
        stock: Number(prodStock),
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
      setColNumberLabel('04 / IN THE MAKING');
      setColTitle('');
      setColSubtitle('EXPLORE THE COLLECTION →');
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
        numberLabel: colNumberLabel,
        title: colTitle,
        subtitle: colSubtitle,
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
      showToast('Store & Payment Settings saved!');
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

  // LOGIN SCREEN
  if (!token) {
    return (
      <div className="min-h-screen bg-[#0e2018] text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#152d22] border border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl">
          <div className="text-center mb-8 flex flex-col items-center">
            <BrandLogo size="lg" showTagline />
            <p className="text-[10px] uppercase tracking-[0.22em] text-white/50 mt-3">
              ADMINISTRATION PORTAL
            </p>
          </div>

          {loginError && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-500/15 border border-red-400/30 text-red-200 text-xs text-center">
              {loginError}
            </div>
          )}

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
                placeholder="support@example.com"
                className="w-full px-4 py-3 rounded-xl bg-black/25 border border-white/15 text-sm text-white focus:outline-none focus:border-white/50"
              />
            </div>

            <div>
              <label className="block text-xs text-white/75 mb-1.5 font-medium">
                Password
              </label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
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

  return (
    <div className="min-h-screen bg-[#f4f3ee] text-[#11241c] flex flex-col lg:flex-row">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#11241c] text-white px-5 py-3 rounded-xl shadow-2xl border border-white/15 flex items-center gap-2.5 text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Left Sidebar */}
      <aside className="w-full lg:w-64 bg-[#0e2018] text-white flex flex-col justify-between shrink-0 border-r border-white/10">
        <div>
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <BrandLogo size="sm" />
            <span className="px-2 py-0.5 rounded-md bg-white/10 text-[9px] uppercase tracking-widest text-emerald-300">
              Admin
            </span>
          </div>

          <nav className="p-4 space-y-1.5 flex lg:flex-col overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: LayoutDashboard },
              {
                id: 'orders',
                label: `Orders (${orders.length})`,
                icon: ShoppingCart,
              },
              {
                id: 'customers',
                label: `Customers (${
                  usersList.filter((u) => u.role === 'customer').length
                })`,
                icon: Users,
              },
              {
                id: 'products',
                label: `Products (${products.length})`,
                icon: Package,
              },
              {
                id: 'collections',
                label: 'Collections',
                icon: FolderKanban,
              },
              {
                id: 'settings',
                label: 'bKash / Nagad & Site',
                icon: SettingsIcon,
              },
            ].map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as AdminTab)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-medium transition cursor-pointer whitespace-nowrap w-full text-left ${
                    active
                      ? 'bg-[#f4f3ee] text-[#11241c] font-semibold shadow-sm'
                      : 'text-white/75 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="hidden lg:block p-4 border-t border-white/10 space-y-2">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-white/80 transition"
          >
            <span>View Live Store</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs text-red-300 hover:bg-red-500/10 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 sm:p-10 overflow-y-auto">
        {/* Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 mb-8 border-b border-[#d7ded8]">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#11241c]/55 font-semibold">
              BUNON GENTS CONTROL CENTER
            </p>
            <h1 className="font-editorial text-3xl sm:text-4xl text-[#11241c] capitalize">
              {activeTab === 'settings'
                ? 'Payment (bKash/Nagad) & Storefront Settings'
                : activeTab}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-[#11241c]/65 hidden sm:inline">
              Signed in as <strong>{adminUser?.email}</strong>
            </span>
            <Link
              href="/"
              className="px-4 py-2 rounded-xl border border-[#11241c]/20 text-xs font-semibold hover:bg-white transition flex items-center gap-1.5"
            >
              <span>Live Store</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-white p-6 rounded-2xl border border-[#d7ded8] shadow-xs">
                <div className="flex items-center justify-between text-[#11241c]/60 text-xs mb-2">
                  <span>Total Revenue</span>
                  <DollarSign className="w-4 h-4 text-emerald-700" />
                </div>
                <p className="font-editorial text-3xl font-bold text-[#11241c]">
                  {formatBDT(stats?.totalRevenue || 0)}
                </p>
                <p className="text-[11px] text-[#11241c]/50 mt-1">
                  Excludes cancelled orders
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-[#d7ded8] shadow-xs">
                <div className="flex items-center justify-between text-[#11241c]/60 text-xs mb-2">
                  <span>Total Orders</span>
                  <ShoppingCart className="w-4 h-4 text-[#11241c]" />
                </div>
                <p className="font-editorial text-3xl font-bold text-[#11241c]">
                  {stats?.totalOrders || 0}
                </p>
                <p className="text-[11px] text-amber-700 font-medium mt-1">
                  {stats?.pendingOrders || 0} pending action
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-[#d7ded8] shadow-xs">
                <div className="flex items-center justify-between text-[#11241c]/60 text-xs mb-2">
                  <span>Active Customers</span>
                  <Users className="w-4 h-4 text-emerald-700" />
                </div>
                <p className="font-editorial text-3xl font-bold text-[#11241c]">
                  {stats?.activeCustomers ??
                    usersList.filter(
                      (u) => u.role === 'customer' && u.isActive !== false
                    ).length}
                </p>
                <p className="text-[11px] text-[#11241c]/55 mt-1">
                  {stats?.totalCustomers ??
                    usersList.filter((u) => u.role === 'customer').length}{' '}
                  registered · {products.length} catalog pieces
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-[#d7ded8] shadow-xs">
                <div className="flex items-center justify-between text-[#11241c]/60 text-xs mb-2">
                  <span>Payment Methods</span>
                  <Smartphone className="w-4 h-4 text-pink-600" />
                </div>
                <div className="flex items-center gap-3 mt-2 text-xs font-semibold">
                  <span className="px-2.5 py-1 rounded-md bg-[#f4f3ee]">
                    COD: {stats?.paymentBreakdown?.COD || 0}
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-pink-50 text-pink-700">
                    bKash: {stats?.paymentBreakdown?.bKash || 0}
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-orange-50 text-orange-700">
                    Nagad: {stats?.paymentBreakdown?.Nagad || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Payment Banner */}
            {settings && (
              <div className="bg-[#11241c] text-white rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-white/60">
                    ACTIVE CHECKOUT NUMBERS
                  </span>
                  <div className="flex flex-wrap items-center gap-6 mt-1">
                    <p className="text-sm">
                      <span className="text-pink-400 font-semibold">bKash:</span>{' '}
                      {settings.bkashNumber}
                    </p>
                    <p className="text-sm">
                      <span className="text-orange-400 font-semibold">
                        Nagad:
                      </span>{' '}
                      {settings.nagadNumber}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('settings')}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold transition cursor-pointer"
                >
                  Edit bKash / Nagad Numbers →
                </button>
              </div>
            )}

            {/* Recent Orders Table */}
            <div className="bg-white rounded-2xl border border-[#d7ded8] overflow-hidden shadow-xs">
              <div className="p-6 border-b border-[#ebf0ec] flex items-center justify-between">
                <h2 className="font-editorial text-2xl font-semibold">
                  Recent Orders
                </h2>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="text-xs font-semibold text-[#11241c] hover:underline cursor-pointer"
                >
                  View All Orders →
                </button>
              </div>

              {orders.length === 0 ? (
                <div className="p-10 text-center text-sm text-[#11241c]/60">
                  No customer orders placed yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
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
                          <td className="py-3.5 px-5 font-bold">
                            {formatBDT(o.totalAmount)}
                          </td>
                          <td className="py-3.5 px-5">
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#ebf0ec]">
                              {o.orderStatus}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 text-right">
                            <button
                              onClick={() => setSelectedOrderModal(o)}
                              className="px-3 py-1.5 rounded-lg border border-[#d7ded8] hover:bg-[#11241c] hover:text-white transition cursor-pointer"
                            >
                              Manage
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: PRODUCTS */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-xs text-[#11241c]/70">
                Manage your men&apos;s collection items. Upload product photos
                directly to <strong>ImgBB</strong>.
              </p>
              <button
                onClick={openCreateProduct}
                className="px-5 py-3 rounded-xl bg-[#11241c] text-white text-xs uppercase tracking-widest font-semibold flex items-center gap-2 hover:bg-[#1b362a] transition cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Piece</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {products.map((p) => (
                <div
                  key={p._id}
                  className="bg-white rounded-2xl p-3.5 border border-[#d7ded8] shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="relative h-56 rounded-xl overflow-hidden bg-[#ebf0ec] mb-3">
                      <img
                        src={p.image}
                        alt={p.title}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-md bg-white/90 text-[9px] font-bold uppercase tracking-wider">
                        {p.badge}
                      </span>
                    </div>
                    <p className="text-[10px] uppercase tracking-widest text-[#11241c]/50 font-semibold">
                      {p.category}
                    </p>
                    <h3 className="font-editorial text-2xl font-semibold text-[#11241c]">
                      {p.title}
                    </h3>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm font-bold">
                        {formatBDT(p.price)}
                      </span>
                      <span className="text-[11px] text-[#11241c]/60">
                        Stock: {p.stock}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[#ebf0ec]">
                    <button
                      onClick={() => openEditProduct(p)}
                      className="flex-1 py-2 rounded-lg bg-[#f4f3ee] hover:bg-[#11241c] hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Edit</span>
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
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: ORDERS */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#d7ded8]">
              <div className="flex flex-wrap items-center gap-2">
                {[
                  'All',
                  'Pending',
                  'Confirmed',
                  'Processing',
                  'Shipped',
                  'Delivered',
                  'Cancelled',
                ].map((st) => (
                  <button
                    key={st}
                    onClick={() => setOrderFilter(st)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
                      orderFilter === st
                        ? 'bg-[#11241c] text-white'
                        : 'bg-[#f4f3ee] text-[#11241c]/70 hover:text-[#11241c]'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <div className="relative min-w-[240px]">
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
                <div className="overflow-x-auto">
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
                          <td className="py-4 px-5 font-bold text-sm">
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
                              className="px-3 py-1.5 rounded-lg border border-[#d7ded8] bg-[#f4f3ee] text-xs font-semibold"
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
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#11241c] text-white text-xs font-medium cursor-pointer"
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
              )}
            </div>
          </div>
        )}

        {/* TAB 3.5: CUSTOMERS & USER MANAGEMENT */}
        {activeTab === 'customers' && (
          <div className="space-y-6">
            {/* Customer Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="bg-white p-6 rounded-2xl border border-[#d7ded8] shadow-xs">
                <div className="flex items-center justify-between text-xs text-[#11241c]/60 mb-2">
                  <span>Total Registered Customers</span>
                  <Users className="w-4 h-4 text-[#11241c]" />
                </div>
                <p className="font-editorial text-3xl font-bold">
                  {usersList.filter((u) => u.role === 'customer').length}
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-[#d7ded8] shadow-xs">
                <div className="flex items-center justify-between text-xs text-[#11241c]/60 mb-2">
                  <span>Active Users</span>
                  <UserCheck className="w-4 h-4 text-emerald-700" />
                </div>
                <p className="font-editorial text-3xl font-bold text-emerald-900">
                  {
                    usersList.filter(
                      (u) => u.role === 'customer' && u.isActive !== false
                    ).length
                  }
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-[#d7ded8] shadow-xs">
                <div className="flex items-center justify-between text-xs text-[#11241c]/60 mb-2">
                  <span>Suspended / Blocked Users</span>
                  <UserX className="w-4 h-4 text-red-600" />
                </div>
                <p className="font-editorial text-3xl font-bold text-red-700">
                  {
                    usersList.filter(
                      (u) => u.role === 'customer' && u.isActive === false
                    ).length
                  }
                </p>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#d7ded8]">
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

              <div className="relative min-w-[260px]">
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
              {usersList.filter((u) => u.role === 'customer').length === 0 ? (
                <div className="p-12 text-center text-sm text-[#11241c]/60">
                  No customer accounts created yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
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
                      {usersList
                        .filter((u) => u.role === 'customer')
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
                              <p className="text-emerald-800 font-semibold">
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
              )}
            </div>
          </div>
        )}

        {/* TAB 4: COLLECTIONS */}
        {activeTab === 'collections' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-xs text-[#11241c]/70">
                Manage the &quot;Our collections&quot; cards (Men, Women, Kids).
              </p>
              <button
                onClick={() => openEditCollection()}
                className="px-5 py-2.5 rounded-xl bg-[#11241c] text-white text-xs uppercase tracking-widest font-semibold flex items-center gap-2 cursor-pointer"
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

        {/* TAB 5: SETTINGS (bKash / Nagad & Storefront) */}
        {activeTab === 'settings' && settings && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <form
              onSubmit={handleSaveSettings}
              className="lg:col-span-8 space-y-6"
            >
              {/* bKash & Nagad Configuration Card */}
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#d7ded8] shadow-xs space-y-5">
                <div className="flex items-center gap-2.5 border-b border-[#ebf0ec] pb-3">
                  <Smartphone className="w-5 h-5 text-pink-600" />
                  <h2 className="font-editorial text-2xl font-semibold">
                    bKash, Nagad & Delivery Fees
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5">
                      bKash Number (Displayed on Checkout)
                    </label>
                    <input
                      type="text"
                      value={settings.bkashNumber}
                      onChange={(e) =>
                        setSettings({ ...settings, bkashNumber: e.target.value })
                      }
                      placeholder="017XX-XXXXXX (Personal / Merchant)"
                      className="w-full px-4 py-2.5 rounded-xl border border-[#d7ded8] bg-[#f4f3ee]/50 text-sm"
                    />
                    <label className="inline-flex items-center gap-2 text-xs mt-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.bkashActive}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            bkashActive: e.target.checked,
                          })
                        }
                      />
                      <span>Enable bKash at Checkout</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1.5">
                      Nagad Number (Displayed on Checkout)
                    </label>
                    <input
                      type="text"
                      value={settings.nagadNumber}
                      onChange={(e) =>
                        setSettings({ ...settings, nagadNumber: e.target.value })
                      }
                      placeholder="018XX-XXXXXX (Personal / Merchant)"
                      className="w-full px-4 py-2.5 rounded-xl border border-[#d7ded8] bg-[#f4f3ee]/50 text-sm"
                    />
                    <label className="inline-flex items-center gap-2 text-xs mt-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.nagadActive}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            nagadActive: e.target.checked,
                          })
                        }
                      />
                      <span>Enable Nagad at Checkout</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="inline-flex items-center gap-2 text-xs font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.codActive}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          codActive: e.target.checked,
                        })
                      }
                    />
                    <span>Enable Cash on Delivery (COD)</span>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">
                    Payment Instructions for Customers
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
                    className="w-full px-4 py-2.5 rounded-xl border border-[#d7ded8] bg-[#f4f3ee]/50 text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5">
                      Inside Dhaka Delivery Charge (৳)
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
                      className="w-full px-4 py-2.5 rounded-xl border border-[#d7ded8] bg-[#f4f3ee]/50 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5">
                      Outside Dhaka Delivery Charge (৳)
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
                      className="w-full px-4 py-2.5 rounded-xl border border-[#d7ded8] bg-[#f4f3ee]/50 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Hero & Banner Content */}
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#d7ded8] shadow-xs space-y-5">
                <h2 className="font-editorial text-2xl font-semibold border-b border-[#ebf0ec] pb-3">
                  Storefront Hero & Winter Banner
                </h2>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">
                    Top Announcement Bar
                  </label>
                  <input
                    type="text"
                    value={settings.topAnnouncement}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        topAnnouncement: e.target.value,
                      })
                    }
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
                      value={settings.heroTitleLine1}
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
                      Hero Headline Line 2 (Italic)
                    </label>
                    <input
                      type="text"
                      value={settings.heroTitleLine2}
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
                    Hero Background Image (Upload via ImgBB or paste URL)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={settings.heroImage}
                      onChange={(e) =>
                        setSettings({ ...settings, heroImage: e.target.value })
                      }
                      className="flex-1 px-4 py-2.5 rounded-xl border border-[#d7ded8] bg-[#f4f3ee]/50 text-sm"
                    />
                    <label className="px-4 py-2.5 rounded-xl bg-[#11241c] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploadingImg ? '...' : 'ImgBB'}</span>
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

                <button
                  type="submit"
                  className="px-8 py-3.5 rounded-xl bg-[#11241c] text-white text-xs uppercase tracking-widest font-semibold hover:bg-[#1a3529] transition cursor-pointer shadow-md"
                >
                  Save All Store Settings
                </button>
              </div>
            </form>

            {/* Right Column: Admin Account Security */}
            <div className="lg:col-span-4 space-y-6">
              <form
                onSubmit={handleUpdateAdminCredentials}
                className="bg-white rounded-2xl p-6 border border-[#d7ded8] shadow-xs space-y-4"
              >
                <div className="flex items-center gap-2 border-b border-[#ebf0ec] pb-3">
                  <Lock className="w-4 h-4 text-[#11241c]" />
                  <h3 className="font-editorial text-2xl font-semibold">
                    Admin Credentials
                  </h3>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Admin Email
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
                  <label className="block text-xs font-semibold mb-1">
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
                  className="w-full py-3 rounded-xl bg-[#11241c] text-white text-xs uppercase tracking-widest font-semibold cursor-pointer"
                >
                  Update Login Credentials
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

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
                  <label className="block font-semibold mb-1">Category *</label>
                  <select
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#d7ded8] text-sm bg-white"
                  >
                    {(
                      settings?.categories || [
                        'Jeans',
                        'Shirts',
                        'T-shirts',
                        'Sweaters',
                        'Winter collection',
                      ]
                    ).map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                <div>
                  <label className="block font-semibold mb-1">
                    Top Left Badge
                  </label>
                  <input
                    type="text"
                    value={prodBadge}
                    onChange={(e) => setProdBadge(e.target.value)}
                    placeholder="EVERYDAY ESSENTIAL"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#d7ded8] text-sm"
                  />
                </div>
              </div>

              {/* Image Upload to ImgBB */}
              <div>
                <label className="block font-semibold mb-1">
                  Product Image (Upload directly to ImgBB or paste URL) *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={prodImage}
                    onChange={(e) => setProdImage(e.target.value)}
                    placeholder="https://i.ibb.co/..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#d7ded8] text-sm"
                  />
                  <label className="px-4 py-2.5 rounded-xl bg-[#11241c] text-white font-semibold flex items-center gap-2 cursor-pointer shrink-0">
                    <Upload className="w-4 h-4" />
                    <span>
                      {uploadingImg ? 'Uploading...' : 'Upload to ImgBB'}
                    </span>
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
                {prodImage && (
                  <img
                    src={prodImage}
                    alt="Preview"
                    className="mt-2 w-24 h-28 object-cover rounded-xl border border-[#d7ded8]"
                  />
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">
                    Sizes (comma separated)
                  </label>
                  <input
                    type="text"
                    value={prodSizes}
                    onChange={(e) => setProdSizes(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#d7ded8] text-sm"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">
                    Colors (comma separated)
                  </label>
                  <input
                    type="text"
                    value={prodColors}
                    onChange={(e) => setProdColors(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#d7ded8] text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={prodDesc}
                  onChange={(e) => setProdDesc(e.target.value)}
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
                  className="w-full px-3.5 py-2 rounded-xl border border-[#d7ded8] text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">
                  Background Image (ImgBB Upload or URL)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={colImage}
                    onChange={(e) => setColImage(e.target.value)}
                    className="flex-1 px-3.5 py-2 rounded-xl border border-[#d7ded8] text-sm"
                  />
                  <label className="px-4 py-2 rounded-xl bg-[#11241c] text-white font-semibold flex items-center gap-1.5 cursor-pointer">
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

            <div className="grid grid-cols-2 gap-4 text-xs bg-[#f4f3ee] p-4 rounded-2xl">
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
                  <span className="font-bold">
                    {formatBDT(item.price * item.quantity)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between pt-2 text-sm font-bold">
                <span>Total Amount (incl. Shipping)</span>
                <span>{formatBDT(selectedOrderModal.totalAmount)}</span>
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
                <p className="font-bold text-sm text-emerald-800 mt-0.5">
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
                    <span className="font-bold">
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
