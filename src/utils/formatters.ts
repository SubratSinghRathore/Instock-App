export const formatCurrency = (amount: number, currency = 'USD'): string => {
  const safeAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  const symbols: { [key: string]: string } = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    INR: '₹',
    CAD: 'CA$',
    AUD: 'AU$',
  };
  const sym = symbols[currency.toUpperCase()] || `${currency} `;
  return `${sym}${safeAmount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const formatDate = (dateInput: string | Date): string => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const formatDateTime = (dateInput: string | Date): string => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '';
  return `${date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })} ${date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
};

export const formatNumber = (num: number): string => {
  const safeNum = typeof num === 'number' && !isNaN(num) ? num : 0;
  return safeNum.toLocaleString('en-US');
};
