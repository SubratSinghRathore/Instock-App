import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { storage } from '../../utils/storage';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';

export const SettingsScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { user, business, logout } = useAuth();

  const [lowStockAlertsEnabled, setLowStockAlertsEnabled] = useState(true);
  const [dailySummaryEnabled, setDailySummaryEnabled] = useState(false);
  const [apiUrl, setApiUrl] = useState('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [editingApiUrl, setEditingApiUrl] = useState(false);

  useEffect(() => {
    storage.getApiUrl().then(setApiUrl);
  }, []);

  const handleSaveApiUrl = async () => {
    await storage.setApiUrl(apiUrl.trim());
    setEditingApiUrl(false);
    Alert.alert('Configuration Saved', `API URL updated to:\n${apiUrl.trim()}`);
  };

  const handleLogout = async () => {
    setShowLogoutConfirm(false);
    await logout();
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: Math.max(insets.top + 16, 32),
          paddingBottom: Math.max(insets.bottom + 80, 100),
        },
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Workspace preferences & configuration</Text>
      </View>

      {/* User Profile Card */}
      <View style={styles.card}>
        <View style={styles.userRow}>
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </Text>
          </View>
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <Text style={styles.userName}>{user?.name || 'User'}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{user?.role?.toUpperCase() || 'OWNER'}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Business Workspace Card */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>Business Profile</Text>
          <TouchableOpacity onPress={() => navigation.navigate('BusinessProfile')}>
            <Text style={styles.editLink}>Edit Profile →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Business Name</Text>
          <Text style={styles.infoVal}>{business?.name || 'InStock'}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Currency</Text>
          <Text style={styles.infoVal}>{business?.currency || 'USD'}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Default Low-Stock Alert</Text>
          <Text style={styles.infoVal}>
            {business?.lowStockAlertThreshold || 5} units
          </Text>
        </View>
      </View>

      {/* Navigation Shortcut Cards */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Management Shortcuts</Text>

        <TouchableOpacity
          style={styles.navRow}
          onPress={() => navigation.navigate('SupplierList')}
        >
          <Text style={styles.navIcon}>🏢</Text>
          <Text style={styles.navTitle}>Suppliers & Vendors</Text>
          <Text style={styles.navArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navRow}
          onPress={() => navigation.navigate('SaleHistory')}
        >
          <Text style={styles.navIcon}>🧾</Text>
          <Text style={styles.navTitle}>Sales & Returns History</Text>
          <Text style={styles.navArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navRow}
          onPress={() => navigation.navigate('MovementsHistory', {})}
        >
          <Text style={styles.navIcon}>📋</Text>
          <Text style={styles.navTitle}>Full Inventory Audit Log</Text>
          <Text style={styles.navArrow}>→</Text>
        </TouchableOpacity>
      </View>

      {/* In-App Alerts Preferences */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Alert & Notification Preferences</Text>

        <View style={styles.switchRow}>
          <View style={{ flex: 1, paddingRight: spacing.md }}>
            <Text style={styles.switchTitle}>In-App Low Stock Banners</Text>
            <Text style={styles.switchSubtitle}>
              Highlight products when available quantity dips below thresholds
            </Text>
          </View>
          <Switch
            value={lowStockAlertsEnabled}
            onValueChange={setLowStockAlertsEnabled}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>

        <View style={[styles.switchRow, { marginTop: spacing.md }]}>
          <View style={{ flex: 1, paddingRight: spacing.md }}>
            <Text style={styles.switchTitle}>Daily Sales Summary Digest</Text>
            <Text style={styles.switchSubtitle}>
              Include revenue totals in dashboard banner
            </Text>
          </View>
          <Switch
            value={dailySummaryEnabled}
            onValueChange={setDailySummaryEnabled}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>
      </View>

      {/* Developer & Network Settings */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>API Server Endpoint</Text>
          <TouchableOpacity onPress={() => setEditingApiUrl(!editingApiUrl)}>
            <Text style={styles.editLink}>
              {editingApiUrl ? 'Cancel' : 'Change'}
            </Text>
          </TouchableOpacity>
        </View>

        {editingApiUrl ? (
          <View style={{ marginTop: spacing.sm }}>
            <Input
              value={apiUrl}
              onChangeText={setApiUrl}
              placeholder="https://instock-production-7101.up.railway.app/api/v1"
              autoCapitalize="none"
            />
            <Button
              title="Save URL"
              onPress={handleSaveApiUrl}
              variant="secondary"
              style={{ height: 38 }}
            />
          </View>
        ) : (
          <Text style={styles.apiUrlText}>{apiUrl || 'https://instock-production-7101.up.railway.app/api/v1'}</Text>
        )}
      </View>

      {/* Logout */}
      <Button
        title="Sign Out"
        variant="danger"
        onPress={() => setShowLogoutConfirm(true)}
        style={styles.logoutBtn}
      />

      <ConfirmDialog
        visible={showLogoutConfirm}
        title="Sign Out"
        message="Are you sure you want to sign out of InStock?"
        confirmTitle="Sign Out"
        isDestructive
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
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
  header: {
    marginBottom: spacing.lg,
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textInverse,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  userEmail: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 1,
  },
  roleBadge: {
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  editLink: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceSecondary,
  },
  infoLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  infoVal: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceSecondary,
  },
  navIcon: {
    fontSize: 20,
    marginRight: spacing.md,
  },
  navTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  navArrow: {
    fontSize: 16,
    color: colors.textMuted,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  switchSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  apiUrlText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: 'monospace',
  },
  logoutBtn: {
    marginTop: spacing.md,
    marginBottom: spacing.xxl,
  },
});
