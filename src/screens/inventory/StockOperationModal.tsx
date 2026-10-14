import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { inventoryApi } from '../../api/inventory.api';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';

type OperationType = 'IN' | 'OUT' | 'ADJUSTMENT';

export const StockOperationModal = ({ route, navigation }: any) => {
  const { productId, productName, currentQuantity, initialType = 'IN' } = route.params;
  const queryClient = useQueryClient();

  const [type, setType] = useState<OperationType>(initialType);
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState(
    initialType === 'IN' ? 'Stock received' : initialType === 'OUT' ? 'Stock issued' : ''
  );
  const [referenceId, setReferenceId] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const numQty = parseInt(quantity, 10) || 0;

  // Calculate projected new balance
  let projectedNewQty = currentQuantity;
  if (type === 'IN') {
    projectedNewQty = currentQuantity + numQty;
  } else if (type === 'OUT') {
    projectedNewQty = currentQuantity - numQty;
  } else if (type === 'ADJUSTMENT') {
    projectedNewQty = numQty;
  }

  const isInvalidOut = type === 'OUT' && projectedNewQty < 0;

  const handleSubmit = async () => {
    try {
      setErrorMessage('');

      if (type === 'ADJUSTMENT') {
        if (!quantity || numQty < 0) {
          setErrorMessage('Please enter a valid target quantity (0 or greater).');
          return;
        }
        if (!reason.trim()) {
          setErrorMessage('An adjustment reason is strictly required.');
          return;
        }
      } else {
        if (!quantity || numQty <= 0) {
          setErrorMessage('Please enter a quantity greater than zero.');
          return;
        }
        if (type === 'OUT' && numQty > currentQuantity) {
          setErrorMessage(
            `Insufficient stock. Available: ${currentQuantity}, Requested: ${numQty}.`
          );
          return;
        }
      }

      setLoading(true);

      if (type === 'IN') {
        await inventoryApi.stockIn({
          productId,
          quantity: numQty,
          reason: reason.trim() || 'Stock received',
          referenceId: referenceId.trim(),
        });
      } else if (type === 'OUT') {
        await inventoryApi.stockOut({
          productId,
          quantity: numQty,
          reason: reason.trim() || 'Stock issued',
          referenceId: referenceId.trim(),
        });
      } else {
        await inventoryApi.adjustStock({
          productId,
          newQuantity: numQty,
          reason: reason.trim(),
          referenceId: referenceId.trim(),
        });
      }

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['movements'] });

      Alert.alert(
        'Success',
        `Stock updated successfully. New balance: ${projectedNewQty} units.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err: any) {
      setErrorMessage(err.message || 'Operation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.productTitle}>{productName}</Text>
      <Text style={styles.subtitle}>Inventory Management Operation</Text>

      {/* Operation Type Switcher */}
      <View style={styles.typeSwitcher}>
        <TouchableOpacity
          style={[styles.typeBtn, type === 'IN' && styles.typeBtnInActive]}
          onPress={() => {
            setType('IN');
            setReason('Stock received');
          }}
        >
          <Text style={[styles.typeText, type === 'IN' && styles.typeTextActive]}>
            + Stock In
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.typeBtn, type === 'OUT' && styles.typeBtnOutActive]}
          onPress={() => {
            setType('OUT');
            setReason('Stock issued / damaged');
          }}
        >
          <Text style={[styles.typeText, type === 'OUT' && styles.typeTextActive]}>
            - Stock Out
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.typeBtn, type === 'ADJUSTMENT' && styles.typeBtnAdjustActive]}
          onPress={() => {
            setType('ADJUSTMENT');
            setReason('');
          }}
        >
          <Text style={[styles.typeText, type === 'ADJUSTMENT' && styles.typeTextActive]}>
            ⚡ Adjust
          </Text>
        </TouchableOpacity>
      </View>

      {/* Current & Projected Stock Preview */}
      <View style={styles.stockPreviewCard}>
        <View style={styles.stockRow}>
          <View>
            <Text style={styles.previewLabel}>CURRENT BALANCE</Text>
            <Text style={styles.currentQty}>{currentQuantity} units</Text>
          </View>

          <Text style={styles.arrowIcon}>→</Text>

          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.previewLabel}>NEW PROJECTED BALANCE</Text>
            <Text
              style={[
                styles.projectedQty,
                isInvalidOut ? styles.qtyNegative : null,
              ]}
            >
              {projectedNewQty} units
            </Text>
          </View>
        </View>

        {isInvalidOut ? (
          <View style={styles.warningBanner}>
            <Text style={styles.warningText}>
              ⚠️ Cannot issue more stock than currently available.
            </Text>
          </View>
        ) : null}
      </View>

      {errorMessage ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      {/* Input Fields */}
      <View style={styles.formCard}>
        <Input
          label={type === 'ADJUSTMENT' ? 'New Total Quantity *' : 'Quantity to Process *'}
          placeholder="e.g. 10"
          keyboardType="number-pad"
          value={quantity}
          onChangeText={setQuantity}
        />

        <Input
          label={
            type === 'ADJUSTMENT'
              ? 'Reason for Adjustment (Required) *'
              : 'Reason / Note (Optional)'
          }
          placeholder={
            type === 'ADJUSTMENT'
              ? 'e.g. Physical inventory count mismatch, damaged stock'
              : 'e.g. Purchase order delivery, internal store use'
          }
          value={reason}
          onChangeText={setReason}
        />

        <Input
          label="Reference / Document Number (Optional)"
          placeholder="e.g. PO-9841, TICKET-104"
          value={referenceId}
          onChangeText={setReferenceId}
        />

        <Button
          title={
            type === 'IN'
              ? 'Confirm Stock In'
              : type === 'OUT'
              ? 'Confirm Stock Out'
              : 'Apply Stock Adjustment'
          }
          variant={type === 'OUT' ? 'danger' : 'primary'}
          onPress={handleSubmit}
          loading={loading}
          disabled={isInvalidOut}
          style={styles.submitBtn}
        />
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
  productTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    marginTop: 2,
  },
  typeSwitcher: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: 4,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  typeBtnInActive: {
    backgroundColor: colors.accent,
  },
  typeBtnOutActive: {
    backgroundColor: colors.danger,
  },
  typeBtnAdjustActive: {
    backgroundColor: colors.primary,
  },
  typeText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  typeTextActive: {
    color: colors.textInverse,
  },
  stockPreviewCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  stockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  currentQty: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 2,
  },
  arrowIcon: {
    fontSize: 22,
    color: colors.textMuted,
  },
  projectedQty: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 2,
  },
  qtyNegative: {
    color: colors.danger,
  },
  warningBanner: {
    backgroundColor: colors.dangerLight,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginTop: spacing.md,
  },
  warningText: {
    color: colors.dangerText,
    fontSize: 12,
    fontWeight: '600',
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
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  submitBtn: {
    marginTop: spacing.md,
  },
});
