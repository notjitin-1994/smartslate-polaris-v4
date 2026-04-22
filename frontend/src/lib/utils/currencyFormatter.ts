/**
 * Currency formatter utility
 * Formats currency values with proper symbols and locale-specific formatting
 */

/**
 * Map of currency codes to their symbols
 */
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CNY: '¥',
  INR: '₹',
  AUD: 'A$',
  CAD: 'C$',
  CHF: 'Fr',
  SEK: 'kr',
  NZD: 'NZ$',
  MXN: 'Mex$',
  SGD: 'S$',
  HKD: 'HK$',
  NOK: 'kr',
  KRW: '₩',
  TRY: '₺',
  RUB: '₽',
  BRL: 'R$',
  ZAR: 'R',
  AED: 'د.إ',
  SAR: '﷼',
  QAR: 'ر.ق',
  KWD: 'د.ك',
  BHD: 'د.ب',
  OMR: 'ر.ع',
  THB: '฿',
  MYR: 'RM',
  IDR: 'Rp',
  PHP: '₱',
  VND: '₫',
  PKR: '₨',
  BDT: '৳',
  LKR: '₨',
  NPR: '₨',
  AFN: '؋',
  IQD: 'ع.د',
  JOD: 'د.ا',
  LBP: 'ل.ل',
  EGP: '£',
  MAD: 'د.م.',
  DZD: 'د.ج',
  TND: 'د.ت',
  LYD: 'ل.د',
  NGN: '₦',
  GHS: '₵',
  KES: 'KSh',
  UGX: 'USh',
  TZS: 'TSh',
  ETB: 'Br',
  XOF: 'CFA',
  XAF: 'FCFA',
};

/**
 * Map of currency codes to their locale codes for proper number formatting
 */
const CURRENCY_LOCALES: Record<string, string> = {
  USD: 'en-US',
  EUR: 'de-DE',
  GBP: 'en-GB',
  JPY: 'ja-JP',
  CNY: 'zh-CN',
  INR: 'en-IN',
  AUD: 'en-AU',
  CAD: 'en-CA',
  CHF: 'de-CH',
  SEK: 'sv-SE',
  NZD: 'en-NZ',
  MXN: 'es-MX',
  SGD: 'en-SG',
  HKD: 'zh-HK',
  NOK: 'nb-NO',
  KRW: 'ko-KR',
  TRY: 'tr-TR',
  RUB: 'ru-RU',
  BRL: 'pt-BR',
  ZAR: 'en-ZA',
  AED: 'ar-AE',
  SAR: 'ar-SA',
  QAR: 'ar-QA',
  KWD: 'ar-KW',
  BHD: 'ar-BH',
  OMR: 'ar-OM',
  THB: 'th-TH',
  MYR: 'ms-MY',
  IDR: 'id-ID',
  PHP: 'en-PH',
  VND: 'vi-VN',
  PKR: 'en-PK',
  BDT: 'bn-BD',
  LKR: 'en-LK',
  NPR: 'ne-NP',
  AFN: 'fa-AF',
  IQD: 'ar-IQ',
  JOD: 'ar-JO',
  LBP: 'ar-LB',
  EGP: 'ar-EG',
  MAD: 'ar-MA',
  DZD: 'ar-DZ',
  TND: 'ar-TN',
  LYD: 'ar-LY',
  NGN: 'en-NG',
  GHS: 'en-GH',
  KES: 'en-KE',
  UGX: 'en-UG',
  TZS: 'en-TZ',
  ETB: 'am-ET',
  XOF: 'fr-SN',
  XAF: 'fr-CM',
};

/**
 * Get the currency symbol for a given currency code
 * Falls back to the currency code if symbol not found
 */
export function getCurrencySymbol(currencyCode: string): string {
  const normalizedCode = currencyCode.toUpperCase();
  return CURRENCY_SYMBOLS[normalizedCode] || currencyCode;
}

/**
 * Get the locale for a given currency code
 * Falls back to en-US if locale not found
 */
export function getCurrencyLocale(currencyCode: string): string {
  const normalizedCode = currencyCode.toUpperCase();
  return CURRENCY_LOCALES[normalizedCode] || 'en-US';
}

/**
 * Format a currency amount with the proper symbol and locale-specific formatting
 *
 * @param amount - The numeric amount to format
 * @param currencyCode - The ISO 4217 currency code (e.g., "USD", "INR", "EUR")
 * @param options - Optional formatting options
 * @returns Formatted currency string (e.g., "₹10,00,000" for INR, "$1,000,000" for USD)
 */
export function formatCurrency(
  amount: number,
  currencyCode: string = 'USD',
  options: {
    useSymbol?: boolean;
    useCode?: boolean;
    compact?: boolean;
  } = {}
): string {
  const { useSymbol = true, useCode = false, compact = false } = options;

  const normalizedCode = currencyCode.toUpperCase();
  const locale = getCurrencyLocale(normalizedCode);
  const symbol = getCurrencySymbol(normalizedCode);

  try {
    // For compact formatting (e.g., $1.2M, ₹10L)
    if (compact) {
      return formatCompactCurrency(amount, normalizedCode, symbol, useSymbol);
    }

    // Use Intl.NumberFormat for proper locale-specific formatting
    const formatter = new Intl.NumberFormat(locale, {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

    const formattedNumber = formatter.format(amount);

    // Build the final formatted string
    if (useCode) {
      return `${normalizedCode} ${formattedNumber}`;
    } else if (useSymbol) {
      return `${symbol}${formattedNumber}`;
    } else {
      return formattedNumber;
    }
  } catch (error) {
    // Fallback to basic formatting if anything fails
    console.error('Currency formatting error:', error);
    const basicFormatted = amount.toLocaleString('en-US');
    return useSymbol ? `${symbol}${basicFormatted}` : basicFormatted;
  }
}

/**
 * Format currency in compact notation (e.g., $1.2M, ₹10L)
 */
function formatCompactCurrency(
  amount: number,
  currencyCode: string,
  symbol: string,
  useSymbol: boolean
): string {
  const abs = Math.abs(amount);

  // Indian numbering system (Lakhs and Crores)
  if (currencyCode === 'INR') {
    if (abs >= 10000000) {
      return `${useSymbol ? symbol : ''}${(amount / 10000000).toFixed(1)}Cr`;
    } else if (abs >= 100000) {
      return `${useSymbol ? symbol : ''}${(amount / 100000).toFixed(1)}L`;
    } else if (abs >= 1000) {
      return `${useSymbol ? symbol : ''}${(amount / 1000).toFixed(1)}K`;
    }
  }

  // International numbering system (K, M, B)
  if (abs >= 1000000000) {
    return `${useSymbol ? symbol : ''}${(amount / 1000000000).toFixed(1)}B`;
  } else if (abs >= 1000000) {
    return `${useSymbol ? symbol : ''}${(amount / 1000000).toFixed(1)}M`;
  } else if (abs >= 1000) {
    return `${useSymbol ? symbol : ''}${(amount / 1000).toFixed(1)}K`;
  }

  return `${useSymbol ? symbol : ''}${amount.toLocaleString()}`;
}

/**
 * Parse a currency string and extract the numeric value and currency code
 * Useful for reverse operations
 */
export function parseCurrency(currencyString: string): {
  amount: number;
  currencyCode: string | null;
} {
  // Remove all non-numeric characters except dots and commas
  const cleanedString = currencyString.replace(/[^\d.,]/g, '');

  // Convert to number (assuming dot as decimal separator)
  const amount = parseFloat(cleanedString.replace(/,/g, ''));

  // Try to extract currency code or symbol
  const currencyMatch = currencyString.match(/[A-Z]{3}|[₹$€£¥]/);
  const currencyCode = currencyMatch ? currencyMatch[0] : null;

  return {
    amount: isNaN(amount) ? 0 : amount,
    currencyCode,
  };
}
