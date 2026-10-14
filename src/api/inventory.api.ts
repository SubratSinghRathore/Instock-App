import { apiClient } from './client';
import { ProductItem } from './products.api';

export type MovementType = 'IN' | 'OUT' | 'SALE' | 'RETURN' | 'ADJUSTMENT';

export interface StockMovementItem {
  _id: string;
  productId: {
    _id: string;
    name: string;
    sku: string;
    imageUrl?: string;
  };
  type: MovementType;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reason?: string;
  referenceId?: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  timestamp: string;
}

export interface StockOperationResult {
  product: ProductItem;
  movement: StockMovementItem;
}

export const inventoryApi = {
  stockIn: (data: { productId: string; quantity: number; reason?: string; referenceId?: string }) =>
    apiClient<StockOperationResult>('inventory/stock-in', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  stockOut: (data: { productId: string; quantity: number; reason?: string; referenceId?: string }) =>
    apiClient<StockOperationResult>('inventory/stock-out', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  adjustStock: (data: { productId: string; newQuantity: number; reason: string; referenceId?: string }) =>
    apiClient<StockOperationResult>('inventory/adjust', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getMovements: (params?: {
    productId?: string;
    type?: MovementType;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.productId) query.append('productId', params.productId);
    if (params?.type) query.append('type', params.type);
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));

    const queryString = query.toString();
    return apiClient<{
      movements: StockMovementItem[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(`inventory/movements${queryString ? `?${queryString}` : ''}`);
  },
};
