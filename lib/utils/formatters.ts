/**
 * Utility functions for formatting values
 */

// Format currency values 
export const formatCurrency = (
  value: number,
  currency: string = 'USD',
  options: Intl.NumberFormatOptions = {}
): string => {
  // Format options based on currency
  const formatOptions: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: currency === 'COP' ? 'COP' : 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    ...options
  };

  // For small values, show more decimals
  if (Math.abs(value) < 1000) {
    formatOptions.minimumFractionDigits = 2;
    formatOptions.maximumFractionDigits = 2;
  }

  // For very small values (like crypto prices), show even more decimals
  if (Math.abs(value) < 1) {
    formatOptions.minimumFractionDigits = 4;
    formatOptions.maximumFractionDigits = 6;
  }

  const formatter = new Intl.NumberFormat('es-CO', formatOptions);
  return formatter.format(value);
};

// Format percentage values
export const formatPercent = (
  value: number,
  decimals: number = 2
): string => {
  return `${value.toFixed(decimals)}%`;
};

// Format date values
export const formatDate = (
  date: Date | number | string,
  includeTime: boolean = false
): string => {
  const dateObj = typeof date === 'object' ? date : new Date(date);
  
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {})
  };
  
  return new Intl.DateTimeFormat('es-CO', options).format(dateObj);
};

// Format large numbers (e.g., 1K, 1M)
export const formatCompactNumber = (
  value: number
): string => {
  const formatter = new Intl.NumberFormat('es-CO', {
    notation: 'compact',
    compactDisplay: 'short'
  });
  
  return formatter.format(value);
}; 