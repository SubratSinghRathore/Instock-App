import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { inventoryApi, MovementType } from '../../api/inventory.api';
import { Badge } from '../../components/common/Badge';
import { LoadingIndicator } from '../../components/common/LoadingIndicator';
import { EmptyState } from '../../components/common/EmptyState';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { formatDateTime } from '../../utils/formatters';

const MOVEMENT_TYPES: Array<{ label: string; value?: MovementType }> = [
  { label: 'All Operations', value: undefined },
  { label: 'Stock In', value: 'IN' },
  { label: 'Stock Out', value: 'OUT' },
  { label: 'Sales', value: 'SALE' },
  { label: 'Returns', value: 'RETURN' },
  { label: 'Adjustments', value: 'ADJUSTMENT' },
];

export const MovementsHistoryScreen = ({ route }: any) => {
  const productId = route.params?.productId;
  const queryClient = useQueryClient();

  const [selectedType, setSelectedType] = useState<MovementType | undefined>(undefined);

  const {
    data,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['movements', productId, selectedType],
    queryFn: () =>
      inventoryApi.getMovements({
        productId,
        type: selectedType,
        limit: 100,
      }),
  });

  const movements = data?.movements || [];

  const onRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['movements'] });
    refetch();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Stock Movement History</Text>
        <Text style={styles.subtitle}>
          {data?.pagination?.total || 0} audit operations logged
        </Text>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent}>
          {MOVEMENT_TYPES.map((t) => {
            const isActive = selectedType === t.value;
            return (
              <TouchableOpacity
                key={t.label}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setSelectedType(t.value)}
              >
                <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {isLoading && !isRefetching ? (
        <LoadingIndicator message="Loading audit history..." />
      ) : movements.length === 0 ? (
        <EmptyState
          title="No stock movements recorded"
          subtitle="Operations will appear here as inventory is received, sold, or adjusted."
        />
      ) : (
        <FlatList
          data={movements}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} colors={[colors.primary]} />
          }
          renderItem={({ item }) => {
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
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.badgeCol}>
                    <Badge label={item.type} variant={badgeVariant} />
                    <Text style={styles.timestamp}>{formatDateTime(item.timestamp)}</Text>
                  </View>

                  <View style={styles.qtyCol}>
                    <Text
                      style={[
                        styles.qtyText,
                        isPositive ? styles.qtyPositive : styles.qtyNegative,
                      ]}
                    >
                      {isPositive ? `+${item.quantity}` : `${item.quantity}`}
                    </Text>
                    <Text style={styles.balanceText}>
                      Balance: {item.newQuantity} (was {item.previousQuantity})
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.cardBottom}>
                  <Text style={styles.productName}>
                    {item.productId?.name || 'Product'}
                    {item.productId?.sku ? ` (${item.productId.sku})` : ''}
                  </Text>
                  {item.reason ? (
                    <Text style={styles.reasonText}>Reason: {item.reason}</Text>
                  ) : null}
                  {item.referenceId ? (
                    <Text style={styles.refText}>Ref: {item.referenceId}</Text>
                  ) : null}
                  <Text style={styles.userText}>Logged by: {item.userId?.name || 'Staff'}</Text>
                </View>
              </View>
            );
          }}
        />
      )}
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
  filterRow: {
    marginVertical: spacing.md,
  },
  filterContent: {
    paddingHorizontal: spacing.lg,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: colors.textInverse,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
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
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  badgeCol: {
    alignItems: 'flex-start',
  },
  timestamp: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 6,
  },
  qtyCol: {
    alignItems: 'flex-end',
  },
  qtyText: {
    fontSize: 16,
    fontWeight: '800',
  },
  qtyPositive: {
    color: colors.success,
  },
  qtyNegative: {
    color: colors.danger,
  },
  balanceText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.surfaceSecondary,
    marginVertical: spacing.sm,
  },
  cardBottom: {
    marginTop: 2,
  },
  productName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  reasonText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  refText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  userText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
  },
});
