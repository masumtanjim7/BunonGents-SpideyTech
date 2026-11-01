export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

export interface Product {
  _id: string;
  title: string;
  slug: string;
  category: string;
  badge: string;
  price: number;
  originalPrice?: number | null;
  description: string;
  fabricAndCare: string;
  image: string;
  gallery: string[];
  sizes: string[];
  colors: string[];
  stock: number;
  featured: boolean;
  inStock: boolean;
  createdAt?: string;
}

export interface CollectionItem {
  _id: string;
  numberLabel: string;
  title: string;
  slug: string;
  subtitle: string;
  status: 'AVAILABLE NOW' | 'COMING SOON';
  image: string;
  order: number;
}

export interface SiteSettings {
  _id?: string;
  siteName: string;
  topAnnouncement: string;
  heroSubtitle: string;
  heroTitleLine1: string;
  heroTitleLine2: string;
  heroDescription: string;
  heroImage: string;
  winterBannerSubtitle: string;
  winterBannerTitle1: string;
  winterBannerTitle2: string;
  winterBannerDesc: string;
  winterBannerImage: string;
  bkashNumber: string;
  bkashActive: boolean;
  nagadNumber: string;
  nagadActive: boolean;
  codActive: boolean;
  paymentInstructions: string;
  insideDhakaShipping: number;
  outsideDhakaShipping: number;
  contactEmail: string;
  contactPhone: string;
  categories: string[];
}

export interface OrderItem {
  product?: string;
  title: string;
  price: number;
  quantity: number;
  size: string;
  color: string;
  image: string;
}

export interface Order {
  _id: string;
  user?: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  shippingAddress: {
    address: string;
    city: string;
    area?: string;
    deliveryZone: 'Inside Dhaka' | 'Outside Dhaka';
    notes?: string;
  };
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  totalAmount: number;
  paymentMethod: 'COD' | 'bKash' | 'Nagad';
  paymentDetails?: {
    senderNumber?: string;
    transactionId?: string;
  };
  paymentStatus: 'Pending' | 'Verified' | 'Failed';
  orderStatus: 'Pending' | 'Confirmed' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  createdAt: string;
}

export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  deliveryZone?: 'Inside Dhaka' | 'Outside Dhaka';
  role: 'customer' | 'admin';
  isActive: boolean;
  lastLogin?: string;
  createdAt?: string;
  ordersCount?: number;
  totalSpent?: number;
  lastOrderDate?: string | null;
  recentOrders?: Order[];
}

export const formatBDT = (amount: number) => {
  return `৳${Number(amount || 0).toLocaleString('en-BD')}`;
};

export async function uploadImageToImgBB(file: File, token: string): Promise<string> {
  const formData = new FormData();
  formData.append('image', file);

  const res = await fetch(`${API_URL}/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Image upload failed');
  }
  return data.url;
}
