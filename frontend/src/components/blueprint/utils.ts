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

/**
 * Parse duration string into total learning hours
 * Supports: weeks, days, hours, minutes (and abbreviations)
 * Handles decimals, ranges, and various formats
 */
export function parseDurationToHours(duration: string): number {
  if (!duration || typeof duration !== 'string') return 0;

  // Support ranges by taking the second number if available, otherwise the first
  // e.g. "10-15 minutes" -> "15 minutes"
  // e.g. "1-2 hours" -> "2 hours"
  const cleanDuration = duration.replace(/(\d+(?:\.\d+)?)\s*[-–—]\s*(\d+(?:\.\d+)?)/, '$2');

  // Regex to match value and unit
  // We use (\d+(?:\.\d+)?) to support decimals
  const weeksMatch = cleanDuration.match(/(\d+(?:\.\d+)?)\s*(?:week|weeks|wk|w)\b/i);
  const daysMatch = cleanDuration.match(/(\d+(?:\.\d+)?)\s*(?:day|days|d)\b/i);
  const hoursMatch = cleanDuration.match(/(\d+(?:\.\d+)?)\s*(?:hour|hours|hr|h)\b/i);
  const minutesMatch = cleanDuration.match(/(\d+(?:\.\d+)?)\s*(?:minute|minutes|min|m)\b/i);

  let totalHours = 0;

  // Use the same conversion logic as original code:
  // 1 week = 10 study hours, 1 day = 2 study hours
  if (weeksMatch) totalHours += parseFloat(weeksMatch[1]) * 10;
  if (daysMatch) totalHours += parseFloat(daysMatch[1]) * 2;
  if (hoursMatch) totalHours += parseFloat(hoursMatch[1]);
  if (minutesMatch) totalHours += parseFloat(minutesMatch[1]) / 60;

  // Fallback: if no units matched but there is a number
  if (totalHours === 0) {
    const fallbackMatch = cleanDuration.match(/(\d+(?:\.\d+)?)/);
    if (fallbackMatch) {
      const val = parseFloat(fallbackMatch[1]);
      // If no unit is specified, we have to guess.
      // In this context, numbers under 10 are usually hours,
      // and numbers over 10 without units are often minutes (e.g. "45").
      // However, to keep it simple and consistent with "Total Duration (hrs)",
      // we'll assume hours unless it's clearly a high number that's likely minutes.
      if (val >= 15 && !cleanDuration.toLowerCase().includes('h')) {
        totalHours = val / 60; // Assume minutes
      } else {
        totalHours = val; // Assume hours
      }
    }
  }

  return totalHours;
}
