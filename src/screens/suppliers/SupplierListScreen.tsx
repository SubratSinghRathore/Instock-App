import React from 'react';
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
import { suppliersApi } from '../../api/suppliers.api';
import { LoadingIndicator } from '../../components/common/LoadingIndicator';
import { EmptyState } from '../../components/common/EmptyState';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';

export const SupplierListScreen = ({ navigation }: any) => {
  const queryClient = useQueryClient();

  const {
    data: suppliers = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => suppliersApi.getSuppliers(),
  });

  const onRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    refetch();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Suppliers</Text>
          <Text style={styles.subtitle}>{suppliers.length} active vendors</Text>
        </View>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('SupplierForm', {})}
        >
          <Text style={styles.addBtnText}>+ Add Supplier</Text>
        </TouchableOpacity>
      </View>

      {isLoading && !isRefetching ? (
        <LoadingIndicator message="Loading suppliers..." />
      ) : suppliers.length === 0 ? (
        <EmptyState
          title="No suppliers listed"
          subtitle="Add suppliers to associate with your product inventory and manage orders."
          actionTitle="+ Add Supplier"
          onAction={() => navigation.navigate('SupplierForm', {})}
        />
      ) : (
        <FlatList
          data={suppliers}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} colors={[colors.primary]} />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('SupplierForm', { supplier: item })}
            >
              <View style={styles.cardTop}>
                {item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} style={styles.supplierImg} />
                ) : (
                  <View style={styles.supplierAvatar}>
                    <Text style={styles.supplierAvatarText}>
                      {item.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}

                <View style={styles.infoCol}>
                  <Text style={styles.supplierName}>{item.name}</Text>
                  {item.phone ? <Text style={styles.contactText}>📞 {item.phone}</Text> : null}
                  {item.email ? <Text style={styles.contactText}>✉️ {item.email}</Text> : null}
                  {item.address ? (
                    <Text style={styles.addressText} numberOfLines={1}>
                      📍 {item.address}
                    </Text>
                  ) : null}
                </View>
              </View>

              <View style={styles.cardBottom}>
                <Text style={styles.productCountBadge}>
                  {item.productCount || 0} linked products
                </Text>
                <Text style={styles.editAction}>Edit / Details →</Text>
              </View>
            </TouchableOpacity>
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
    paddingBottom: spacing.md,
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
  listContent: {
    padding: spacing.lg,
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
    alignItems: 'center',
  },
  supplierImg: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.md,
  },
  supplierAvatar: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supplierAvatarText: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primary,
  },
  infoCol: {
    flex: 1,
    marginLeft: spacing.md,
  },
  supplierName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  contactText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  addressText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceSecondary,
  },
  productCountBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  editAction: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
