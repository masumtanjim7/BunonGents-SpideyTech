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
  sizeChart?: Record<string, { chest?: string; length?: string }>;
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
  whatsappNumber?: string;
  whatsappActive?: boolean;
  whatsappMessage?: string;
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

/**
 * Automatically compresses & converts large images to high-definition WebP/JPEG
 * before uploading to ImgBB — preserving crisp visual resolution while reducing
 * file size by 80%–95% for instant storefront loading.
 */
export async function compressImageBeforeUpload(
  file: File,
  maxDimension = 1600,
  quality = 0.86
): Promise<File> {
  if (typeof window === 'undefined') return file;
  // Skip non-raster or already-small files (< 180 KB)
  if (
    !file.type.startsWith('image/') ||
    file.type === 'image/svg+xml' ||
    file.type === 'image/gif' ||
    file.size < 180 * 1024
  ) {
    return file;
  }

  return new Promise<File>((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      try {
        let targetWidth = img.naturalWidth || img.width;
        let targetHeight = img.naturalHeight || img.height;

        if (!targetWidth || !targetHeight) {
          resolve(file);
          return;
        }

        // Preserve original resolution unless it exceeds 1600px (2x Retina HD)
        if (targetWidth > maxDimension || targetHeight > maxDimension) {
          const ratio = Math.min(
            maxDimension / targetWidth,
            maxDimension / targetHeight
          );
          targetWidth = Math.round(targetWidth * ratio);
          targetHeight = Math.round(targetHeight * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        const baseName = file.name.replace(/\.[^/.]+$/, '') || 'bunon-image';

        canvas.toBlob(
          (webpBlob) => {
            if (webpBlob && webpBlob.size < file.size) {
              const optimizedFile = new File([webpBlob], `${baseName}.webp`, {
                type: 'image/webp',
                lastModified: Date.now(),
              });
              resolve(optimizedFile);
              return;
            }
            // Fallback to high-definition JPEG if WebP isn't smaller/supported
            canvas.toBlob(
              (jpegBlob) => {
                if (jpegBlob && jpegBlob.size < file.size) {
                  const optimizedJpeg = new File(
                    [jpegBlob],
                    `${baseName}.jpg`,
                    {
                      type: 'image/jpeg',
                      lastModified: Date.now(),
                    }
                  );
                  resolve(optimizedJpeg);
                } else {
                  resolve(file);
                }
              },
              'image/jpeg',
              0.88
            );
          },
          'image/webp',
          quality
        );
      } catch {
        resolve(file);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}

export async function uploadImageToImgBB(file: File, token: string): Promise<string> {
  const optimizedFile = await compressImageBeforeUpload(file);
  const formData = new FormData();
  formData.append('image', optimizedFile);

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
