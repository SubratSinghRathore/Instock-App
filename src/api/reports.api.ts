import { apiClient } from './client';
import { StockMovementItem } from './inventory.api';
import { storage } from '../utils/storage';

export interface DashboardSummary {
  totalProducts: number;
  totalStockQuantity: number;
  lowStockCount: number;
  totalInventoryValue: number;
}

export interface ChartDataItem {
  date: string;
  label: string;
  amount: number;
  count: number;
}

export interface DashboardData {
  summary: DashboardSummary;
  recentMovements: StockMovementItem[];
  chartData: ChartDataItem[];
}

export interface RestockSuggestion {
  product: {
    id: string;
    name: string;
    sku: string;
    quantity: number;
    lowStockThreshold: number;
    purchasePrice: number;
    imageUrl: string;
    supplier?: {
      name: string;
      phone?: string;
      email?: string;
    };
  };
  dailyVelocity: number;
  daysOfStockLeft: number | null;
  needsRestock: boolean;
  reorderPoint: number;
  suggestedReorderQuantity: number;
  isEstimate: boolean;
  note: string;
}

export interface SalesSummaryMetrics {
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  totalItemsSold: number;
  orderCount: number;
  averageOrderValue: number;
}

export const reportsApi = {
  getDashboard: () =>
    apiClient<DashboardData>('reports/dashboard'),

  getSalesSummary: (params?: { startDate?: string; endDate?: string }) => {
    const query = new URLSearchParams();
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    const qs = query.toString();
    return apiClient<SalesSummaryMetrics>(`reports/sales-summary${qs ? `?${qs}` : ''}`);
  },

  getTopProducts: () =>
    apiClient<
      Array<{
        _id: string;
        productName: string;
        unitsSold: number;
        totalRevenue: number;
      }>
    >('reports/top-products'),

  getRestockSuggestions: (safetyBuffer = 5, leadTimeDays = 7) =>
    apiClient<RestockSuggestion[]>(
      `reports/restock-suggestions?safetyBuffer=${safetyBuffer}&leadTimeDays=${leadTimeDays}`
    ),

  getInventoryCsvExport: async (): Promise<string> => {
    const baseUrl = await storage.getApiUrl();
    const token = await storage.getAccessToken();
    const res = await fetch(`${baseUrl.replace(/\/+$/, '')}/reports/export/inventory-csv`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.text();
  },

  getSalesCsvExport: async (): Promise<string> => {
    const baseUrl = await storage.getApiUrl();
    const token = await storage.getAccessToken();
    const res = await fetch(`${baseUrl.replace(/\/+$/, '')}/reports/export/sales-csv`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.text();
  },
};
