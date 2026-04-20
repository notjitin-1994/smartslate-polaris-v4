# Razorpay Scripts Documentation

## Overview

This directory contains scripts for managing Razorpay subscription plans for Smartslate Polaris v3. These scripts automate the creation, management, and configuration of subscription plans.

## Available Scripts

### 1. `create-new-plans` (Recommended)

**Purpose**: Enhanced script for creating Razorpay subscription plans with comprehensive error handling
**Usage**:

```bash
npm run create-new-plans                    # Create plans in test mode
npm run create-new-plans live               # Create plans in live mode
npm run create-new-plans --dry              # Preview what will be created
npm run create-new-plans --validate         # Validate plan configuration only
npm run create-new-plans --force            # Force creation (skip duplicates)
npm run create-new-plans --no-update        # Create plans without updating config
```

**Features**:

- Creates both monthly and yearly plans for all 6 tiers
- Prevents duplicate plan creation
- Automatic configuration file updates
- Comprehensive error handling and logging
- Support for both test and live modes
- Plan validation before creation
- Rollback capability for failed operations

### 2. `create-razorpay-plans` (Legacy)

**Purpose**: Original script for creating Razorpay plans
**Usage**:

```bash
npm run create-razorpay-plans
```

### 3. `setup-dev-plans`

**Purpose**: Sets up development environment with mock or test plans
**Usage**:

```bash
npm run setup-dev-plans
```

### 4. `list-razorpay-plans`

**Purpose**: Lists all existing plans in your Razorpay account
**Usage**:

```bash
npm run list-razorpay-plans
```

### 5. `delete-old-razorpay-plans`

**Purpose**: Safely deletes old plans without active subscriptions
**Usage**:

```bash
npm run delete-old-razorpay-plans --dry-run     # Preview deletion
npm run delete-old-razorpay-plans --confirm      # Confirm deletion
```

### 6. `delete-all-razorpay-plans`

**Purpose**: Deletes all plans (use with caution)
**Usage**:

```bash
npm run delete-all-razorpay-plans --dry-run     # Preview deletion
npm run delete-all-razorpay-plans --confirm      # Confirm deletion
```

## Plan Configuration

The scripts use the following pricing structure (as per task requirements):

| Tier      | Monthly Price | Yearly Price | Description                                                 |
| --------- | ------------- | ------------ | ----------------------------------------------------------- |
| Explorer  | ₹1,599        | ₹15,990      | Perfect for individual learners starting their journey      |
| Navigator | ₹3,299        | ₹32,990      | Ideal for professionals and serious creators                |
| Voyager   | ₹6,699        | ₹66,990      | Comprehensive solution for power users and experts          |
| Crew      | ₹1,999        | ₹19,990      | Team collaboration for small groups and startups (per seat) |
| Fleet     | ₹5,399        | ₹53,990      | Advanced team features for growing organizations (per seat) |
| Armada    | ₹10,899       | ₹108,990     | Enterprise-grade solution for large teams (per seat)        |

## Environment Variables

### Test Mode

```bash
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_XXXXX
RAZORPAY_KEY_SECRET=your_test_secret_here
```

### Live Mode

```bash
RAZORPAY_KEY_ID=rzp_live_XXXXX
RAZORPAY_KEY_SECRET=your_live_secret_here
```

## Configuration Files

### `frontend/lib/config/razorpayPlans.ts`

Contains plan ID mappings and pricing configuration. Automatically updated by the scripts.

### `frontend/.env.local`

Store your Razorpay API keys here. Never commit this file to version control.

## Workflow

1. **Initial Setup**:

   ```bash
   npm run setup-dev-plans  # For development environment
   ```

2. **Create Live Plans**:

   ```bash
   npm run create-new-plans --dry-run     # Preview first
   npm run create-new-plans live           # Create live plans
   ```

3. **Verify Plans**:

   ```bash
   npm run list-razorpay-plans
   ```

4. **Cleanup Old Plans**:
   ```bash
   npm run delete-old-razorpay-plans --dry-run
   npm run delete-old-razorpay-plans --confirm
   ```

## Error Handling

The scripts include comprehensive error handling:

- **Authentication Errors**: Validates API keys before attempting operations
- **Duplicate Detection**: Checks for existing plans to prevent duplicates
- **Network Errors**: Implements retry logic for transient failures
- **Configuration Errors**: Validates plan parameters before creation
- **Rollback Support**: Can undo partial changes if errors occur

## Testing

Test the scripts in development mode before using live credentials:

```bash
# Test with test mode credentials
npm run create-new-plans --dry-run

# Validate configuration
npm run create-new-plans --validate

# Test plan listing
npm run list-razorpay-plans
```

## Security

- Never commit API keys to version control
- Use test mode for development and testing
- Validate credentials before running scripts
- Review plan details before creation
- Keep backups of configuration files

## Troubleshooting

### Common Issues

1. **Authentication Errors**:
   - Check API key format (should start with `rzp_test_` or `rzp_live_`)
   - Verify API keys are correct and active
   - Ensure proper environment variable names

2. **Plan Creation Errors**:
   - Check if plan already exists
   - Verify plan amounts and currencies
   - Ensure sufficient permissions in Razorpay dashboard

3. **Configuration Errors**:
   - Validate TypeScript syntax in config files
   - Check plan ID formats
   - Ensure import paths are correct

### Getting Help

1. Check the script logs for detailed error messages
2. Run with `--dry-run` flag to preview actions
3. Use `--validate` flag to check configuration
4. Review Razorpay dashboard for plan status
5. Check environment variable setup

## Migration Guide

When moving from test to live environment:

1. Update environment variables with live API keys
2. Run `npm run create-new-plans live --dry-run` to preview
3. Execute `npm run create-new-plans live` to create live plans
4. Update any hardcoded test plan IDs in configuration
5. Test with a real transaction (small amount)

## Best Practices

1. **Always use dry-run first** before creating live plans
2. **Test thoroughly** in development/test environment
3. **Keep backups** of configuration files
4. **Monitor plan creation** in Razorpay dashboard
5. **Document any customizations** or deviations
6. **Regular cleanup** of old unused plans
7. **Validate credentials** before running scripts
8. **Use environment-specific** configurations
