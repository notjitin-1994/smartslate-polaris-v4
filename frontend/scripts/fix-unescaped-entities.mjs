#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

// Get all files with unescaped entity warnings
const lintOutput = execSync('npm run lint 2>&1', { encoding: 'utf-8' });
const lines = lintOutput.split('\n');

const entityMap = {
  "'": '&apos;',
  '"': '&quot;',
};

const filesToFix = new Set();
for (const line of lines) {
  if (line.includes('react/no-unescaped-entities')) {
    const match = line.match(/^(.+?):\d+:\d+/);
    if (match) {
      filesToFix.add(match[1].trim());
    }
  }
}

console.log(`Found ${filesToFix.size} files with unescaped entities`);

let totalFixed = 0;

for (const filePath of filesToFix) {
  try {
    let content = readFileSync(filePath, 'utf-8');
    let modified = false;

    // Fix unescaped apostrophes and quotes in JSX text content
    // Pattern: Look for text between > and < that contains unescaped entities
    content = content.replace(/>([^<]*?)(['""])([^<]*?)</g, (match, before, quote, after) => {
      if (quote === "'" && !before.match(/&apos;$/) && !after.match(/^&apos;/)) {
        modified = true;
        totalFixed++;
        return `>${before}&apos;${after}<`;
      }
      if (quote === '"' && !before.match(/&quot;$/) && !after.match(/^&quot;/)) {
        modified = true;
        totalFixed++;
        return `>${before}&quot;${after}<`;
      }
      return match;
    });

    if (modified) {
      writeFileSync(filePath, content, 'utf-8');
      console.log(`Fixed: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

console.log(`\nTotal fixes applied: ${totalFixed}`);
console.log('Done!');
