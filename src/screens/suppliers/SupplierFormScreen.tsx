import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { suppliersApi } from '../../api/suppliers.api';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';

const supplierSchema = z.object({
  name: z.string().min(1, 'Supplier name is required'),
  phone: z.string().optional().default(''),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional().default(''),
});

type SupplierFormData = z.infer<typeof supplierSchema>;

export const SupplierFormScreen = ({ route, navigation }: any) => {
  const existingSupplier = route.params?.supplier;
  const isEditing = !!existingSupplier;
  const queryClient = useQueryClient();

  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema) as any,
    defaultValues: {
      name: existingSupplier?.name || '',
      phone: existingSupplier?.phone || '',
      email: existingSupplier?.email || '',
      address: existingSupplier?.address || '',
    },
  });

  const onSubmit = async (data: SupplierFormData) => {
    try {
      setLoading(true);
      setErrorMessage('');

      if (isEditing) {
        await suppliersApi.updateSupplier(existingSupplier._id, data);
      } else {
        await suppliersApi.createSupplier(data);
      }

      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      navigation.goBack();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save supplier.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleteLoading(true);
      await suppliersApi.deleteSupplier(existingSupplier._id);
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to delete supplier.');
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.screenTitle}>
        {isEditing ? 'Edit Supplier' : 'Add New Supplier'}
      </Text>

      {errorMessage ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Supplier / Vendor Name *"
              placeholder="e.g. Acme Industrial Supplies"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={errors.name?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="phone"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Phone Number"
              placeholder="+1 555-0192"
              keyboardType="phone-pad"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={errors.phone?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Email Address"
              placeholder="orders@supplier.com"
              keyboardType="email-address"
              autoCapitalize="none"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={errors.email?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="address"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Warehouse / Business Address"
              placeholder="123 Logistics Way, Suite 400"
              multiline
              numberOfLines={2}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={errors.address?.message}
            />
          )}
        />

        <Button
          title={isEditing ? 'Save Changes' : 'Create Supplier'}
          onPress={handleSubmit(onSubmit)}
          loading={loading}
          style={styles.submitBtn}
        />
      </View>

      {isEditing ? (
        <Button
          title="Delete Supplier"
          variant="danger"
          onPress={() => setShowDeleteConfirm(true)}
          style={{ marginTop: spacing.md }}
        />
      ) : null}

      <ConfirmDialog
        visible={showDeleteConfirm}
        title="Delete Supplier"
        message={`Delete "${existingSupplier?.name}"? Linked products will remain in stock with supplier set to unassigned.`}
        confirmTitle="Delete"
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
  },
  submitBtn: {
    marginTop: spacing.md,
  },
});
