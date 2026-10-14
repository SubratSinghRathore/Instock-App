import { NavigatorScreenParams } from '@react-navigation/native';
import { ProductItem } from '../api/products.api';
import { SupplierItem } from '../api/suppliers.api';

export type MainTabParamList = {
  Dashboard: undefined;
  Products: undefined;
  Reports: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  // Auth
  Login: undefined;
  Register: undefined;

  // Main Bottom Tabs
  MainTabs: NavigatorScreenParams<MainTabParamList>;

  // Products
  ProductDetail: { productId: string };
  ProductForm: { product?: ProductItem };

  // Inventory
  StockOperation: {
    productId: string;
    productName: string;
    currentQuantity: number;
    initialType?: 'IN' | 'OUT' | 'ADJUSTMENT';
  };
  MovementsHistory: { productId?: string };

  // Suppliers
  SupplierList: undefined;
  SupplierForm: { supplier?: SupplierItem };
  SupplierDetail: { supplierId: string };

  // Sales
  NewSale: undefined;
  SaleHistory: undefined;

  // Reports
  RestockSuggestions: undefined;

  // Settings
  BusinessProfile: undefined;
};
