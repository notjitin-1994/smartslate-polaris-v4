/**
 * Data Integrity Validation
 * Ensures data is complete and valid before submitting to LLM
 */

import { createServiceLogger } from '@/lib/logging';

const logger = createServiceLogger('data-integrity');

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedData?: any;
}

/**
 * Validate static questionnaire answers before dynamic question generation
 * Uses V2 format (role/organization/learningGap) as the standard
 */
export function validateStaticAnswers(staticAnswers: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!staticAnswers || typeof staticAnswers !== 'object') {
    return {
      isValid: false,
      errors: ['Static answers is not a valid object'],
      warnings,
    };
  }

  // V2 Format Validation (role, organization, learningGap, etc.)
  // These are the actual field names used in the questionnaire

  // Validate Role - This is a recommended field but not required
  if (!staticAnswers.role?.trim()) {
    warnings.push('Role information is recommended for better results');
  }

  // Validate Organization - These are recommended fields
  if (staticAnswers.organization) {
    const org = staticAnswers.organization;
    if (!org.name?.trim()) {
      warnings.push('Organization name is recommended for better context');
    }
    if (!org.industry?.trim()) {
      warnings.push('Organization industry is recommended for better context');
    }
    // Size and regions are optional
  } else {
    warnings.push('Organization information is recommended for better results');
  }

  // Validate Learner Profile - Optional but helpful
  if (staticAnswers.learnerProfile) {
    const profile = staticAnswers.learnerProfile;
    // All fields are optional but provide helpful context
    if (!profile.audienceSize) {
      warnings.push('Audience size information would help tailor the blueprint');
    }
  }

  // Validate Learning Gap - This is the most important section
  if (staticAnswers.learningGap) {
    const gap = staticAnswers.learningGap;

    // Description is highly recommended but not strictly required
    if (!gap.description?.trim()) {
      warnings.push(
        'Learning gap description is highly recommended for accurate blueprint generation'
      );
    }

    // Urgency is a numeric value (1-5) in V2
    if (gap.urgency === undefined || gap.urgency === null) {
      warnings.push('Learning gap urgency level is recommended');
    }

    // Check for minimum description length
    if (
      gap.description &&
      gap.description.trim().length > 0 &&
      gap.description.trim().length < 20
    ) {
      warnings.push('Learning gap description seems too short. Consider providing more detail.');
    }

    // Objectives field is also important
    if (!gap.objectives?.trim()) {
      warnings.push('Learning objectives would help create a more targeted blueprint');
    }
  } else {
    warnings.push('Learning gap information is highly recommended for accurate results');
  }

  // Validate Resources - Optional but helpful
  if (staticAnswers.resources) {
    const res = staticAnswers.resources;
    if (!res.budget || res.budget.amount === 0) {
      warnings.push('Budget information would help tailor recommendations');
    }
    if (!res.timeline?.targetDate && !res.timeline?.duration) {
      warnings.push('Timeline information would help with planning');
    }
  }

  // Validate Delivery Strategy - Optional
  if (!staticAnswers.deliveryStrategy) {
    warnings.push('Delivery strategy preferences would help customize the blueprint');
  }

  // Validate Constraints - Optional
  if (!staticAnswers.constraints || staticAnswers.constraints.length === 0) {
    warnings.push('Knowing any constraints would help create a more realistic blueprint');
  }

  // Validate Evaluation - Optional
  if (!staticAnswers.evaluation) {
    warnings.push('Evaluation strategy preferences would enhance the assessment plan');
  }

  // Check for potential data truncation
  const jsonString = JSON.stringify(staticAnswers);
  if (jsonString.length > 50000) {
    warnings.push(
      `Static answers data is very large (${jsonString.length} chars). Consider simplifying.`
    );
  }

  // Check if we have at least some meaningful data
  const hasMinimalData =
    staticAnswers.role ||
    staticAnswers.organization ||
    staticAnswers.learningGap ||
    staticAnswers.learnerProfile ||
    staticAnswers.resources ||
    staticAnswers.deliveryStrategy ||
    staticAnswers.evaluation ||
    Object.keys(staticAnswers).length > 0;

  if (!hasMinimalData) {
    errors.push('Static answers must contain at least some data');
  }

  logger.info('data-integrity.static-validation', 'Static answers validation complete', {
    isValid: errors.length === 0,
    errorCount: errors.length,
    warningCount: warnings.length,
    dataSize: jsonString.length,
    format: 'V2',
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    sanitizedData: staticAnswers,
  };
}

/**
 * Validate dynamic questionnaire answers before blueprint generation
 */
export function validateDynamicAnswers(dynamicAnswers: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!dynamicAnswers || typeof dynamicAnswers !== 'object') {
    return {
      isValid: false,
      errors: ['Dynamic answers is not a valid object'],
      warnings,
    };
  }

  // Check if we have any answers at all
  const answerKeys = Object.keys(dynamicAnswers);
  if (answerKeys.length === 0) {
    errors.push('No dynamic answers provided');
  }

  // Count actual non-empty answers
  let nonEmptyAnswers = 0;
  let totalQuestions = 0;

  for (const [key, value] of Object.entries(dynamicAnswers)) {
    totalQuestions++;

    // Check for non-empty values
    if (value !== null && value !== undefined && value !== '') {
      if (Array.isArray(value) && value.length > 0) {
        nonEmptyAnswers++;
      } else if (typeof value === 'string' && value.trim().length > 0) {
        nonEmptyAnswers++;
      } else if (typeof value === 'number') {
        nonEmptyAnswers++;
      } else if (typeof value === 'object' && Object.keys(value).length > 0) {
        nonEmptyAnswers++;
      }
    }
  }

  // Calculate completion percentage
  const completionRate = totalQuestions > 0 ? (nonEmptyAnswers / totalQuestions) * 100 : 0;

  if (completionRate < 50) {
    errors.push(
      `Only ${completionRate.toFixed(1)}% of questions answered. Need at least 50% completion.`
    );
  } else if (completionRate < 80) {
    warnings.push(
      `Only ${completionRate.toFixed(1)}% of questions answered. Consider completing more for better results.`
    );
  }

  // Check for specific important questions
  const importantQuestionPatterns = [
    /objective/i,
    /goal/i,
    /budget/i,
    /timeline/i,
    /audience/i,
    /outcome/i,
  ];

  for (const pattern of importantQuestionPatterns) {
    const hasAnswer = answerKeys.some((key) => {
      if (pattern.test(key)) {
        const value = dynamicAnswers[key];
        return (
          value &&
          ((typeof value === 'string' && value.trim().length > 0) ||
            (Array.isArray(value) && value.length > 0))
        );
      }
      return false;
    });

    if (!hasAnswer) {
      warnings.push(`No answer found for questions related to: ${pattern.source}`);
    }
  }

  // Check for potential data truncation
  const jsonString = JSON.stringify(dynamicAnswers);
  if (jsonString.length > 100000) {
    warnings.push(
      `Dynamic answers data is very large (${jsonString.length} chars). May affect processing.`
    );
  }

  logger.info('data-integrity.dynamic-validation', 'Dynamic answers validation complete', {
    isValid: errors.length === 0,
    errorCount: errors.length,
    warningCount: warnings.length,
    totalQuestions,
    nonEmptyAnswers,
    completionRate,
    dataSize: jsonString.length,
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    sanitizedData: dynamicAnswers,
  };
}

/**
 * Validate blueprint response from LLM
 */
export function validateBlueprintResponse(blueprint: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!blueprint || typeof blueprint !== 'object') {
    return {
      isValid: false,
      errors: ['Blueprint is not a valid object'],
      warnings,
    };
  }

  // Required top-level sections
  const requiredSections = [
    'metadata',
    'executive_summary',
    'learning_objectives',
    'target_audience',
    'instructional_strategy',
    'content_outline',
    'resources',
    'assessment_strategy',
    'implementation_timeline',
    'success_metrics',
  ];

  const missingSections = [];
  for (const section of requiredSections) {
    if (!blueprint[section]) {
      missingSections.push(section);
    }
  }

  if (missingSections.length > 0) {
    errors.push(`Missing required sections: ${missingSections.join(', ')}`);
  }

  // Check for empty or minimal sections
  for (const [key, value] of Object.entries(blueprint)) {
    if (key === 'metadata') continue; // Metadata can be minimal

    if (value && typeof value === 'object') {
      // Check if section has actual content
      const hasContent = Object.keys(value).some((k) => {
        const v = (value as any)[k];
        if (Array.isArray(v)) return v.length > 0;
        if (typeof v === 'string') return v.trim().length > 10;
        if (typeof v === 'object' && v !== null) return Object.keys(v).length > 0;
        return v !== null && v !== undefined;
      });

      if (!hasContent) {
        warnings.push(`Section '${key}' appears to have minimal or no content`);
      }

      // Check for displayType
      if (!(value as any).displayType && key !== 'metadata') {
        warnings.push(`Section '${key}' is missing displayType`);
      }
    }
  }

  // Validate specific section structures
  if (blueprint.learning_objectives?.objectives) {
    const objectives = blueprint.learning_objectives.objectives;
    if (!Array.isArray(objectives) || objectives.length === 0) {
      errors.push('Learning objectives must be a non-empty array');
    } else if (objectives.length < 3) {
      warnings.push(
        'Consider adding more learning objectives (found only ' + objectives.length + ')'
      );
    }
  }

  if (blueprint.content_outline?.modules) {
    const modules = blueprint.content_outline.modules;
    if (!Array.isArray(modules) || modules.length === 0) {
      errors.push('Content modules must be a non-empty array');
    }
  }

  // Check for truncation indicators
  const jsonString = JSON.stringify(blueprint);

  // Look for incomplete JSON patterns
  if (jsonString.endsWith('...') || jsonString.endsWith('…')) {
    errors.push('Blueprint appears to be truncated (ends with ellipsis)');
  }

  // Check if last section is incomplete
  const sections = Object.keys(blueprint);
  const lastSection = sections[sections.length - 1];
  if (lastSection && blueprint[lastSection]) {
    const lastSectionStr = JSON.stringify(blueprint[lastSection]);
    if (lastSectionStr.length < 50) {
      warnings.push(`Last section '${lastSection}' seems incomplete`);
    }
  }

  logger.info('data-integrity.blueprint-validation', 'Blueprint validation complete', {
    isValid: errors.length === 0,
    errorCount: errors.length,
    warningCount: warnings.length,
    sectionCount: Object.keys(blueprint).length,
    dataSize: jsonString.length,
    missingSections,
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    sanitizedData: blueprint,
  };
}

/**
 * Sanitize and trim large data objects before LLM submission
 */
export function sanitizeForLLM(data: any, maxLength: number = 100000): any {
  const jsonString = JSON.stringify(data);

  if (jsonString.length <= maxLength) {
    return data;
  }

  logger.warn('data-integrity.sanitizing', 'Data exceeds max length, trimming', {
    originalLength: jsonString.length,
    maxLength,
  });

  // If it's an object, try to trim large text fields
  if (typeof data === 'object' && data !== null) {
    const sanitized = { ...data };

    for (const [key, value] of Object.entries(sanitized)) {
      if (typeof value === 'string' && value.length > 5000) {
        // Truncate very long strings
        sanitized[key] = value.substring(0, 5000) + '... [truncated]';
      } else if (Array.isArray(value) && value.length > 50) {
        // Limit array sizes
        sanitized[key] = value.slice(0, 50);
      } else if (typeof value === 'object' && value !== null) {
        // Recursively sanitize nested objects
        sanitized[key] = sanitizeForLLM(value, Math.floor(maxLength / 4));
      }
    }

    return sanitized;
  }

  return data;
}
