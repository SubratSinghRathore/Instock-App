import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { reportsApi, RestockSuggestion } from '../../api/reports.api';
import { Badge } from '../../components/common/Badge';
import { LoadingIndicator } from '../../components/common/LoadingIndicator';
import { EmptyState } from '../../components/common/EmptyState';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';

export const RestockSuggestionsScreen = ({ navigation }: any) => {
  const queryClient = useQueryClient();

  const [safetyBuffer, setSafetyBuffer] = useState<number>(5);
  const [leadTimeDays, setLeadTimeDays] = useState<number>(7);

  const {
    data: suggestions = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['restockSuggestions', safetyBuffer, leadTimeDays],
    queryFn: () => reportsApi.getRestockSuggestions(safetyBuffer, leadTimeDays),
  });

  const onRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['restockSuggestions'] });
    refetch();
  };

  const handleStockIn = (item: RestockSuggestion) => {
    navigation.navigate('StockOperation', {
      productId: item.product.id,
      productName: item.product.name,
      currentQuantity: item.product.quantity,
      initialType: 'IN',
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Smart Restocking</Text>
        <Text style={styles.subtitle}>
          Velocity-driven forecasting & buffer optimization
        </Text>
      </View>

      {/* Buffer & Lead Time Controls */}
      <View style={styles.configCard}>
        <View style={styles.configCol}>
          <Text style={styles.configLabel}>Lead Time (Days)</Text>
          <View style={styles.pillsRow}>
            {[3, 7, 14].map((days) => (
              <TouchableOpacity
                key={days}
                style={[
                  styles.pill,
                  leadTimeDays === days && styles.pillActive,
                ]}
                onPress={() => setLeadTimeDays(days)}
              >
                <Text
                  style={[
                    styles.pillText,
                    leadTimeDays === days && styles.pillTextActive,
                  ]}
                >
                  {days}d
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.configDivider} />

        <View style={styles.configCol}>
          <Text style={styles.configLabel}>Safety Buffer (Units)</Text>
          <View style={styles.pillsRow}>
            {[3, 5, 10].map((units) => (
              <TouchableOpacity
                key={units}
                style={[
                  styles.pill,
                  safetyBuffer === units && styles.pillActive,
                ]}
                onPress={() => setSafetyBuffer(units)}
              >
                <Text
                  style={[
                    styles.pillText,
                    safetyBuffer === units && styles.pillTextActive,
                  ]}
                >
                  +{units}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {isLoading && !isRefetching ? (
        <LoadingIndicator message="Analyzing sales velocity..." />
      ) : suggestions.length === 0 ? (
        <EmptyState
          title="No inventory records"
          subtitle="Add products to generate restocking advice."
        />
      ) : (
        <FlatList
          data={suggestions}
          keyExtractor={(item) => item.product.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} colors={[colors.primary]} />
          }
          renderItem={({ item }) => (
            <View
              style={[
                styles.card,
                item.needsRestock ? styles.cardRestockNeeded : null,
              ]}
            >
              <View style={styles.cardTop}>
                {item.product.imageUrl ? (
                  <Image source={{ uri: item.product.imageUrl }} style={styles.productImg} />
                ) : (
                  <View style={styles.imgPlaceholder}>
                    <Text style={{ fontSize: 22 }}>📦</Text>
                  </View>
                )}

                <View style={styles.infoCol}>
                  <Text style={styles.productName}>{item.product.name}</Text>
                  <Text style={styles.skuText}>SKU: {item.product.sku}</Text>
                  <View style={styles.badgeRow}>
                    {item.needsRestock ? (
                      <Badge label="Restock Urgently" variant="danger" />
                    ) : (
                      <Badge label="Sufficient" variant="success" />
                    )}
                    {item.isEstimate ? (
                      <Badge label="Estimated" variant="neutral" style={{ marginLeft: 6 }} />
                    ) : null}
                  </View>
                </View>

                <View style={styles.currentCol}>
                  <Text style={styles.currentQty}>{item.product.quantity}</Text>
                  <Text style={styles.currentLabel}>in stock</Text>
                </View>
              </View>

              {/* Analytics row */}
              <View style={styles.analyticsRow}>
                <View style={styles.statCol}>
                  <Text style={styles.statLabel}>Daily Velocity</Text>
                  <Text style={styles.statVal}>{item.dailyVelocity} / day</Text>
                </View>

                <View style={styles.statCol}>
                  <Text style={styles.statLabel}>Stock Runout</Text>
                  <Text style={styles.statVal}>
                    {item.daysOfStockLeft !== null ? `${item.daysOfStockLeft} days` : 'N/A'}
                  </Text>
                </View>

                <View style={styles.statCol}>
                  <Text style={styles.statLabel}>Reorder Point</Text>
                  <Text style={styles.statVal}>{item.reorderPoint} units</Text>
                </View>
              </View>

              <Text style={styles.noteText}>ℹ️ {item.note}</Text>

              {item.needsRestock ? (
                <View style={styles.actionRow}>
                  <Text style={styles.suggestedQtyText}>
                    Suggest reorder: <Text style={{ fontWeight: '800', color: colors.primary }}>+{item.suggestedReorderQuantity}</Text> units
                  </Text>
                  <TouchableOpacity
                    style={styles.reorderBtn}
                    onPress={() => handleStockIn(item)}
                  >
                    <Text style={styles.reorderBtnText}>+ Stock In Now</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          )}
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
  configCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  configCol: {
    flex: 1,
  },
  configDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  configLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  pillsRow: {
    flexDirection: 'row',
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceSecondary,
    marginRight: 6,
  },
  pillActive: {
    backgroundColor: colors.primary,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  pillTextActive: {
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
  cardRestockNeeded: {
    borderLeftWidth: 4,
    borderLeftColor: colors.danger,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productImg: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.md,
  },
  imgPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCol: {
    flex: 1,
    marginLeft: spacing.md,
  },
  productName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  skuText: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  currentCol: {
    alignItems: 'flex-end',
    marginLeft: spacing.sm,
  },
  currentQty: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  currentLabel: {
    fontSize: 10,
    color: colors.textMuted,
  },
  analyticsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginTop: spacing.md,
  },
  statCol: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  statVal: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
  noteText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceSecondary,
  },
  suggestedQtyText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  reorderBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
  },
  reorderBtnText: {
    color: colors.textInverse,
    fontSize: 12,
    fontWeight: '700',
  },
});
