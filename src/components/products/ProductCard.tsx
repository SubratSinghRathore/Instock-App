import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { ProductItem } from '../../api/products.api';
import { Badge } from '../common/Badge';
import { formatCurrency } from '../../utils/formatters';

interface ProductCardProps {
  product: ProductItem;
  currency?: string;
  onPress: () => void;
  onStockIn?: () => void;
  onStockOut?: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  currency = 'USD',
  onPress,
  onStockIn,
  onStockOut,
}) => {
  const isOutOfStock = product.quantity <= 0;
  const isLowStock = !isOutOfStock && product.quantity <= product.lowStockThreshold;

  const getStockBadge = () => {
    if (isOutOfStock) {
      return <Badge label="Out of Stock" variant="danger" />;
    }
    if (isLowStock) {
      return <Badge label={`Low Stock (${product.quantity})`} variant="warning" />;
    }
    return <Badge label={`${product.quantity} in stock`} variant="success" />;
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={styles.card}
      onPress={onPress}
    >
      <View style={styles.topRow}>
        {product.imageUrl ? (
          <Image source={{ uri: product.imageUrl }} style={styles.thumbnail} />
        ) : (
          <View style={styles.thumbnailPlaceholder}>
            <Text style={styles.thumbnailPlaceholderText}>📦</Text>
          </View>
        )}

        <View style={styles.infoCol}>
          <View style={styles.headerRow}>
            <Text style={styles.productName} numberOfLines={1}>
              {product.name}
            </Text>
          </View>

          <Text style={styles.skuText}>SKU: {product.sku}</Text>
          <Text style={styles.categoryText}>{product.category}</Text>

          <View style={styles.priceRow}>
            <Text style={styles.sellingPrice}>
              {formatCurrency(product.sellingPrice, currency)}
            </Text>
            <Text style={styles.costPrice}>
              Cost: {formatCurrency(product.purchasePrice, currency)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.bottomRow}>
        <View style={styles.badgeWrapper}>{getStockBadge()}</View>

        <View style={styles.actionsWrapper}>
          {onStockIn ? (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onStockIn}
              style={[styles.quickBtn, styles.stockInBtn]}
            >
              <Text style={styles.stockInText}>+ In</Text>
            </TouchableOpacity>
          ) : null}

          {onStockOut ? (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onStockOut}
              style={[styles.quickBtn, styles.stockOutBtn]}
              disabled={product.quantity <= 0}
            >
              <Text
                style={[
                  styles.stockOutText,
                  product.quantity <= 0 && styles.disabledText,
                ]}
              >
                - Out
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 1,
  },
  topRow: {
    flexDirection: 'row',
  },
  thumbnail: {
    width: 68,
    height: 68,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceSecondary,
  },
  thumbnailPlaceholder: {
    width: 68,
    height: 68,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailPlaceholderText: {
    fontSize: 26,
  },
  infoCol: {
    flex: 1,
    marginLeft: spacing.md,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  skuText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  categoryText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
    marginTop: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  sellingPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    marginRight: spacing.md,
  },
  costPrice: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceSecondary,
  },
  badgeWrapper: {
    flex: 1,
  },
  actionsWrapper: {
    flexDirection: 'row',
  },
  quickBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.sm,
  },
  stockInBtn: {
    backgroundColor: colors.accentLight,
  },
  stockInText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '700',
  },
  stockOutBtn: {
    backgroundColor: colors.surfaceSecondary,
  },
  stockOutText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  disabledText: {
    color: colors.textMuted,
  },
});
