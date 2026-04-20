#!/bin/bash

# ==============================================================================
# SmartSlate Polaris v3 - Secrets Management Validation Script
# ==============================================================================

set -e  # Exit on any error

echo "🔐 Validating Secrets Management Setup..."
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Function to print status
print_status() {
    local status=$1
    local message=$2

    if [ "$status" = "PASS" ]; then
        echo -e "✅ ${GREEN}$message${NC}"
    elif [ "$status" = "WARN" ]; then
        echo -e "⚠️  ${YELLOW}$message${NC}"
        ((WARNINGS++))
    elif [ "$status" = "FAIL" ]; then
        echo -e "❌ ${RED}$message${NC}"
        ((ERRORS++))
    fi
}

# ==============================================================================
# 1. Verify git-secrets is installed and configured
# ==============================================================================

echo ""
echo "1. Checking git-secrets installation..."

if command -v git-secrets >/dev/null 2>&1; then
    print_status "PASS" "git-secrets is available"

    # Check if hooks are installed
    if [ -f .git/hooks/pre-commit ] && [ -f .git/hooks/commit-msg ]; then
        print_status "PASS" "git-secrets hooks are installed"
    else
        print_status "FAIL" "git-secrets hooks are not properly installed"
    fi

    # Check if patterns are configured
    PATTERNS=$(git config --get-all secrets.patterns 2>/dev/null | wc -l)
    if [ "$PATTERNS" -gt 0 ]; then
        print_status "PASS" "git-secrets patterns are configured ($PATTERNS patterns)"
    else
        print_status "FAIL" "No git-secrets patterns configured"
    fi
else
    print_status "WARN" "git-secrets not found globally, using local installation"
fi

# ==============================================================================
# 2. Verify .gitignore patterns
# ==============================================================================

echo ""
echo "2. Checking .gitignore patterns..."

# Check for environment file patterns
if grep -q "\.env" .gitignore; then
    print_status "PASS" ".env files are ignored"
else
    print_status "FAIL" ".env files are not ignored"
fi

if grep -q "\.env\.local" .gitignore; then
    print_status "PASS" ".env.local files are ignored"
else
    print_status "FAIL" ".env.local files are not ignored"
fi

if grep -q "\.env\.\*\.local" .gitignore; then
    print_status "PASS" ".env.*.local files are ignored"
else
    print_status "FAIL" ".env.*.local files are not ignored"
fi

# Check for SSH key patterns
if grep -q "sshkey" .gitignore; then
    print_status "PASS" "SSH key files are ignored"
else
    print_status "FAIL" "SSH key files are not ignored"
fi

# Check for API key patterns
if grep -q "_api_key\|_secret\|_token" .gitignore; then
    print_status "PASS" "API key patterns are ignored"
else
    print_status "WARN" "API key patterns may not be fully covered"
fi

# ==============================================================================
# 3. Verify environment files don't exist or are ignored
# ==============================================================================

echo ""
echo "3. Checking environment file status..."

# Check if any .env files are tracked (they shouldn't be)
# Exclude .env.example files which should be tracked
TRACKED_ENV=$(git ls-files | grep -E "\.env$" | grep -v "\.env\.example" | wc -l)
if [ "$TRACKED_ENV" -eq 0 ]; then
    print_status "PASS" "No .env files are tracked by git"
else
    print_status "FAIL" "$TRACKED_ENV .env files are tracked by git"
fi

# Check if .env.example exists and is tracked (it should be)
if [ -f .env.example ] && git ls-files .env.example >/dev/null 2>&1; then
    print_status "PASS" ".env.example exists and is tracked"
else
    print_status "FAIL" ".env.example is missing or not tracked"
fi

# ==============================================================================
# 4. Test git-secrets functionality
# ==============================================================================

echo ""
echo "4. Testing git-secrets functionality..."

# Create a temporary test file
TEST_FILE=".secrets-test-$(date +%s)"
echo "test secret: sk-ant-test12345678901234567890123456789012" > "$TEST_FILE"

# Test if git-secrets detects it
if ./git-secrets --scan "$TEST_FILE" 2>&1 | grep -q "Matched one or more prohibited patterns"; then
    print_status "PASS" "git-secrets correctly detects fake secrets"
else
    print_status "FAIL" "git-secrets failed to detect fake secrets"
fi

# Clean up test file
rm -f "$TEST_FILE"

# ==============================================================================
# 5. Verify no hardcoded secrets in codebase
# ==============================================================================

echo ""
echo "5. Scanning for hardcoded secrets in codebase..."

# Search for common secret patterns (excluding test files and documentation)
HARD_CODED_SECRETS=$(find . -type f -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | \
    grep -v node_modules | grep -v __tests__ | grep -v ".test." | grep -v ".spec." | \
    xargs grep -l "sk-ant-\|pplx-\|sk-[a-zA-Z0-9]\{32,\}" 2>/dev/null | wc -l)

if [ "$HARD_CODED_SECRETS" -eq 0 ]; then
    print_status "PASS" "No hardcoded API keys found in source code"
else
    print_status "FAIL" "Found $HARD_CODED_SECRETS files with hardcoded API keys"
fi

# ==============================================================================
# 6. Verify documentation exists
# ==============================================================================

echo ""
echo "6. Checking documentation completeness..."

DOCS=(
    ".env.example"
    "CREDENTIAL_ROTATION_GUIDE.md"
    "CI_CD_SECRETS_INTEGRATION.md"
    "DEVELOPER_SECRETS_ONBOARDING.md"
    "SECURITY_CLEANUP_VERIFICATION.md"
)

for doc in "${DOCS[@]}"; do
    if [ -f "$doc" ]; then
        print_status "PASS" "Documentation exists: $doc"
    else
        print_status "FAIL" "Documentation missing: $doc"
    fi
done

# ==============================================================================
# SUMMARY
# ==============================================================================

echo ""
echo "=========================================="
echo "Secrets Management Validation Summary"
echo "=========================================="

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}🎉 All validations passed! Secrets management is properly configured.${NC}"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  $WARNINGS warnings found. Review and address as needed.${NC}"
    exit 0
else
    echo -e "${RED}❌ $ERRORS errors found. Secrets management needs attention.${NC}"
    exit 1
fi
