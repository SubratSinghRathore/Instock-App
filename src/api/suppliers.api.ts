import { apiClient } from './client';
import { ProductItem } from './products.api';

export interface SupplierItem {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  imageUrl?: string;
  imagePublicId?: string;
  productCount?: number;
  createdAt: string;
  updatedAt: string;
}

export const suppliersApi = {
  getSuppliers: () =>
    apiClient<SupplierItem[]>('suppliers'),

  getSupplier: (id: string) =>
    apiClient<{ supplier: SupplierItem; products: ProductItem[] }>(`suppliers/${id}`),

  createSupplier: (data: Partial<SupplierItem>) =>
    apiClient<SupplierItem>('suppliers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateSupplier: (id: string, data: Partial<SupplierItem>) =>
    apiClient<SupplierItem>(`suppliers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteSupplier: (id: string) =>
    apiClient<{ message: string; id: string }>(`suppliers/${id}`, {
      method: 'DELETE',
    }),
};
