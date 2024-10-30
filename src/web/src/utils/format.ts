// Third-party imports with versions
import { formatDate } from './date';
import 'intl'; // v1.2.0

/**
 * Capitalizes the first letter of a given string.
 * Used for consistent text display in dashboard components and action buttons.
 * 
 * @param inputString - String to capitalize
 * @returns String with first letter capitalized
 */
export const capitalizeFirstLetter = (inputString: string): string => {
  // Handle empty or null input
  if (!inputString) {
    return '';
  }

  // Convert first character to uppercase and concatenate with rest
  return inputString.charAt(0).toUpperCase() + inputString.slice(1);
};

/**
 * Formats a number into a locale-aware currency string.
 * Used for displaying monetary values in the dashboard.
 * 
 * @param amount - Numeric amount to format
 * @param currencyCode - ISO 4217 currency code (e.g., 'USD')
 * @param locale - BCP 47 language tag (e.g., 'en-US')
 * @returns Formatted currency string
 */
export const formatCurrency = (
  amount: number,
  currencyCode: string = 'USD',
  locale: string = 'en-US'
): string => {
  // Validate amount is a number
  if (typeof amount !== 'number' || isNaN(amount)) {
    throw new Error('Invalid amount provided for currency formatting');
  }

  try {
    // Create formatter with provided locale and currency
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    return formatter.format(amount);
  } catch (error) {
    throw new Error(
      `Error formatting currency: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

/**
 * Truncates a string to specified length with ellipsis.
 * Used for displaying long text in table cells and cards.
 * 
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated string with ellipsis if needed
 */
export const truncateString = (text: string, maxLength: number): string => {
  // Handle invalid inputs
  if (!text || maxLength <= 0) {
    return '';
  }

  // Return original string if within length
  if (text.length <= maxLength) {
    return text;
  }

  // Truncate and append ellipsis
  return `${text.slice(0, maxLength - 3)}...`;
};

/**
 * Sanitizes a string by removing HTML tags and special characters.
 * Used for preventing XSS in user-generated content display.
 * 
 * @param input - String to sanitize
 * @returns Sanitized string safe for display
 */
export const sanitizeString = (input: string): string => {
  // Handle empty input
  if (!input) {
    return '';
  }

  try {
    // Remove HTML tags
    let sanitized = input.replace(/<[^>]*>/g, '');

    // Remove special characters except allowed ones
    sanitized = sanitized.replace(
      /[^\w\s.,!?@#$%&*()[\]{}:;-]/g,
      ''
    );

    // Trim whitespace and return
    return sanitized.trim();
  } catch (error) {
    throw new Error(
      `Error sanitizing string: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

/**
 * Formats a decimal number as a percentage string.
 * Used for displaying progress bars and statistical data.
 * 
 * @param value - Decimal value to format (e.g., 0.75 for 75%)
 * @param decimals - Number of decimal places to show
 * @returns Formatted percentage string
 */
export const formatPercentage = (value: number, decimals: number = 0): string => {
  // Validate input
  if (typeof value !== 'number' || isNaN(value)) {
    throw new Error('Invalid number provided for percentage formatting');
  }

  try {
    // Convert to percentage and round
    const percentage = value * 100;
    const rounded = Number(percentage.toFixed(decimals));

    // Format with proper decimal places
    return `${rounded}%`;
  } catch (error) {
    throw new Error(
      `Error formatting percentage: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

// Export all functions as named exports
export {
  capitalizeFirstLetter,
  formatCurrency,
  truncateString,
  sanitizeString,
  formatPercentage
};