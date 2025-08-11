export const formatCurrency = (value: number, decimals = 2): string => {
  // For very small values like SHIB, show more decimals
  const displayDecimals = value < 0.01 ? 6 : decimals;
  
  // Remove trailing zeros after decimal point
  const formatted = value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: displayDecimals
  });

  return formatted;
};

export const formatPercentage = (value: number): string => {
  // Remove trailing zeros after decimal point
  const formatted = value.toFixed(2).replace(/\.?0+$/, '');
  return (value >= 0 ? '+' : '') + formatted + '%';
};

export const formatNumber = (value: number, decimals = 2): string => {
  // Remove trailing zeros after decimal point
  return value.toFixed(decimals).replace(/\.?0+$/, '');
};

export const formatCompactNumber = (value: number): string => {
  const formatter = Intl.NumberFormat('en', { notation: 'compact' });
  return formatter.format(value);
};