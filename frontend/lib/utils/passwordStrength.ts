import zxcvbn, { ZXCVBNResult } from 'zxcvbn';

export interface PasswordStrength {
  score: number; // 0-4
  label: string;
  color: string;
  bgColor: string;
  feedback: string[];
  crackTime: string;
}

/**
 * Calculates password strength using zxcvbn library
 * @param password - The password to evaluate
 * @param userInputs - Optional array of user-specific strings to check against (email, name, etc.)
 * @returns PasswordStrength object with score, label, colors, and feedback
 */
export function calculatePasswordStrength(
  password: string,
  userInputs: string[] = []
): PasswordStrength {
  if (!password) {
    return {
      score: 0,
      label: 'Too weak',
      color: 'text-red-600',
      bgColor: 'bg-red-500',
      feedback: ['Password is required'],
      crackTime: 'Instant',
    };
  }

  const result: ZXCVBNResult = zxcvbn(password, userInputs);

  // Map zxcvbn score (0-4) to our strength labels
  const strengthMap: Record<number, { label: string; color: string; bgColor: string }> = {
    0: { label: 'Too weak', color: 'text-red-600', bgColor: 'bg-red-500' },
    1: { label: 'Weak', color: 'text-orange-600', bgColor: 'bg-orange-500' },
    2: { label: 'Fair', color: 'text-yellow-600', bgColor: 'bg-yellow-500' },
    3: { label: 'Good', color: 'text-lime-600', bgColor: 'bg-lime-500' },
    4: { label: 'Strong', color: 'text-green-600', bgColor: 'bg-green-500' },
  };

  const strength = strengthMap[result.score];

  // Build feedback array
  const feedback: string[] = [];

  if (result.feedback.warning) {
    feedback.push(result.feedback.warning);
  }

  if (result.feedback.suggestions && result.feedback.suggestions.length > 0) {
    feedback.push(...result.feedback.suggestions);
  }

  // Format crack time estimate
  const crackTime = result.crack_times_display.offline_slow_hashing_1e4_per_second;

  return {
    score: result.score,
    label: strength.label,
    color: strength.color,
    bgColor: strength.bgColor,
    feedback,
    crackTime,
  };
}

/**
 * Checks if password meets minimum strength requirements
 * @param password - The password to check
 * @param minScore - Minimum acceptable score (0-4), default is 2 (Fair)
 * @returns true if password meets minimum strength
 */
export function meetsMinimumStrength(password: string, minScore: number = 2): boolean {
  const strength = calculatePasswordStrength(password);
  return strength.score >= minScore;
}
