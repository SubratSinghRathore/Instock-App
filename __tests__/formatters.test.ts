import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
} from '../src/utils/formatters';

describe('Formatters Utils', () => {
  describe('formatCurrency', () => {
    it('formats USD by default', () => {
      expect(formatCurrency(1250.5)).toBe('$1,250.50');
    });

    it('formats other supported currencies', () => {
      expect(formatCurrency(500, 'EUR')).toBe('€500.00');
      expect(formatCurrency(99.99, 'GBP')).toBe('£99.99');
      expect(formatCurrency(1000, 'INR')).toBe('₹1,000.00');
    });

    it('handles zero and invalid values gracefully', () => {
      expect(formatCurrency(0)).toBe('$0.00');
      expect(formatCurrency(NaN)).toBe('$0.00');
    });
  });

  describe('formatNumber', () => {
    it('formats large integers with comma separators', () => {
      expect(formatNumber(1500000)).toBe('1,500,000');
    });
  });

  describe('formatDate and formatDateTime', () => {
    it('formats valid ISO dates', () => {
      const dateStr = '2026-10-14T10:00:00.000Z';
      expect(formatDate(dateStr)).toContain('2026');
      expect(formatDateTime(dateStr)).toBeDefined();
    });

    it('handles empty dates gracefully', () => {
      expect(formatDate('')).toBe('');
      expect(formatDateTime('')).toBe('');
    });
  });
});
