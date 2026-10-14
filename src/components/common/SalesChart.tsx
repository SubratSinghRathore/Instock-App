import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { ChartDataItem } from '../../api/reports.api';
import { formatCurrency } from '../../utils/formatters';

interface SalesChartProps {
  data: ChartDataItem[];
  currency?: string;
}

export const SalesChart: React.FC<SalesChartProps> = ({ data, currency = 'USD' }) => {
  const maxAmount = Math.max(...data.map((d) => d.amount), 10);
  const totalSales = data.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.chartTitle}>7-Day Sales Trend</Text>
          <Text style={styles.chartSubtitle}>
            Total: {formatCurrency(totalSales, currency)}
          </Text>
        </View>
        <View style={styles.legendContainer}>
          <View style={styles.legendDot} />
          <Text style={styles.legendText}>Revenue</Text>
        </View>
      </View>

      <View style={styles.chartArea}>
        {data.map((item, index) => {
          const heightPercent = Math.max((item.amount / maxAmount) * 100, item.amount > 0 ? 12 : 4);
          const isHighest = item.amount === maxAmount && item.amount > 0;

          return (
            <View key={item.date || index} style={styles.barColumn}>
              {item.amount > 0 ? (
                <Text style={styles.barValueText} numberOfLines={1}>
                  ${Math.round(item.amount)}
                </Text>
              ) : (
                <View style={{ height: 14 }} />
              )}
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    { height: `${heightPercent}%` },
                    isHighest && styles.barFillHighest,
                  ]}
                />
              </View>
              <Text style={styles.dayLabel}>{item.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  chartSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent,
    marginTop: 2,
  },
  legendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  chartArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 140,
    paddingTop: spacing.xs,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barTrack: {
    width: 18,
    height: 95,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    marginBottom: 6,
  },
  barFill: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
  },
  barFillHighest: {
    backgroundColor: colors.accent,
  },
  barValueText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  dayLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
});
