import { Timestamp } from 'firebase/firestore';

export interface Category {
  id: string;
  name: string;
  icon: string;
  discount?: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  discount?: number;
  categoryId: string;
  imageUrl: string;
  stock: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  discountedPrice: number;
}

export interface Order {
  id: string;
  userId: string;
  customerName: string;
  address: string;
  contact: string;
  items: OrderItem[];
  total: number;
  paymentProofUrl: string;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: Timestamp;
}

export interface UserProfile {
  uid: string;
  email: string;
  role: 'admin' | 'customer';
  displayName?: string;
}

export interface CartItem extends Product {
  quantity: number;
}
