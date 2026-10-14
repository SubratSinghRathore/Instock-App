import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { reportsApi } from '../../api/reports.api';
import { useAuth } from '../../context/AuthContext';
import { SalesChart } from '../../components/common/SalesChart';
import { Badge } from '../../components/common/Badge';
import { LoadingIndicator } from '../../components/common/LoadingIndicator';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

export const DashboardScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { business } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: dashboardData,
    isLoading,
    isRefetching,
    refetch,
    error,
  } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => reportsApi.getDashboard(),
  });

  const onRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['products'] });
    refetch();
  };

  const currency = business?.currency || 'USD';
  const summary = dashboardData?.summary || {
    totalProducts: 0,
    totalStockQuantity: 0,
    lowStockCount: 0,
    totalInventoryValue: 0,
  };
  const movements = dashboardData?.recentMovements || [];
  const chartData = dashboardData?.chartData || [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: Math.max(insets.top + 16, 32),
          paddingBottom: Math.max(insets.bottom + 80, 100),
        },
      ]}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} colors={[colors.primary]} />
      }
    >
      {/* Top Welcome Bar */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.businessName}>{business?.name || 'InStock'}</Text>
          <Text style={styles.greeting}>Inventory Overview</Text>
        </View>
        <TouchableOpacity
          style={styles.newSaleBtn}
          onPress={() => navigation.navigate('NewSale')}
          activeOpacity={0.8}
        >
          <Text style={styles.newSaleBtnText}>+ New Sale</Text>
        </TouchableOpacity>
      </View>

      {isLoading && !isRefetching ? (
        <LoadingIndicator message="Loading metrics..." />
      ) : error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>
            {(error as any)?.message || 'Failed to load dashboard metrics. Pull down to retry.'}
          </Text>
        </View>
      ) : (
        <>
          {/* Key Metrics Grid */}
          <View style={styles.kpiGrid}>
            <View style={[styles.kpiCard, styles.kpiCardBlue]}>
              <Text style={styles.kpiLabel}>Total Products</Text>
              <Text style={styles.kpiValue}>{summary.totalProducts}</Text>
              <Text style={styles.kpiSub}>{summary.totalStockQuantity} units in stock</Text>
            </View>

            <View
              style={[
                styles.kpiCard,
                summary.lowStockCount > 0 ? styles.kpiCardWarning : styles.kpiCardNeutral,
              ]}
            >
              <Text style={styles.kpiLabel}>Low Stock Alerts</Text>
              <Text
                style={[
                  styles.kpiValue,
                  summary.lowStockCount > 0 ? styles.kpiValueWarning : null,
                ]}
              >
                {summary.lowStockCount}
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('RestockSuggestions')}
              >
                <Text style={styles.kpiLink}>Restock advice →</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.kpiCard, styles.kpiCardEmerald, styles.kpiCardFull]}>
              <View style={styles.kpiRow}>
                <View>
                  <Text style={styles.kpiLabel}>Total Inventory Value</Text>
                  <Text style={styles.kpiValueLarge}>
                    {formatCurrency(summary.totalInventoryValue, currency)}
                  </Text>
                  <Text style={styles.kpiSub}>Based on purchase cost</Text>
                </View>
                <TouchableOpacity
                  style={styles.actionPill}
                  onPress={() => navigation.navigate('Products')}
                >
                  <Text style={styles.actionPillText}>Manage Stock</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Quick Actions Shortcuts */}
          <View style={styles.quickActionsRow}>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('ProductForm', {})}
            >
              <Text style={styles.quickActionIcon}>📦</Text>
              <Text style={styles.quickActionText}>Add Product</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('RestockSuggestions')}
            >
              <Text style={styles.quickActionIcon}>💡</Text>
              <Text style={styles.quickActionText}>Smart Restock</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('SaleHistory')}
            >
              <Text style={styles.quickActionIcon}>🧾</Text>
              <Text style={styles.quickActionText}>Sale Receipts</Text>
            </TouchableOpacity>
          </View>

          {/* 7-Day Sales Trend Chart */}
          <View style={styles.sectionMargin}>
            <SalesChart data={chartData} currency={currency} />
          </View>

          {/* Recent Stock Movements */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Stock Movements</Text>
            <TouchableOpacity onPress={() => navigation.navigate('MovementsHistory', {})}>
              <Text style={styles.viewAllText}>View All →</Text>
            </TouchableOpacity>
          </View>

          {movements.length === 0 ? (
            <View style={styles.emptyMovements}>
              <Text style={styles.emptyMovementsText}>No stock movements recorded yet.</Text>
            </View>
          ) : (
            <View style={styles.movementsList}>
              {movements.map((item) => {
                const isPositive = item.quantity > 0;
                const badgeVariant =
                  item.type === 'IN' || item.type === 'RETURN'
                    ? 'success'
                    : item.type === 'SALE'
                    ? 'info'
                    : item.type === 'OUT'
                    ? 'danger'
                    : 'warning';

                return (
                  <View key={item._id} style={styles.movementItem}>
                    <View style={styles.movementLeft}>
                      <Badge label={item.type} variant={badgeVariant} />
                      <View style={styles.movementDetails}>
                        <Text style={styles.movementProduct} numberOfLines={1}>
                          {item.productId?.name || 'Product'}
                        </Text>
                        <Text style={styles.movementReason} numberOfLines={1}>
                          {item.reason || formatDateTime(item.timestamp)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.movementRight}>
                      <Text
                        style={[
                          styles.movementQty,
                          isPositive ? styles.qtyPositive : styles.qtyNegative,
                        ]}
                      >
                        {isPositive ? `+${item.quantity}` : `${item.quantity}`}
                      </Text>
                      <Text style={styles.movementStockAfter}>
                        Stock: {item.newQuantity}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  businessName: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  greeting: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  newSaleBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  newSaleBtnText: {
    color: colors.textInverse,
    fontWeight: '700',
    fontSize: 13,
  },
  errorBox: {
    backgroundColor: colors.dangerLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  errorText: {
    color: colors.dangerText,
    fontSize: 13,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  kpiCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  kpiCardFull: {
    width: '100%',
  },
  kpiCardBlue: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  kpiCardNeutral: {
    borderLeftWidth: 4,
    borderLeftColor: colors.textSecondary,
  },
  kpiCardWarning: {
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
    backgroundColor: '#FFFDF5',
  },
  kpiCardEmerald: {
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
  },
  kpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kpiLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 4,
  },
  kpiValueLarge: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 4,
  },
  kpiValueWarning: {
    color: colors.warningText,
  },
  kpiSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  kpiLink: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.warningText,
    marginTop: 4,
  },
  actionPill: {
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  actionPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  quickActionCard: {
    width: '31%',
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickActionIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  sectionMargin: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  emptyMovements: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyMovementsText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  movementsList: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  movementItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceSecondary,
  },
  movementLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  movementDetails: {
    marginLeft: spacing.md,
    flex: 1,
  },
  movementProduct: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  movementReason: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  movementRight: {
    alignItems: 'flex-end',
    marginLeft: spacing.sm,
  },
  movementQty: {
    fontSize: 14,
    fontWeight: '700',
  },
  qtyPositive: {
    color: colors.success,
  },
  qtyNegative: {
    color: colors.danger,
  },
  movementStockAfter: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
});
