import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { salesApi, SaleRecord } from '../../api/sales.api';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/common/Badge';
import { LoadingIndicator } from '../../components/common/LoadingIndicator';
import { EmptyState } from '../../components/common/EmptyState';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

export const SaleHistoryScreen = () => {
  const { business } = useAuth();
  const queryClient = useQueryClient();

  const [selectedSale, setSelectedSale] = useState<SaleRecord | null>(null);
  const [showRefundConfirm, setShowRefundConfirm] = useState(false);
  const [refundLoading, setRefundLoading] = useState(false);

  const {
    data,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['sales'],
    queryFn: () => salesApi.getSales({ limit: 100 }),
  });

  const sales = data?.sales || [];
  const currency = business?.currency || 'USD';

  const onRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['sales'] });
    refetch();
  };

  const handleRefund = async () => {
    if (!selectedSale) return;

    try {
      setRefundLoading(true);
      await salesApi.returnSale(selectedSale._id, 'Customer return / refund');
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      Alert.alert('Sale Refunded', `Invoice #${selectedSale.invoiceNumber} has been refunded and items returned to stock.`);
    } catch (err: any) {
      Alert.alert('Refund Error', err.message || 'Failed to refund sale.');
    } finally {
      setRefundLoading(false);
      setShowRefundConfirm(false);
      setSelectedSale(null);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Sales Invoices & Receipts</Text>
        <Text style={styles.subtitle}>
          {data?.pagination?.total || 0} recorded transactions
        </Text>
      </View>

      {isLoading && !isRefetching ? (
        <LoadingIndicator message="Loading sales history..." />
      ) : sales.length === 0 ? (
        <EmptyState
          title="No sales transactions yet"
          subtitle="Record customer orders from the Point of Sale screen."
        />
      ) : (
        <FlatList
          data={sales}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} colors={[colors.primary]} />
          }
          renderItem={({ item }) => {
            const isRefunded = item.status === 'REFUNDED';
            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.invoiceNumber}>#{item.invoiceNumber}</Text>
                    <Text style={styles.dateText}>{formatDateTime(item.timestamp)}</Text>
                  </View>

                  <View style={{ alignItems: 'flex-end' }}>
                    <Badge
                      label={item.status}
                      variant={isRefunded ? 'danger' : 'success'}
                    />
                    <Text style={styles.paymentMethodText}>
                      {item.paymentMethod}
                    </Text>
                  </View>
                </View>

                {/* Line Items List */}
                <View style={styles.itemsList}>
                  {item.items.map((line, idx) => (
                    <View key={idx} style={styles.lineItemRow}>
                      <Text style={styles.lineItemName}>
                        {line.productName} × {line.quantity}
                      </Text>
                      <Text style={styles.lineItemPrice}>
                        {formatCurrency(line.total, currency)}
                      </Text>
                    </View>
                  ))}
                </View>

                <View style={styles.divider} />

                {/* Footer with Total and Refund Button */}
                <View style={styles.cardFooter}>
                  <View>
                    <Text style={styles.totalLabel}>TOTAL</Text>
                    <Text
                      style={[
                        styles.totalAmount,
                        isRefunded && styles.totalRefunded,
                      ]}
                    >
                      {formatCurrency(item.totalAmount, currency)}
                    </Text>
                  </View>

                  {!isRefunded ? (
                    <TouchableOpacity
                      style={styles.refundBtn}
                      onPress={() => {
                        setSelectedSale(item);
                        setShowRefundConfirm(true);
                      }}
                    >
                      <Text style={styles.refundBtnText}>Process Return / Refund</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.refundedNote}>Restocked to Inventory</Text>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}

      <ConfirmDialog
        visible={showRefundConfirm}
        title="Refund Sale"
        message={`Are you sure you want to refund invoice #${selectedSale?.invoiceNumber}? All line items will be returned to inventory stock automatically.`}
        confirmTitle="Confirm Refund"
        isDestructive
        loading={refundLoading}
        onConfirm={handleRefund}
        onCancel={() => {
          setShowRefundConfirm(false);
          setSelectedSale(null);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
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
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  invoiceNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  dateText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  paymentMethodText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 4,
  },
  itemsList: {
    marginTop: spacing.md,
  },
  lineItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  lineItemName: {
    fontSize: 13,
    color: colors.textPrimary,
    flex: 1,
  },
  lineItemPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: colors.surfaceSecondary,
    marginVertical: spacing.md,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  totalRefunded: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
  },
  refundBtn: {
    backgroundColor: colors.dangerLight,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
  },
  refundBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.dangerText,
  },
  refundedNote: {
    fontSize: 11,
    color: colors.danger,
    fontWeight: '600',
  },
});
