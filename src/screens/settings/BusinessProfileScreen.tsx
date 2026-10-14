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
import { useAuth } from '../../context/AuthContext';
import { businessApi } from '../../api/business.api';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';

const businessSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  currency: z.string().min(1).max(5),
  lowStockAlertThreshold: z.coerce.number().min(0),
  contactEmail: z.string().email().optional().or(z.literal('')),
  contactPhone: z.string().optional().default(''),
  address: z.string().optional().default(''),
});

type BusinessFormData = z.infer<typeof businessSchema>;

export const BusinessProfileScreen = ({ navigation }: any) => {
  const { business, updateBusinessState } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<BusinessFormData>({
    resolver: zodResolver(businessSchema) as any,
    defaultValues: {
      name: business?.name || '',
      currency: business?.currency || 'USD',
      lowStockAlertThreshold: business?.lowStockAlertThreshold || 5,
      contactEmail: business?.contactEmail || '',
      contactPhone: business?.contactPhone || '',
      address: business?.address || '',
    },
  });

  const onSubmit = async (data: BusinessFormData) => {
    try {
      setLoading(true);
      setErrorMessage('');

      const updated = await businessApi.updateProfile({
        name: data.name,
        currency: data.currency.toUpperCase(),
        lowStockAlertThreshold: data.lowStockAlertThreshold,
        contactEmail: data.contactEmail || undefined,
        contactPhone: data.contactPhone || undefined,
        address: data.address || undefined,
      });

      updateBusinessState(updated);
      Alert.alert('Saved', 'Business profile updated successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.screenTitle}>Edit Business Profile</Text>

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
              label="Business / Store Name *"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={errors.name?.message}
            />
          )}
        />

        <View style={styles.row}>
          <View style={styles.col}>
            <Controller
              control={control}
              name="currency"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Currency Code *"
                  autoCapitalize="characters"
                  maxLength={4}
                  onBlur={onBlur}
                  onChangeText={(val) => onChange(val.toUpperCase())}
                  value={value}
                  error={errors.currency?.message}
                />
              )}
            />
          </View>
          <View style={{ width: spacing.md }} />
          <View style={styles.col}>
            <Controller
              control={control}
              name="lowStockAlertThreshold"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Alert Threshold"
                  keyboardType="number-pad"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value !== undefined ? String(value) : ''}
                  error={errors.lowStockAlertThreshold?.message}
                />
              )}
            />
          </View>
        </View>

        <Controller
          control={control}
          name="contactEmail"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Contact Email"
              keyboardType="email-address"
              autoCapitalize="none"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={errors.contactEmail?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="contactPhone"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Contact Phone"
              keyboardType="phone-pad"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={errors.contactPhone?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="address"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Business Address"
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
          title="Save Business Profile"
          onPress={handleSubmit(onSubmit)}
          loading={loading}
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
  row: {
    flexDirection: 'row',
  },
  col: {
    flex: 1,
  },
  submitBtn: {
    marginTop: spacing.md,
  },
});
