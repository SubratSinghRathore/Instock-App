import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { reportsApi } from '../../api/reports.api';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { LoadingIndicator } from '../../components/common/LoadingIndicator';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { formatCurrency, formatNumber } from '../../utils/formatters';

export const ReportsScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { business } = useAuth();
  const queryClient = useQueryClient();

  const [dateRange, setDateRange] = useState<'all' | '30d' | '7d'>('30d');
  const [exportingInventory, setExportingInventory] = useState(false);
  const [exportingSales, setExportingSales] = useState(false);

  // Compute start date based on filter
  const getStartDate = () => {
    if (dateRange === '7d') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      return d.toISOString();
    }
    if (dateRange === '30d') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      return d.toISOString();
    }
    return undefined;
  };

  const {
    data: salesMetrics,
    isLoading: metricsLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['salesSummary', dateRange],
    queryFn: () => reportsApi.getSalesSummary({ startDate: getStartDate() }),
  });

  const { data: topProducts = [], isLoading: topLoading } = useQuery({
    queryKey: ['topProducts'],
    queryFn: () => reportsApi.getTopProducts(),
  });

  const onRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['salesSummary'] });
    queryClient.invalidateQueries({ queryKey: ['topProducts'] });
    refetch();
  };

  const currency = business?.currency || 'USD';

  const handleExportInventoryCsv = async () => {
    try {
      setExportingInventory(true);
      const csvData = await reportsApi.getInventoryCsvExport();
      await Share.share({
        title: 'Inventory_Report.csv',
        message: csvData,
      });
    } catch (err: any) {
      Alert.alert('Export Error', err.message || 'Failed to export inventory CSV.');
    } finally {
      setExportingInventory(false);
    }
  };

  const handleExportSalesCsv = async () => {
    try {
      setExportingSales(true);
      const csvData = await reportsApi.getSalesCsvExport();
      await Share.share({
        title: 'Sales_Report.csv',
        message: csvData,
      });
    } catch (err: any) {
      Alert.alert('Export Error', err.message || 'Failed to export sales CSV.');
    } finally {
      setExportingSales(false);
    }
  };

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
      <View style={styles.header}>
        <Text style={styles.title}>Reports & Intelligence</Text>
        <Text style={styles.subtitle}>Financial insights & velocity metrics</Text>
      </View>

      {/* Smart Restocking Callout Card */}
      <TouchableOpacity
        style={styles.restockCallout}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('RestockSuggestions')}
      >
        <View style={styles.calloutLeft}>
          <Text style={styles.calloutIcon}>💡</Text>
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <Text style={styles.calloutTitle}>Smart Restocking Engine</Text>
            <Text style={styles.calloutSubtitle}>
              Predictions based on sales velocity and safety buffer
            </Text>
          </View>
        </View>
        <Text style={styles.calloutArrow}>→</Text>
      </TouchableOpacity>

      {/* Date Range Selector */}
      <View style={styles.rangeSelector}>
        <TouchableOpacity
          style={[styles.rangeBtn, dateRange === '7d' && styles.rangeBtnActive]}
          onPress={() => setDateRange('7d')}
        >
          <Text style={[styles.rangeText, dateRange === '7d' && styles.rangeTextActive]}>
            Last 7 Days
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.rangeBtn, dateRange === '30d' && styles.rangeBtnActive]}
          onPress={() => setDateRange('30d')}
        >
          <Text style={[styles.rangeText, dateRange === '30d' && styles.rangeTextActive]}>
            Last 30 Days
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.rangeBtn, dateRange === 'all' && styles.rangeBtnActive]}
          onPress={() => setDateRange('all')}
        >
          <Text style={[styles.rangeText, dateRange === 'all' && styles.rangeTextActive]}>
            All Time
          </Text>
        </TouchableOpacity>
      </View>

      {/* Financial Performance KPI Cards */}
      {metricsLoading && !isRefetching ? (
        <LoadingIndicator message="Calculating summary..." />
      ) : (
        <View style={styles.metricsGrid}>
          <View style={[styles.metricCard, styles.cardBlue]}>
            <Text style={styles.metricLabel}>Total Revenue</Text>
            <Text style={styles.metricValue}>
              {formatCurrency(salesMetrics?.totalRevenue || 0, currency)}
            </Text>
            <Text style={styles.metricSub}>{salesMetrics?.orderCount || 0} completed orders</Text>
          </View>

          <View style={[styles.metricCard, styles.cardEmerald]}>
            <Text style={styles.metricLabel}>Gross Profit</Text>
            <Text style={[styles.metricValue, { color: colors.accent }]}>
              {formatCurrency(salesMetrics?.grossProfit || 0, currency)}
            </Text>
            <Text style={styles.metricSub}>
              Margin: {salesMetrics?.totalRevenue ? Math.round(((salesMetrics.grossProfit) / salesMetrics.totalRevenue) * 100) : 0}%
            </Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Units Sold</Text>
            <Text style={styles.metricValue}>
              {formatNumber(salesMetrics?.totalItemsSold || 0)}
            </Text>
            <Text style={styles.metricSub}>Total inventory moved</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Avg. Order Value</Text>
            <Text style={styles.metricValue}>
              {formatCurrency(salesMetrics?.averageOrderValue || 0, currency)}
            </Text>
            <Text style={styles.metricSub}>Per sale transaction</Text>
          </View>
        </View>
      )}

      {/* Top Selling Products */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Top-Selling Products</Text>
        {topLoading ? (
          <Text style={styles.loadingText}>Loading top items...</Text>
        ) : topProducts.length === 0 ? (
          <Text style={styles.emptyText}>No sales recorded in this period.</Text>
        ) : (
          topProducts.map((p, idx) => (
            <View key={p._id || idx} style={styles.topItemRow}>
              <View style={styles.topItemRank}>
                <Text style={styles.rankNumber}>#{idx + 1}</Text>
              </View>

              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={styles.topItemName}>{p.productName}</Text>
                <Text style={styles.topItemUnits}>{p.unitsSold} units sold</Text>
              </View>

              <Text style={styles.topItemRevenue}>
                {formatCurrency(p.totalRevenue, currency)}
              </Text>
            </View>
          ))
        )}
      </View>

      {/* CSV Export Tools */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Spreadsheet CSV Exports</Text>
        <Text style={styles.cardSubtitle}>
          Generate spreadsheet-compatible CSV files for external accounting or reporting.
        </Text>

        <View style={styles.exportRow}>
          <Button
            title="📥 Export Inventory CSV"
            variant="outline"
            onPress={handleExportInventoryCsv}
            loading={exportingInventory}
            style={styles.exportBtn}
          />
        </View>

        <View style={[styles.exportRow, { marginTop: spacing.md }]}>
          <Button
            title="📥 Export Sales Transactions CSV"
            variant="outline"
            onPress={handleExportSalesCsv}
            loading={exportingSales}
            style={styles.exportBtn}
          />
        </View>
      </View>
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
  header: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  restockCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EEF2FF',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    marginBottom: spacing.lg,
  },
  calloutLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  calloutIcon: {
    fontSize: 26,
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  calloutSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  calloutArrow: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    marginLeft: spacing.sm,
  },
  rangeSelector: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: 4,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  rangeBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  rangeBtnActive: {
    backgroundColor: colors.primary,
  },
  rangeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  rangeTextActive: {
    color: colors.textInverse,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  metricCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardBlue: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  cardEmerald: {
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 4,
  },
  metricSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 13,
    paddingVertical: spacing.md,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
    paddingVertical: spacing.md,
  },
  topItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceSecondary,
  },
  topItemRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  topItemName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  topItemUnits: {
    fontSize: 11,
    color: colors.textMuted,
  },
  topItemRevenue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  exportRow: {
    width: '100%',
  },
  exportBtn: {
    height: 44,
  },
});
