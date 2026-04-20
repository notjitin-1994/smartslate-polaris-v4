#!/usr/bin/env tsx

/**
 * Production Configuration Validation Script
 *
 * Validates that all required environment variables are properly configured
 * for production deployment with Razorpay integration.
 *
 * Usage: npm run validate:production
 */

import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });
config({ path: '.env.production' });

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  info: string[];
}

interface EnvVarConfig {
  name: string;
  required: boolean;
  production: boolean;
  description: string;
  validator?: (value: string) => boolean;
  warning?: (value: string) => boolean;
}

const ENV_VARS: EnvVarConfig[] = [
  // Razorpay Configuration
  {
    name: 'NEXT_PUBLIC_RAZORPAY_KEY_ID',
    required: true,
    production: true,
    description: 'Razorpay API Key ID (live mode)',
    validator: (value) => value.startsWith('rzp_live_'),
    warning: (value) => value.startsWith('rzp_test_'),
  },
  {
    name: 'RAZORPAY_KEY_SECRET',
    required: true,
    production: true,
    description: 'Razorpay API Key Secret (live mode)',
    validator: (value) => value.length > 20 && !value.includes('test'),
  },
  {
    name: 'RAZORPAY_WEBHOOK_SECRET',
    required: true,
    production: true,
    description: 'Razorpay Webhook Secret',
    validator: (value) => value.startsWith('whsec_') && value.length > 20,
  },
  {
    name: 'NEXT_PUBLIC_ENABLE_PAYMENTS',
    required: true,
    production: true,
    description: 'Enable payment features',
    validator: (value) => value === 'true',
  },

  // Supabase Configuration
  {
    name: 'NEXT_PUBLIC_SUPABASE_URL',
    required: true,
    production: true,
    description: 'Supabase Project URL',
    validator: (value) => value.startsWith('https://') && value.includes('.supabase.co'),
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    required: true,
    production: true,
    description: 'Supabase Anonymous Key',
    validator: (value) => value.length > 50,
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    required: true,
    production: true,
    description: 'Supabase Service Role Key',
    validator: (value) => value.length > 50 && !value.startsWith('eyJ'),
  },

  // AI Configuration
  {
    name: 'GOOGLE_GENERATIVE_AI_API_KEY',
    required: true,
    production: true,
    description: 'Gemini API Key',
    validator: (value) => value.startsWith('sk-ant-'),
  },

  // Application Configuration
  {
    name: 'NEXT_PUBLIC_APP_URL',
    required: true,
    production: true,
    description: 'Production Application URL',
    validator: (value) => value.startsWith('https://') && !value.includes('localhost'),
  },
  {
    name: 'NODE_ENV',
    required: true,
    production: true,
    description: 'Node Environment',
    validator: (value) => value === 'production',
  },
];

/**
* Validate environment variables and produce a summary of validation results including errors, warnings, and info messages.
* @example
* validateEnvironment()
* { valid: false, errors: ['❌ API_KEY: Required but not set'], warnings: ['⚠️ NEXT_PUBLIC_FEATURE: May contain test value in production'], info: ['✅ DATABASE_URL: Valid'] }
* @returns {ValidationResult} Return an object summarizing whether the environment is valid and arrays of errors, warnings, and informational messages.
**/
function validateEnvironment(): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    info: [],
  };

  const isProduction = process.env.NODE_ENV === 'production';

  console.log(`🔍 Environment Validation (${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'})`);
  console.log('='.repeat(60));

  ENV_VARS.forEach((envVar) => {
    const value = process.env[envVar.name];

    if (!value) {
      if (envVar.required) {
        result.errors.push(`❌ ${envVar.name}: Required but not set`);
        result.valid = false;
      } else {
        result.warnings.push(`⚠️ ${envVar.name}: Optional but not set`);
      }
      return;
    }

    // Check for test values in production
    if (isProduction && envVar.production) {
      if (envVar.warning && envVar.warning(value)) {
        result.errors.push(`❌ ${envVar.name}: Contains test/dev value in production`);
        result.valid = false;
        return;
      }
    }

    // Validate format
    if (envVar.validator && !envVar.validator(value)) {
      result.errors.push(`❌ ${envVar.name}: Invalid format`);
      result.valid = false;
      return;
    }

    // Success
    result.info.push(`✅ ${envVar.name}: Valid`);
  });

  // Additional production-specific checks
  if (isProduction) {
    // Check for any test keys
    Object.entries(process.env).forEach(([key, value]) => {
      if (key.startsWith('NEXT_PUBLIC_') && value?.includes('test_')) {
        result.warnings.push(`⚠️ ${key}: May contain test value in production`);
      }
    });

    // Check for localhost URLs
    Object.entries(process.env).forEach(([key, value]) => {
      if (key.startsWith('NEXT_PUBLIC_') && value?.includes('localhost')) {
        result.errors.push(`❌ ${key}: Contains localhost URL in production`);
        result.valid = false;
      }
    });
  }

  return result;
}

/**
* Prints formatted validation results to the console.
* @example
* displayResults({ valid: false, info: ['NODE_ENV set'], warnings: ['Using default port'], errors: ['MISSING_API_KEY'] })
* // Console output:
* // 📊 VALIDATION RESULTS
* // ============================================================
* // 💥 FAILED: Environment configuration has errors!
* // ✅ VALID VARIABLES:
* //   NODE_ENV set
* // ⚠️ WARNINGS:
* //   Using default port
* // ❌ ERRORS:
* //   MISSING_API_KEY
* @param {{ValidationResult}} {{result}} - Validation summary with `valid` boolean and `info`, `warnings`, `errors` string arrays.
* @returns {{void}} Void; the function prints the validation report and production guidance to stdout.
*/
function displayResults(result: ValidationResult): void {
  console.log('\n📊 VALIDATION RESULTS');
  console.log('='.repeat(60));

  if (result.valid) {
    console.log('🎉 PASSED: Environment configuration is valid!\n');
  } else {
    console.log('💥 FAILED: Environment configuration has errors!\n');
  }

  if (result.info.length > 0) {
    console.log('✅ VALID VARIABLES:');
    result.info.forEach((info) => console.log(`  ${info}`));
    console.log('');
  }

  if (result.warnings.length > 0) {
    console.log('⚠️ WARNINGS:');
    result.warnings.forEach((warning) => console.log(`  ${warning}`));
    console.log('');
  }

  if (result.errors.length > 0) {
    console.log('❌ ERRORS:');
    result.errors.forEach((error) => console.log(`  ${error}`));
    console.log('');
  }

  // Production-specific guidance
  if (process.env.NODE_ENV === 'production') {
    console.log('🚀 PRODUCTION DEPLOYMENT CHECKLIST:');
    console.log('  • Razorpay keys are in LIVE mode (rzp_live_)');
    console.log('  • Webhook URL is configured in Razorpay dashboard');
    console.log('  • SSL certificate is active');
    console.log('  • All test values have been removed');
    console.log('  • Database migrations applied to production');
    console.log('');
  }
}

/**
* Validate the production configuration, display results, and exit the process with an appropriate status code.
* @example
* main()
* void
* @param {{void}} {{none}} - No arguments are accepted.
* @returns {{void}} Does not return; exits the process with code 0 on success or 1 on failure.
**/
function main(): void {
  try {
    const result = validateEnvironment();
    displayResults(result);

    if (!result.valid) {
      console.log('❌ Validation failed. Please fix the errors before deploying.');
      process.exit(1);
    }

    console.log('✅ Validation passed! Ready for deployment.');
    process.exit(0);
  } catch (error) {
    console.error('💥 Validation script failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { validateEnvironment, ValidationResult, EnvVarConfig };
