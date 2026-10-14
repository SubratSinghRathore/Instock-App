import { apiClient } from './client';

export type PaymentMethod = 'CASH' | 'CARD' | 'UPI' | 'OTHER';

export interface SaleLineItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface SaleRecord {
  _id: string;
  invoiceNumber: string;
  items: SaleLineItem[];
  totalAmount: number;
  paymentMethod: PaymentMethod;
  status: 'COMPLETED' | 'REFUNDED';
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  notes?: string;
  timestamp: string;
}

export const salesApi = {
  recordSale: (data: {
    items: Array<{ productId: string; quantity: number; unitPrice?: number }>;
    paymentMethod?: PaymentMethod;
    notes?: string;
    idempotencyKey?: string;
  }) =>
    apiClient<SaleRecord>('sales', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getSales: (params?: {
    startDate?: string;
    endDate?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    if (params?.status) query.append('status', params.status);
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));

    const queryString = query.toString();
    return apiClient<{
      sales: SaleRecord[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(`sales${queryString ? `?${queryString}` : ''}`);
  },

  getSale: (id: string) =>
    apiClient<SaleRecord>(`sales/${id}`),

  returnSale: (id: string, reason: string) =>
    apiClient<SaleRecord>(`sales/${id}/return`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
};
