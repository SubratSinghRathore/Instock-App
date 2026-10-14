import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { productsApi, ProductItem } from '../../api/products.api';
import { salesApi, PaymentMethod } from '../../api/sales.api';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { formatCurrency } from '../../utils/formatters';

interface CartItem {
  product: ProductItem;
  quantity: number;
  unitPrice: number;
}

export const NewSaleScreen = ({ navigation }: any) => {
  const { business } = useAuth();
  const queryClient = useQueryClient();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch available products
  const { data: productData } = useQuery({
    queryKey: ['products', productSearch],
    queryFn: () =>
      productsApi.getProducts({
        search: productSearch.trim() || undefined,
        isArchived: false,
        limit: 50,
      }),
  });

  const availableProducts = (productData?.products || []).filter((p) => p.quantity > 0);
  const currency = business?.currency || 'USD';

  const addToCart = (product: ProductItem) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product._id === product._id);
      if (existing) {
        if (existing.quantity >= product.quantity) {
          Alert.alert('Limit reached', `Only ${product.quantity} units available in stock.`);
          return prev;
        }
        return prev.map((item) =>
          item.product._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1, unitPrice: product.sellingPrice }];
    });
  };

  const updateCartQty = (productId: string, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart((prev) =>
      prev.map((item) => {
        if (item.product._id === productId) {
          if (newQty > item.product.quantity) {
            Alert.alert('Stock limit', `Only ${item.product.quantity} units available.`);
            return item;
          }
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product._id !== productId));
  };

  const totalAmount = cart.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );

  const handleCheckout = async () => {
    if (cart.length === 0) {
      setErrorMessage('Your sale cart is empty. Please add items.');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');

      const items = cart.map((c) => ({
        productId: c.product._id,
        quantity: c.quantity,
        unitPrice: c.unitPrice,
      }));

      // Generate idempotency key for network resilience
      const idempotencyKey = `sale-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const sale = await salesApi.recordSale({
        items,
        paymentMethod,
        notes: notes.trim(),
        idempotencyKey,
      });

      // Refresh cache
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['movements'] });

      Alert.alert(
        'Sale Recorded!',
        `Invoice #${sale.invoiceNumber}\nTotal: ${formatCurrency(sale.totalAmount, currency)}`,
        [{ text: 'Done', onPress: () => navigation.goBack() }]
      );
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to process sale.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.screenTitle}>Point of Sale (New Sale)</Text>

      {errorMessage ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      {/* Cart Summary Card */}
      <View style={styles.card}>
        <View style={styles.cartHeader}>
          <Text style={styles.cartTitle}>Order Items ({cart.length})</Text>
          {cart.length > 0 ? (
            <TouchableOpacity onPress={() => setCart([])}>
              <Text style={styles.clearCartText}>Clear</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {cart.length === 0 ? (
          <View style={styles.emptyCartBox}>
            <Text style={styles.emptyCartText}>
              Cart is empty. Select products below to add them to this sale.
            </Text>
          </View>
        ) : (
          cart.map((item) => (
            <View key={item.product._id} style={styles.cartItemRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cartItemName}>{item.product.name}</Text>
                <Text style={styles.cartItemPrice}>
                  {formatCurrency(item.unitPrice, currency)} each
                </Text>
              </View>

              <View style={styles.qtyControls}>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => updateCartQty(item.product._id, item.quantity - 1)}
                >
                  <Text style={styles.qtyBtnText}>-</Text>
                </TouchableOpacity>

                <Text style={styles.qtyDisplay}>{item.quantity}</Text>

                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => updateCartQty(item.product._id, item.quantity + 1)}
                >
                  <Text style={styles.qtyBtnText}>+</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.lineTotal}>
                {formatCurrency(item.unitPrice * item.quantity, currency)}
              </Text>
            </View>
          ))
        )}

        {cart.length > 0 ? (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TOTAL AMOUNT</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(totalAmount, currency)}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Payment Options */}
      {cart.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Payment Method</Text>
          <View style={styles.paymentRow}>
            {(['CASH', 'CARD', 'UPI', 'OTHER'] as PaymentMethod[]).map((method) => (
              <TouchableOpacity
                key={method}
                style={[
                  styles.paymentPill,
                  paymentMethod === method && styles.paymentPillActive,
                ]}
                onPress={() => setPaymentMethod(method)}
              >
                <Text
                  style={[
                    styles.paymentPillText,
                    paymentMethod === method && styles.paymentPillTextActive,
                  ]}
                >
                  {method}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Input
            label="Notes / Customer Name"
            placeholder="e.g. Table 4, Walk-in customer"
            value={notes}
            onChangeText={setNotes}
            containerStyle={{ marginTop: spacing.md }}
          />

          <Button
            title={`Complete Sale • ${formatCurrency(totalAmount, currency)}`}
            onPress={handleCheckout}
            loading={loading}
            style={styles.checkoutBtn}
          />
        </View>
      ) : null}

      {/* Product Selection Catalog */}
      <View style={styles.catalogCard}>
        <Text style={styles.cardSectionTitle}>Catalog Items</Text>
        <Input
          placeholder="Filter catalog products..."
          value={productSearch}
          onChangeText={setProductSearch}
        />

        {availableProducts.length === 0 ? (
          <Text style={styles.emptyCatalogText}>No available products in stock.</Text>
        ) : (
          availableProducts.map((p) => {
            const inCart = cart.find((c) => c.product._id === p._id);
            return (
              <TouchableOpacity
                key={p._id}
                style={styles.catalogItem}
                onPress={() => addToCart(p)}
                activeOpacity={0.7}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.catalogItemName}>{p.name}</Text>
                  <Text style={styles.catalogItemSku}>
                    SKU: {p.sku} • Stock: {p.quantity} units
                  </Text>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.catalogItemPrice}>
                    {formatCurrency(p.sellingPrice, currency)}
                  </Text>
                  {inCart ? (
                    <Badge label={`${inCart.quantity} in cart`} variant="info" />
                  ) : (
                    <Text style={styles.addText}>+ Add</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}
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
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.lg,
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  cartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  clearCartText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.danger,
  },
  emptyCartBox: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  emptyCartText: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },
  cartItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceSecondary,
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  cartItemPrice: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.md,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  qtyDisplay: {
    fontSize: 14,
    fontWeight: '700',
    marginHorizontal: spacing.sm,
    minWidth: 20,
    textAlign: 'center',
  },
  lineTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    minWidth: 64,
    textAlign: 'right',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primary,
  },
  cardSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  paymentPill: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.sm,
    marginHorizontal: 3,
  },
  paymentPillActive: {
    backgroundColor: colors.primary,
  },
  paymentPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  paymentPillTextActive: {
    color: colors.textInverse,
  },
  checkoutBtn: {
    marginTop: spacing.lg,
  },
  catalogCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyCatalogText: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 13,
    paddingVertical: spacing.md,
  },
  catalogItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceSecondary,
  },
  catalogItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  catalogItemSku: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  catalogItemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  addText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.accent,
  },
});
