import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { launchImageLibrary } from 'react-native-image-picker';
import { productsApi } from '../../api/products.api';
import { suppliersApi } from '../../api/suppliers.api';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  sku: z.string().min(1, 'SKU is required'),
  barcode: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  description: z.string().optional(),
  purchasePrice: z.coerce.number().min(0, 'Purchase price cannot be negative'),
  sellingPrice: z.coerce.number().min(0, 'Selling price cannot be negative'),
  quantity: z.coerce.number().int().min(0, 'Quantity cannot be negative'),
  lowStockThreshold: z.coerce.number().int().min(0, 'Threshold cannot be negative'),
  supplierId: z.string().optional(),
});

type ProductFormData = {
  name: string;
  sku: string;
  barcode?: string;
  category: string;
  description?: string;
  purchasePrice: number;
  sellingPrice: number;
  quantity: number;
  lowStockThreshold: number;
  supplierId?: string;
};

export const ProductFormScreen = ({ route, navigation }: any) => {
  const existingProduct = route.params?.product;
  const isEditing = !!existingProduct;
  const queryClient = useQueryClient();

  const [imageUrl, setImageUrl] = useState<string>(
    existingProduct?.imageUrl || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400'
  );
  const [imagePublicId, setImagePublicId] = useState<string>(
    existingProduct?.imagePublicId || ''
  );
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch available suppliers for selection
  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => suppliersApi.getSuppliers(),
  });

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      name: existingProduct?.name || '',
      sku: existingProduct?.sku || '',
      barcode: existingProduct?.barcode || '',
      category: existingProduct?.category || 'General',
      description: existingProduct?.description || '',
      purchasePrice: existingProduct?.purchasePrice !== undefined ? existingProduct.purchasePrice : 0,
      sellingPrice: existingProduct?.sellingPrice !== undefined ? existingProduct.sellingPrice : 0,
      quantity: existingProduct?.quantity !== undefined ? existingProduct.quantity : 0,
      lowStockThreshold:
        existingProduct?.lowStockThreshold !== undefined ? existingProduct.lowStockThreshold : 5,
      supplierId: existingProduct?.supplierId?._id || '',
    },
  });

  const selectedSupplierId = watch('supplierId');

  const handlePickImage = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1024,
        maxHeight: 1024,
      });

      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.uri) {
          setIsUploadingImage(true);
          try {
            const uploadRes = await productsApi.uploadImage(
              asset.uri,
              asset.fileName || 'product.jpg',
              asset.type || 'image/jpeg'
            );
            setImageUrl(uploadRes.secure_url);
            setImagePublicId(uploadRes.public_id);
          } catch {
            // If upload fails, use local uri as preview fallback
            setImageUrl(asset.uri);
            Alert.alert('Upload notice', 'Image set locally (backend fallback).');
          } finally {
            setIsUploadingImage(false);
          }
        }
      }
    } catch (err: any) {
      Alert.alert('Image error', err.message || 'Failed to select image');
    }
  };

  const onSubmit = async (data: ProductFormData) => {
    try {
      setSubmitLoading(true);
      setErrorMessage('');

      const payload = {
        ...data,
        sku: data.sku.toUpperCase(),
        imageUrl,
        imagePublicId,
        supplierId: data.supplierId ? (data.supplierId as any) : undefined,
      };

      if (isEditing) {
        await productsApi.updateProduct(existingProduct._id, payload);
      } else {
        await productsApi.createProduct(payload);
      }

      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      navigation.goBack();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save product.');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.screenTitle}>
        {isEditing ? 'Edit Product' : 'Add New Product'}
      </Text>

      {errorMessage ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      {/* Image Picker Box */}
      <View style={styles.imageSection}>
        <View style={styles.imagePreviewWrapper}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.imagePreview} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderText}>📷</Text>
            </View>
          )}

          {isUploadingImage ? (
            <View style={styles.imageUploadingOverlay}>
              <ActivityIndicator color={colors.textInverse} size="small" />
              <Text style={styles.imageUploadingText}>Uploading...</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.imageActions}>
          <TouchableOpacity
            style={styles.pickImageBtn}
            onPress={handlePickImage}
            disabled={isUploadingImage}
          >
            <Text style={styles.pickImageText}>
              {imageUrl ? '📷 Change Image' : '📷 Upload Product Image'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.imageHint}>
            Cloudinary-backed storage (JPEG, PNG, WEBP)
          </Text>
        </View>
      </View>

      {/* Form Fields */}
      <View style={styles.card}>
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Product Name *"
              placeholder="e.g. Wireless Barcode Scanner"
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
              name="sku"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="SKU Code *"
                  placeholder="e.g. SCAN-W100"
                  autoCapitalize="characters"
                  onBlur={onBlur}
                  onChangeText={(val) => onChange(val.toUpperCase())}
                  value={value}
                  error={errors.sku?.message}
                />
              )}
            />
          </View>
          <View style={{ width: spacing.md }} />
          <View style={styles.col}>
            <Controller
              control={control}
              name="category"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Category *"
                  placeholder="e.g. Electronics"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.category?.message}
                />
              )}
            />
          </View>
        </View>

        <Controller
          control={control}
          name="barcode"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Barcode / EAN (Optional)"
              placeholder="e.g. 793573189214"
              keyboardType="number-pad"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={errors.barcode?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Description (Optional)"
              placeholder="Features, specifications, location rack..."
              multiline
              numberOfLines={3}
              style={{ minHeight: 64, textAlignVertical: 'top' }}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={errors.description?.message}
            />
          )}
        />
      </View>

      {/* Pricing & Stock Levels */}
      <View style={styles.card}>
        <Text style={styles.cardSectionTitle}>Pricing & Inventory Limits</Text>

        <View style={styles.row}>
          <View style={styles.col}>
            <Controller
              control={control}
              name="purchasePrice"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Purchase Cost *"
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value !== undefined ? String(value) : ''}
                  error={errors.purchasePrice?.message}
                />
              )}
            />
          </View>
          <View style={{ width: spacing.md }} />
          <View style={styles.col}>
            <Controller
              control={control}
              name="sellingPrice"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Selling Price *"
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value !== undefined ? String(value) : ''}
                  error={errors.sellingPrice?.message}
                />
              )}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.col}>
            <Controller
              control={control}
              name="quantity"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Available Quantity"
                  placeholder="0"
                  keyboardType="number-pad"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value !== undefined ? String(value) : ''}
                  error={errors.quantity?.message}
                />
              )}
            />
          </View>
          <View style={{ width: spacing.md }} />
          <View style={styles.col}>
            <Controller
              control={control}
              name="lowStockThreshold"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Low Stock Alert Threshold"
                  placeholder="5"
                  keyboardType="number-pad"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value !== undefined ? String(value) : ''}
                  error={errors.lowStockThreshold?.message}
                />
              )}
            />
          </View>
        </View>
      </View>

      {/* Supplier Selection */}
      <View style={styles.card}>
        <Text style={styles.cardSectionTitle}>Linked Supplier</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suppliersScroll}>
          <TouchableOpacity
            style={[
              styles.supplierChip,
              !selectedSupplierId && styles.supplierChipActive,
            ]}
            onPress={() => setValue('supplierId', '')}
          >
            <Text
              style={[
                styles.supplierChipText,
                !selectedSupplierId && styles.supplierChipTextActive,
              ]}
            >
              None
            </Text>
          </TouchableOpacity>

          {suppliers.map((sup) => (
            <TouchableOpacity
              key={sup._id}
              style={[
                styles.supplierChip,
                selectedSupplierId === sup._id && styles.supplierChipActive,
              ]}
              onPress={() => setValue('supplierId', sup._id)}
            >
              <Text
                style={[
                  styles.supplierChipText,
                  selectedSupplierId === sup._id && styles.supplierChipTextActive,
                ]}
              >
                {sup.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <Button
        title={isEditing ? 'Save Changes' : 'Create Product'}
        onPress={handleSubmit(onSubmit)}
        loading={submitLoading}
        style={styles.submitBtn}
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
  imageSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  imagePreviewWrapper: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: colors.surfaceSecondary,
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    fontSize: 32,
  },
  imageUploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageUploadingText: {
    color: colors.textInverse,
    fontSize: 10,
    marginTop: 2,
    fontWeight: '600',
  },
  imageActions: {
    flex: 1,
    marginLeft: spacing.lg,
  },
  pickImageBtn: {
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignSelf: 'flex-start',
  },
  pickImageText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  imageHint: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 6,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  cardSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
  },
  col: {
    flex: 1,
  },
  suppliersScroll: {
    flexDirection: 'row',
  },
  supplierChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceSecondary,
    marginRight: spacing.sm,
  },
  supplierChipActive: {
    backgroundColor: colors.primary,
  },
  supplierChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  supplierChipTextActive: {
    color: colors.textInverse,
  },
  submitBtn: {
    marginTop: spacing.sm,
    marginBottom: spacing.xxl,
  },
});
