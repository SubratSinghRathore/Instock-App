import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'neutral',
  style,
  textStyle,
}) => {
  const getBadgeStyle = () => {
    switch (variant) {
      case 'success':
        return { bg: colors.successLight, text: colors.successText };
      case 'warning':
        return { bg: colors.warningLight, text: colors.warningText };
      case 'danger':
        return { bg: colors.dangerLight, text: colors.dangerText };
      case 'info':
        return { bg: colors.primaryLight, text: colors.primary };
      case 'neutral':
      default:
        return { bg: colors.surfaceSecondary, text: colors.textSecondary };
    }
  };

  const currentTheme = getBadgeStyle();

  return (
    <View style={[styles.badge, { backgroundColor: currentTheme.bg }, style]}>
      <Text style={[styles.badgeText, { color: currentTheme.text }, textStyle]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
});
