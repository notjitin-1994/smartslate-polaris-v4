#!/bin/bash

# Script to fix ESLint errors systematically

echo "Fixing ESLint errors..."

# Fix 1: Replace require() with import in test files
find . -type f \( -name "*.test.ts" -o -name "*.test.tsx" \) -exec sed -i "s/const \([a-zA-Z_]*\) = require('\([^']*\)')/import \1 from '\2'/g" {} \;

# Fix 2: Prefix unused variables with underscore
# This is complex and needs manual review, so we'll skip automated fixing

# Fix 3: Add keys to React elements
# This is complex and context-dependent, needs manual fixing

# Fix 4: Replace any with unknown in type definitions
# This needs careful manual review as well

echo "Automated fixes complete. Run 'npm run lint' to check remaining issues."
echo "Remaining issues require manual review:"
echo "- Unused variables (prefix with _)"
echo "- any types (replace with proper types)"
echo "- React keys (add key prop to mapped elements)"
echo "- require() imports (convert to ES6 imports)"
