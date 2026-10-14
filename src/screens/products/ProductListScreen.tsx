import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { productsApi, ProductItem } from '../../api/products.api';
import { useAuth } from '../../context/AuthContext';
import { ProductCard } from '../../components/products/ProductCard';
import { LoadingIndicator } from '../../components/common/LoadingIndicator';
import { EmptyState } from '../../components/common/EmptyState';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';

export const ProductListScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { business } = useAuth();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [lowStockFilter, setLowStockFilter] = useState<boolean>(false);

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => productsApi.getCategories(),
  });

  // Fetch products
  const {
    data: productData,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['products', search, selectedCategory, lowStockFilter],
    queryFn: () =>
      productsApi.getProducts({
        search: search.trim() || undefined,
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        lowStock: lowStockFilter ? true : undefined,
        isArchived: false,
        limit: 100,
      }),
  });

  const products = productData?.products || [];

  const onRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['products'] });
    queryClient.invalidateQueries({ queryKey: ['categories'] });
    refetch();
  };

  const handleStockIn = (product: ProductItem) => {
    navigation.navigate('StockOperation', {
      productId: product._id,
      productName: product.name,
      currentQuantity: product.quantity,
      initialType: 'IN',
    });
  };

  const handleStockOut = (product: ProductItem) => {
    navigation.navigate('StockOperation', {
      productId: product._id,
      productName: product.name,
      currentQuantity: product.quantity,
      initialType: 'OUT',
    });
  };

  return (
    <View style={styles.container}>
      {/* Header bar */}
      <View
        style={[
          styles.header,
          {
            paddingTop: Math.max(insets.top + 16, 32),
          },
        ]}
      >
        <View>
          <Text style={styles.headerTitle}>Products & Stock</Text>
          <Text style={styles.headerSubtitle}>
            {productData?.pagination.total || 0} active inventory items
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('ProductForm', {})}
          activeOpacity={0.8}
        >
          <Text style={styles.addBtnText}>+ Add Product</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search product name, SKU, or barcode..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
          clearButtonMode="while-editing"
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={styles.clearSearch}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filter Chips Bar */}
      <View style={styles.chipsRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsContent}>
          {/* Low stock toggle */}
          <TouchableOpacity
            style={[
              styles.filterChip,
              lowStockFilter && styles.filterChipActiveWarning,
            ]}
            onPress={() => setLowStockFilter(!lowStockFilter)}
          >
            <Text
              style={[
                styles.chipText,
                lowStockFilter && styles.chipTextActiveWarning,
              ]}
            >
              ⚠️ Low Stock Only
            </Text>
          </TouchableOpacity>

          {/* All category */}
          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedCategory === 'All' && !lowStockFilter && styles.filterChipActive,
            ]}
            onPress={() => {
              setSelectedCategory('All');
            }}
          >
            <Text
              style={[
                styles.chipText,
                selectedCategory === 'All' && !lowStockFilter && styles.chipTextActive,
              ]}
            >
              All Categories
            </Text>
          </TouchableOpacity>

          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.filterChip,
                selectedCategory === cat && styles.filterChipActive,
              ]}
              onPress={() => {
                setSelectedCategory(cat);
              }}
            >
              <Text
                style={[
                  styles.chipText,
                  selectedCategory === cat && styles.chipTextActive,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Product List */}
      {isLoading && !isRefetching ? (
        <LoadingIndicator message="Fetching inventory..." />
      ) : products.length === 0 ? (
        <EmptyState
          title="No products found"
          subtitle={
            search || selectedCategory !== 'All' || lowStockFilter
              ? 'Try adjusting your filters or search terms'
              : 'Add your first product to start tracking stock'
          }
          actionTitle="+ Add Product"
          onAction={() => navigation.navigate('ProductForm', {})}
        />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} colors={[colors.primary]} />
          }
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              currency={business?.currency}
              onPress={() => navigation.navigate('ProductDetail', { productId: item._id })}
              onStockIn={() => handleStockIn(item)}
              onStockOut={() => handleStockOut(item)}
            />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  addBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  addBtnText: {
    color: colors.textInverse,
    fontWeight: '700',
    fontSize: 13,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    height: 44,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  clearSearch: {
    fontSize: 14,
    color: colors.textMuted,
    padding: spacing.xs,
  },
  chipsRow: {
    marginVertical: spacing.md,
  },
  chipsContent: {
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
  filterChipActiveWarning: {
    backgroundColor: colors.warning,
    borderColor: colors.warning,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.textInverse,
  },
  chipTextActiveWarning: {
    color: colors.textInverse,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 110,
  },
});
