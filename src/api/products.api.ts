import { apiClient } from './client';

export interface ProductItem {
  _id: string;
  name: string;
  sku: string;
  barcode?: string;
  category: string;
  description?: string;
  purchasePrice: number;
  sellingPrice: number;
  quantity: number;
  lowStockThreshold: number;
  supplierId?: {
    _id: string;
    name: string;
    phone?: string;
    email?: string;
  } | null;
  imageUrl: string;
  imagePublicId?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductListResponse {
  products: ProductItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const productsApi = {
  getProducts: (params?: {
    search?: string;
    category?: string;
    lowStock?: boolean;
    isArchived?: boolean;
    page?: number;
    limit?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.category) query.append('category', params.category);
    if (params?.lowStock !== undefined) query.append('lowStock', String(params.lowStock));
    if (params?.isArchived !== undefined) query.append('isArchived', String(params.isArchived));
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));

    const queryString = query.toString();
    return apiClient<ProductListResponse>(`products${queryString ? `?${queryString}` : ''}`);
  },

  getProduct: (id: string) =>
    apiClient<{ product: ProductItem; recentMovements: any[] }>(`products/${id}`),

  getCategories: () =>
    apiClient<string[]>('products/categories/list'),

  createProduct: (data: Partial<ProductItem>) =>
    apiClient<ProductItem>('products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateProduct: (id: string, data: Partial<ProductItem>) =>
    apiClient<ProductItem>(`products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteProduct: (id: string) =>
    apiClient<{ message: string; id: string }>(`products/${id}`, {
      method: 'DELETE',
    }),

  uploadImage: (fileUri: string, fileName = 'upload.jpg', fileType = 'image/jpeg') => {
    const formData = new FormData();
    formData.append('image', {
      uri: fileUri,
      name: fileName,
      type: fileType,
    } as any);
    formData.append('folder', 'instock/products');

    return apiClient<{ secure_url: string; public_id: string }>('upload', {
      method: 'POST',
      body: formData,
    });
  },
};
