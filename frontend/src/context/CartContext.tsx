'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export interface CartItem {
  key: string; // product._id + size + color
  productId: string;
  title: string;
  price: number;
  image: string;
  size: string;
  color: string;
  quantity: number;
  category: string;
}

interface CartContextType {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (product: Product, size?: string, color?: string, quantity?: number) => void;
  removeFromCart: (key: string) => void;
  updateQuantity: (key: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user, openAuthModal } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('bunon_cart_v1');
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load cart from localStorage', e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('bunon_cart_v1', JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save cart', e);
    }
  }, [items]);

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);

  const performAddToCart = (
    product: Product,
    size: string,
    color: string,
    quantity: number
  ) => {
    const key = `${product._id}-${size}-${color}`;
    setItems((prev) => {
      const existing = prev.find((i) => i.key === key);
      if (existing) {
        return prev.map((i) =>
          i.key === key ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [
        ...prev,
        {
          key,
          productId: product._id,
          title: product.title,
          price: product.price,
          image: product.image,
          size,
          color,
          quantity,
          category: product.category,
        },
      ];
    });
    setIsOpen(true);
  };

  const addToCart = (
    product: Product,
    size: string = product.sizes?.[0] || 'L',
    color: string = product.colors?.[0] || 'Default',
    quantity: number = 1
  ) => {
    if (!user) {
      openAuthModal('register', () => {
        performAddToCart(product, size, color, quantity);
      });
      return;
    }
    performAddToCart(product, size, color, quantity);
  };

  const removeFromCart = (key: string) => {
    setItems((prev) => prev.filter((i) => i.key !== key));
  };

  const updateQuantity = (key: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(key);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.key === key ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        isOpen,
        openCart,
        closeCart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
