import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList, MainTabParamList } from './types';
import { LoadingIndicator } from '../components/common/LoadingIndicator';
import { colors } from '../theme/colors';

// Screens
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { ProductListScreen } from '../screens/products/ProductListScreen';
import { ProductDetailScreen } from '../screens/products/ProductDetailScreen';
import { ProductFormScreen } from '../screens/products/ProductFormScreen';
import { StockOperationModal } from '../screens/inventory/StockOperationModal';
import { MovementsHistoryScreen } from '../screens/inventory/MovementsHistoryScreen';
import { SupplierListScreen } from '../screens/suppliers/SupplierListScreen';
import { SupplierFormScreen } from '../screens/suppliers/SupplierFormScreen';
import { NewSaleScreen } from '../screens/sales/NewSaleScreen';
import { SaleHistoryScreen } from '../screens/sales/SaleHistoryScreen';
import { ReportsScreen } from '../screens/reports/ReportsScreen';
import { RestockSuggestionsScreen } from '../screens/reports/RestockSuggestionsScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { BusinessProfileScreen } from '../screens/settings/BusinessProfileScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const renderDashboardIcon = () => <Text style={styles.tabIcon}>📊</Text>;
const renderProductsIcon = () => <Text style={styles.tabIcon}>📦</Text>;
const renderReportsIcon = () => <Text style={styles.tabIcon}>📈</Text>;
const renderSettingsIcon = () => <Text style={styles.tabIcon}>⚙️</Text>;

const MainTabsNavigator = () => {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 12);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 60 + bottomInset,
          paddingBottom: bottomInset + 4,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: renderDashboardIcon,
        }}
      />
      <Tab.Screen
        name="Products"
        component={ProductListScreen}
        options={{
          tabBarLabel: 'Products',
          tabBarIcon: renderProductsIcon,
        }}
      />
      <Tab.Screen
        name="Reports"
        component={ReportsScreen}
        options={{
          tabBarLabel: 'Reports',
          tabBarIcon: renderReportsIcon,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: renderSettingsIcon,
        }}
      />
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.splashContainer}>
        <View style={styles.splashLogo}>
          <Text style={styles.splashIcon}>📦</Text>
        </View>
        <Text style={styles.splashBrand}>InStock</Text>
        <LoadingIndicator message="Connecting..." />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.surface,
          },
          headerTintColor: colors.textPrimary,
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 17,
          },
          headerShadowVisible: false,
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        {!isAuthenticated ? (
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{ title: 'Register Business' }}
            />
          </>
        ) : (
          <>
            {/* 4 Bottom Tabs */}
            <Stack.Screen
              name="MainTabs"
              component={MainTabsNavigator}
              options={{ headerShown: false }}
            />

            {/* Products secondary screens */}
            <Stack.Screen
              name="ProductDetail"
              component={ProductDetailScreen}
              options={{ title: 'Product Details' }}
            />
            <Stack.Screen
              name="ProductForm"
              component={ProductFormScreen}
              options={{ title: 'Product Form' }}
            />

            {/* Inventory operations */}
            <Stack.Screen
              name="StockOperation"
              component={StockOperationModal}
              options={{
                title: 'Stock Operation',
                presentation: 'modal',
              }}
            />
            <Stack.Screen
              name="MovementsHistory"
              component={MovementsHistoryScreen}
              options={{ title: 'Movement History' }}
            />

            {/* Suppliers secondary screens */}
            <Stack.Screen
              name="SupplierList"
              component={SupplierListScreen}
              options={{ title: 'Suppliers' }}
            />
            <Stack.Screen
              name="SupplierForm"
              component={SupplierFormScreen}
              options={{ title: 'Supplier' }}
            />

            {/* Sales secondary screens */}
            <Stack.Screen
              name="NewSale"
              component={NewSaleScreen}
              options={{ title: 'Point of Sale' }}
            />
            <Stack.Screen
              name="SaleHistory"
              component={SaleHistoryScreen}
              options={{ title: 'Sales Receipts' }}
            />

            {/* Reports secondary screens */}
            <Stack.Screen
              name="RestockSuggestions"
              component={RestockSuggestionsScreen}
              options={{ title: 'Smart Restocking' }}
            />

            {/* Settings secondary screens */}
            <Stack.Screen
              name="BusinessProfile"
              component={BusinessProfileScreen}
              options={{ title: 'Business Profile' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashLogo: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  splashBrand: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 20,
  },
  tabIcon: {
    fontSize: 18,
  },
  splashIcon: {
    fontSize: 36,
  },
});
