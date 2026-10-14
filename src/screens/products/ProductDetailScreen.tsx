import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '../../api/products.api';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { LoadingIndicator } from '../../components/common/LoadingIndicator';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

export const ProductDetailScreen = ({ route, navigation }: any) => {
  const { productId } = route.params;
  const { business } = useAuth();
  const queryClient = useQueryClient();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const {
    data,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => productsApi.getProduct(productId),
  });

  const product = data?.product;
  const movements = data?.recentMovements || [];
  const currency = business?.currency || 'USD';

  const onRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['product', productId] });
    refetch();
  };

  const handleDelete = async () => {
    try {
      setDeleteLoading(true);
      await productsApi.deleteProduct(productId);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to archive product.');
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  if (isLoading && !isRefetching) {
    return <LoadingIndicator message="Loading product details..." />;
  }

  if (!product) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Product not found</Text>
        <Button title="Go Back" onPress={() => navigation.goBack()} variant="outline" />
      </View>
    );
  }

  const isOutOfStock = product.quantity <= 0;
  const isLowStock = !isOutOfStock && product.quantity <= product.lowStockThreshold;

  // Profit margin calculation
  const margin =
    product.sellingPrice > 0
      ? Math.round(((product.sellingPrice - product.purchasePrice) / product.sellingPrice) * 100)
      : 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} colors={[colors.primary]} />
      }
    >
      {/* Product Image Header */}
      <View style={styles.imageCard}>
        {product.imageUrl ? (
          <Image source={{ uri: product.imageUrl }} style={styles.productImage} resizeMode="cover" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderText}>📦</Text>
          </View>
        )}
      </View>

      {/* Main Info Card */}
      <View style={styles.card}>
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.skuText}>SKU: {product.sku}</Text>
            {product.barcode ? <Text style={styles.barcodeText}>Barcode: {product.barcode}</Text> : null}
          </View>
          <Badge label={product.category} variant="info" />
        </View>

        {product.description ? (
          <Text style={styles.description}>{product.description}</Text>
        ) : null}

        {/* Stock Level Banner */}
        <View style={styles.stockBanner}>
          <View>
            <Text style={styles.stockBannerLabel}>CURRENT STOCK</Text>
            <Text style={styles.stockBannerValue}>{product.quantity} units</Text>
            <Text style={styles.stockThresholdText}>
              Threshold: {product.lowStockThreshold} units
            </Text>
          </View>

          {isOutOfStock ? (
            <Badge label="Out of Stock" variant="danger" />
          ) : isLowStock ? (
            <Badge label="Low Stock Warning" variant="warning" />
          ) : (
            <Badge label="Healthy Stock" variant="success" />
          )}
        </View>

        {/* Financials / Pricing */}
        <View style={styles.pricingRow}>
          <View style={styles.priceCol}>
            <Text style={styles.priceLabel}>Selling Price</Text>
            <Text style={styles.sellingPrice}>
              {formatCurrency(product.sellingPrice, currency)}
            </Text>
          </View>

          <View style={styles.priceDivider} />

          <View style={styles.priceCol}>
            <Text style={styles.priceLabel}>Purchase Cost</Text>
            <Text style={styles.costPrice}>
              {formatCurrency(product.purchasePrice, currency)}
            </Text>
          </View>

          <View style={styles.priceDivider} />

          <View style={styles.priceCol}>
            <Text style={styles.priceLabel}>Profit Margin</Text>
            <Text style={[styles.marginText, margin > 0 ? styles.marginPositive : null]}>
              {margin}%
            </Text>
          </View>
        </View>
      </View>

      {/* Quick Stock Actions Grid */}
      <View style={styles.actionsGrid}>
        <Button
          title="+ Stock In"
          onPress={() =>
            navigation.navigate('StockOperation', {
              productId: product._id,
              productName: product.name,
              currentQuantity: product.quantity,
              initialType: 'IN',
            })
          }
          style={styles.actionBtn}
        />

        <Button
          title="- Stock Out"
          variant="secondary"
          onPress={() =>
            navigation.navigate('StockOperation', {
              productId: product._id,
              productName: product.name,
              currentQuantity: product.quantity,
              initialType: 'OUT',
            })
          }
          style={styles.actionBtn}
          disabled={product.quantity <= 0}
        />

        <Button
          title="⚡ Adjust Stock"
          variant="outline"
          onPress={() =>
            navigation.navigate('StockOperation', {
              productId: product._id,
              productName: product.name,
              currentQuantity: product.quantity,
              initialType: 'ADJUSTMENT',
            })
          }
          style={styles.actionBtnFull}
        />
      </View>

      {/* Supplier Section */}
      {product.supplierId ? (
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>Supplier Information</Text>
          <Text style={styles.supplierName}>{product.supplierId.name}</Text>
          {product.supplierId.phone ? (
            <Text style={styles.supplierDetail}>📞 {product.supplierId.phone}</Text>
          ) : null}
          {product.supplierId.email ? (
            <Text style={styles.supplierDetail}>✉️ {product.supplierId.email}</Text>
          ) : null}
        </View>
      ) : null}

      {/* Recent Movements Audit Trail */}
      <View style={styles.card}>
        <View style={styles.movementsHeader}>
          <Text style={styles.sectionHeader}>Stock Movements History</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('MovementsHistory', { productId: product._id })}
          >
            <Text style={styles.viewFullHistory}>Full History →</Text>
          </TouchableOpacity>
        </View>

        {movements.length === 0 ? (
          <Text style={styles.emptyMovementsText}>No stock history yet for this product.</Text>
        ) : (
          movements.map((m: any) => {
            const isPositive = m.quantity > 0;
            return (
              <View key={m._id} style={styles.movementItem}>
                <View>
                  <Text style={styles.movementType}>{m.type}</Text>
                  <Text style={styles.movementReason}>
                    {m.reason || formatDateTime(m.timestamp)}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text
                    style={[
                      styles.movementDelta,
                      isPositive ? styles.qtyPositive : styles.qtyNegative,
                    ]}
                  >
                    {isPositive ? `+${m.quantity}` : `${m.quantity}`}
                  </Text>
                  <Text style={styles.movementBalance}>Balance: {m.newQuantity}</Text>
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* Edit & Archive Actions */}
      <View style={styles.managementRow}>
        <Button
          title="Edit Details"
          variant="outline"
          onPress={() => navigation.navigate('ProductForm', { product })}
          style={styles.manageBtn}
        />
        <View style={{ width: spacing.md }} />
        <Button
          title="Archive Product"
          variant="danger"
          onPress={() => setShowDeleteConfirm(true)}
          style={styles.manageBtn}
        />
      </View>

      <ConfirmDialog
        visible={showDeleteConfirm}
        title="Archive Product"
        message={`Are you sure you want to archive "${product.name}"? It will no longer appear in active inventory.`}
        confirmTitle="Archive"
        isDestructive
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
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
  imageCard: {
    height: 200,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSecondary,
  },
  imagePlaceholderText: {
    fontSize: 54,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  productName: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  skuText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  barcodeText: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 1,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginTop: spacing.md,
  },
  stockBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  stockBannerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  stockBannerValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 2,
  },
  stockThresholdText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceSecondary,
  },
  priceCol: {
    flex: 1,
    alignItems: 'center',
  },
  priceDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border,
  },
  priceLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  sellingPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 2,
  },
  costPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
  marginText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textSecondary,
    marginTop: 2,
  },
  marginPositive: {
    color: colors.accent,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  actionBtn: {
    width: '48%',
    marginBottom: spacing.md,
  },
  actionBtnFull: {
    width: '100%',
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  supplierName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  supplierDetail: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  movementsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  viewFullHistory: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  emptyMovementsText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  movementItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceSecondary,
  },
  movementType: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  movementReason: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  movementDelta: {
    fontSize: 14,
    fontWeight: '700',
  },
  qtyPositive: {
    color: colors.success,
  },
  qtyNegative: {
    color: colors.danger,
  },
  movementBalance: {
    fontSize: 11,
    color: colors.textMuted,
  },
  managementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  manageBtn: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  errorText: {
    fontSize: 16,
    color: colors.danger,
    marginBottom: spacing.lg,
  },
});
