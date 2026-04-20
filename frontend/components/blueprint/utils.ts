/**
 * Blueprint Utility Functions
 */

/**
 * Format section key to human-readable title
 * Example: 'learning_objectives' → 'Learning Objectives'
 */
export function formatSectionTitle(sectionKey: string): string {
  return sectionKey
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Calculate percentage between baseline and target
 */
export function calculateProgress(baseline: string | number, target: string | number): number {
  const baselineNum = typeof baseline === 'number' ? baseline : parseFloat(String(baseline));
  const targetNum = typeof target === 'number' ? target : parseFloat(String(target));

  if (isNaN(baselineNum) || isNaN(targetNum) || targetNum === 0) {
    return 0;
  }

  return Math.min(100, Math.max(0, (baselineNum / targetNum) * 100));
}

/**
 * Get color class based on priority/impact level
 */
export function getPriorityColor(level: string): string {
  const lowerLevel = level.toLowerCase();

  if (lowerLevel.includes('high') || lowerLevel.includes('critical')) {
    return 'text-error border-error/30 bg-error/5';
  }

  if (lowerLevel.includes('medium') || lowerLevel.includes('moderate')) {
    return 'text-warning border-warning/30 bg-warning/5';
  }

  return 'text-success border-success/30 bg-success/5';
}

/**
 * Format date string to readable format
 */
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

/**
 * Format number with locale-specific formatting
 */
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * Format currency
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
