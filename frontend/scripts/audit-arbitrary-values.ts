#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface ArbitraryValue {
  file: string;
  line: number;
  type:
    | 'inline-style'
    | 'arbitrary-spacing'
    | 'arbitrary-size'
    | 'border-radius'
    | 'opacity'
    | 'color';
  value: string;
  context: string;
  count?: number;
}

interface AuditReport {
  totalFiles: number;
  totalIssues: number;
  inlineStyles: ArbitraryValue[];
  arbitrarySpacing: ArbitraryValue[];
  arbitrarySizes: ArbitraryValue[];
  borderRadiusVariations: Map<string, ArbitraryValue[]>;
  opacityValues: Map<string, ArbitraryValue[]>;
  colorValues: Map<string, ArbitraryValue[]>;
  frequentValues: Map<string, { count: number; files: Set<string> }>;
  recommendations: string[];
}

class ArbitraryValueAuditor {
  private report: AuditReport;
  private readonly frontendPath: string;

  /**
  * Initializes instance properties for the frontend arbitrary-values audit, setting the frontend path and an empty report structure used to collect findings.
  * @example
  * new AuditArbitraryValues()
  * AuditArbitraryValues instance with initialized frontendPath and report
  * @param {{void}} {{none}} - No parameters.
  * @returns {{object}} Instance - Constructed instance with initialized frontendPath and report fields.
  */
  constructor() {
    this.frontendPath = path.resolve(__dirname, '..');
    this.report = {
      totalFiles: 0,
      totalIssues: 0,
      inlineStyles: [],
      arbitrarySpacing: [],
      arbitrarySizes: [],
      borderRadiusVariations: new Map(),
      opacityValues: new Map(),
      colorValues: new Map(),
      frequentValues: new Map(),
      recommendations: [],
    };
  }

  /**
  * Perform a synchronous audit of frontend .tsx/.jsx files, analyze each line for issues, generate recommendations, and return the aggregated report.
  * @example
  * audit()
  * {
  *   totalFiles: 42,
  *   issues: [{ file: "src/App.tsx", line: 12, message: "Arbitrary value used" }],
  *   recommendations: ["Replace hard-coded values with constants", "..."]
  * }
  * @returns {Promise<AuditReport>} Promise that resolves to an AuditReport summarizing the total files inspected, detected issues, recommendations, and frequency analysis.
  **/
  async audit(): Promise<AuditReport> {
    const files = await glob('**/*.{tsx,jsx}', {
      cwd: this.frontendPath,
      ignore: ['node_modules/**', 'build/**', 'dist/**', '.next/**'],
    });

    this.report.totalFiles = files.length;

    for (const file of files) {
      const filePath = path.join(this.frontendPath, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        this.analyzeLine(file, line, index + 1);
      });
    }

    this.generateRecommendations();
    this.analyzeFrequency();

    return this.report;
  }

  /**
  * Analyze a single line of source code for inline styles, Tailwind arbitrary values, border-radius, opacity and custom color usages and update the internal report and frequency tracking.
  * @example
  * analyzeLine('frontend/scripts/audit-arbitrary-values.ts', 'className="bg-[var(--color)] rounded-[4px] opacity-50" style={{color: "red"}}', 42)
  * undefined
  * @param {{string}} {{file}} - File path or name being analyzed.
  * @param {{string}} {{line}} - The source code line to inspect.
  * @param {{number}} {{lineNumber}} - The 1-based line number in the file.
  * @returns {{void}} Return description in one line.
  **/
  private analyzeLine(file: string, line: string, lineNumber: number) {
    // Check for inline styles
    if (line.includes('style={{') || line.includes('style={')) {
      const match = line.match(/style=\{\{([^}]+)\}\}/);
      if (match) {
        this.report.inlineStyles.push({
          file,
          line: lineNumber,
          type: 'inline-style',
          value: match[1].trim(),
          context: line.trim(),
        });
        this.report.totalIssues++;
      }
    }

    // Check for arbitrary Tailwind values
    const arbitraryPattern =
      /(?:px|py|pt|pb|pl|pr|p|mx|my|mt|mb|ml|mr|m|w|h|min-w|max-w|min-h|max-h|gap|space-x|space-y)-\[([^\]]+)\]/g;
    let arbitraryMatch;
    while ((arbitraryMatch = arbitraryPattern.exec(line)) !== null) {
      const value = arbitraryMatch[0];
      const isSpacing = /^(?:px|py|pt|pb|pl|pr|p|mx|my|mt|mb|ml|mr|m|gap|space-x|space-y)-/.test(
        value
      );
      const isSize = /^(?:w|h|min-w|max-w|min-h|max-h)-/.test(value);

      const item: ArbitraryValue = {
        file,
        line: lineNumber,
        type: isSpacing ? 'arbitrary-spacing' : isSize ? 'arbitrary-size' : 'arbitrary-spacing',
        value: arbitraryMatch[0],
        context: line.trim(),
      };

      if (isSpacing) {
        this.report.arbitrarySpacing.push(item);
      } else if (isSize) {
        this.report.arbitrarySizes.push(item);
      }

      this.report.totalIssues++;
      this.trackFrequency(value, file);
    }

    // Check for border-radius variations
    const roundedPattern = /rounded-(?:none|sm|md|lg|xl|2xl|3xl|full|\[[^\]]+\])/g;
    let roundedMatch;
    while ((roundedMatch = roundedPattern.exec(line)) !== null) {
      const value = roundedMatch[0];
      if (!this.report.borderRadiusVariations.has(value)) {
        this.report.borderRadiusVariations.set(value, []);
      }
      this.report.borderRadiusVariations.get(value)!.push({
        file,
        line: lineNumber,
        type: 'border-radius',
        value,
        context: line.trim(),
      });
      this.trackFrequency(value, file);
    }

    // Check for opacity values
    const opacityPattern =
      /(?:bg|text|border)-(?:white|black|gray|slate|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)\/(\d+)/g;
    let opacityMatch;
    while ((opacityMatch = opacityPattern.exec(line)) !== null) {
      const opacity = opacityMatch[1];
      const fullValue = opacityMatch[0];
      if (!this.report.opacityValues.has(opacity)) {
        this.report.opacityValues.set(opacity, []);
      }
      this.report.opacityValues.get(opacity)!.push({
        file,
        line: lineNumber,
        type: 'opacity',
        value: fullValue,
        context: line.trim(),
      });
      this.trackFrequency(fullValue, file);
    }

    // Check for custom color values
    const colorVarPattern = /(?:bg|text|border)-\[(?:var\([^)]+\)|#[a-fA-F0-9]+|rgb[^]]+)\]/g;
    let colorMatch;
    while ((colorMatch = colorVarPattern.exec(line)) !== null) {
      const value = colorMatch[0];
      if (!this.report.colorValues.has(value)) {
        this.report.colorValues.set(value, []);
      }
      this.report.colorValues.get(value)!.push({
        file,
        line: lineNumber,
        type: 'color',
        value,
        context: line.trim(),
      });
      this.trackFrequency(value, file);
      this.report.totalIssues++;
    }
  }

  private trackFrequency(value: string, file: string) {
    if (!this.report.frequentValues.has(value)) {
      this.report.frequentValues.set(value, { count: 0, files: new Set() });
    }
    const freq = this.report.frequentValues.get(value)!;
    freq.count++;
    freq.files.add(file);
  }

  private analyzeFrequency() {
    // Sort frequent values by count
    const sortedFrequent = Array.from(this.report.frequentValues.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .filter(([_, data]) => data.count >= 3);

    // Create new map with sorted values
    this.report.frequentValues = new Map(sortedFrequent);
  }

  /**
  * Generate and assign human-readable recommendations based on the analysis stored in this.report.
  * @example
  * this.generateRecommendations()
  * undefined
  * @returns {{void}} Populates this.report.recommendations with an array of recommendation strings.
  **/
  private generateRecommendations() {
    const recommendations: string[] = [];

    // Inline styles recommendations
    if (this.report.inlineStyles.length > 0) {
      const uniqueStyles = new Set(this.report.inlineStyles.map((s) => s.value));
      recommendations.push(
        `Found ${this.report.inlineStyles.length} inline styles across ${uniqueStyles.size} unique patterns. Consider converting to Tailwind classes or CSS variables.`
      );
    }

    // Arbitrary spacing recommendations
    if (this.report.arbitrarySpacing.length > 0) {
      const uniqueSpacing = new Set(this.report.arbitrarySpacing.map((s) => s.value));
      recommendations.push(
        `Found ${this.report.arbitrarySpacing.length} arbitrary spacing values across ${uniqueSpacing.size} unique patterns. Consider using standard Tailwind spacing scale.`
      );
    }

    // Border radius recommendations
    const borderRadiusCount = this.report.borderRadiusVariations.size;
    if (borderRadiusCount > 5) {
      recommendations.push(
        `Found ${borderRadiusCount} different border-radius variations. Consider standardizing to 3-4 consistent values.`
      );
    }

    // Opacity recommendations
    const opacityCount = this.report.opacityValues.size;
    if (opacityCount > 8) {
      recommendations.push(
        `Found ${opacityCount} different opacity values. Consider standardizing to a limited set of opacity tokens.`
      );
    }

    // Frequent values that should be tokenized
    const tokenizeCandidates = Array.from(this.report.frequentValues.entries())
      .filter(([_, data]) => data.count >= 3)
      .map(([value, data]) => ({ value, count: data.count, files: data.files.size }));

    if (tokenizeCandidates.length > 0) {
      recommendations.push(
        `Found ${tokenizeCandidates.length} values used 3+ times that should be extracted to tokens.`
      );
      tokenizeCandidates.slice(0, 10).forEach(({ value, count, files }) => {
        recommendations.push(`  - "${value}": used ${count} times across ${files} files`);
      });
    }

    this.report.recommendations = recommendations;
  }

  /**
  * Print a readable audit summary of arbitrary CSS values to the console, save a detailed JSON report to frontend/arbitrary-values-audit.json, and return the generated report.
  * @example
  * rintReport()
  * { totalFiles: 42, totalIssues: 17, inlineStyles: [...], arbitrarySpacing: [...], arbitrarySizes: [...], recommendations: [...] }
  * @param {Object} context - The method "this" context expected to contain `report` (the audit data), `frontendPath` (string path to save the JSON), and helpers like `groupByFile`.
  * @returns {Object} The audit report object (this.report) that was printed and saved to disk.
  */
  printReport() {
    console.log('\n' + '='.repeat(80));
    console.log('🔍 ARBITRARY VALUES AUDIT REPORT');
    console.log('='.repeat(80) + '\n');

    console.log(`📊 Summary:`);
    console.log(`  Total files scanned: ${this.report.totalFiles}`);
    console.log(`  Total issues found: ${this.report.totalIssues}`);
    console.log();

    console.log(`📝 Inline Styles (${this.report.inlineStyles.length} found):`);
    if (this.report.inlineStyles.length > 0) {
      const grouped = this.groupByFile(this.report.inlineStyles);
      Object.entries(grouped)
        .slice(0, 5)
        .forEach(([file, items]) => {
          console.log(`  ${file}:`);
          items.slice(0, 3).forEach((item) => {
            console.log(`    Line ${item.line}: ${item.value.substring(0, 60)}...`);
          });
        });
      if (this.report.inlineStyles.length > 15) {
        console.log(`  ... and ${this.report.inlineStyles.length - 15} more`);
      }
    }
    console.log();

    console.log(`📏 Arbitrary Spacing Values (${this.report.arbitrarySpacing.length} found):`);
    if (this.report.arbitrarySpacing.length > 0) {
      const uniqueValues = new Set(this.report.arbitrarySpacing.map((s) => s.value));
      Array.from(uniqueValues)
        .slice(0, 10)
        .forEach((value) => {
          const count = this.report.arbitrarySpacing.filter((s) => s.value === value).length;
          console.log(`  ${value}: used ${count} times`);
        });
      if (uniqueValues.size > 10) {
        console.log(`  ... and ${uniqueValues.size - 10} more unique values`);
      }
    }
    console.log();

    console.log(`📐 Arbitrary Size Values (${this.report.arbitrarySizes.length} found):`);
    if (this.report.arbitrarySizes.length > 0) {
      const uniqueValues = new Set(this.report.arbitrarySizes.map((s) => s.value));
      Array.from(uniqueValues)
        .slice(0, 10)
        .forEach((value) => {
          const count = this.report.arbitrarySizes.filter((s) => s.value === value).length;
          console.log(`  ${value}: used ${count} times`);
        });
      if (uniqueValues.size > 10) {
        console.log(`  ... and ${uniqueValues.size - 10} more unique values`);
      }
    }
    console.log();

    console.log(`🔄 Border Radius Variations (${this.report.borderRadiusVariations.size} types):`);
    Array.from(this.report.borderRadiusVariations.entries())
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 8)
      .forEach(([value, items]) => {
        console.log(`  ${value}: used ${items.length} times`);
      });
    console.log();

    console.log(`🎨 Opacity Values (${this.report.opacityValues.size} unique):`);
    Array.from(this.report.opacityValues.entries())
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 10)
      .forEach(([opacity, items]) => {
        console.log(`  ${opacity}%: used ${items.length} times`);
      });
    console.log();

    console.log(`🔥 Most Frequent Values (should be tokenized):`);
    Array.from(this.report.frequentValues.entries())
      .filter(([_, data]) => data.count >= 3)
      .slice(0, 15)
      .forEach(([value, data]) => {
        console.log(`  "${value}": ${data.count} uses across ${data.files.size} files`);
      });
    console.log();

    console.log(`💡 Recommendations:`);
    this.report.recommendations.forEach((rec) => {
      console.log(`  ${rec}`);
    });
    console.log();

    // Save detailed report to file
    const reportPath = path.join(this.frontendPath, 'arbitrary-values-audit.json');
    const reportData = {
      ...this.report,
      borderRadiusVariations: Array.from(this.report.borderRadiusVariations.entries()).map(
        ([key, values]) => ({
          value: key,
          occurrences: values.length,
          locations: values.slice(0, 5),
        })
      ),
      opacityValues: Array.from(this.report.opacityValues.entries()).map(([key, values]) => ({
        opacity: key,
        occurrences: values.length,
        locations: values.slice(0, 5),
      })),
      colorValues: Array.from(this.report.colorValues.entries()).map(([key, values]) => ({
        color: key,
        occurrences: values.length,
        locations: values.slice(0, 5),
      })),
      frequentValues: Array.from(this.report.frequentValues.entries()).map(([value, data]) => ({
        value,
        count: data.count,
        files: Array.from(data.files),
      })),
    };

    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    console.log(`✅ Detailed report saved to: ${reportPath}`);

    return this.report;
  }

  /**
  * Group an array of ArbitraryValue objects by their 'file' property into a record keyed by file name.
  * @example
  * groupByFile([{ file: 'a.txt', id: 1 }, { file: 'b.txt', id: 2 }, { file: 'a.txt', id: 3 }])
  * { "a.txt": [{ file: 'a.txt', id: 1 }, { file: 'a.txt', id: 3 }], "b.txt": [{ file: 'b.txt', id: 2 }] }
  * @param {{ArbitraryValue[]}} items - Array of ArbitraryValue objects to group by their file property.
  * @returns {{Record<string, ArbitraryValue[]>}} Record mapping file names to arrays of ArbitraryValue objects.
  **/
  private groupByFile(items: ArbitraryValue[]): Record<string, ArbitraryValue[]> {
    return items.reduce(
      (acc, item) => {
        if (!acc[item.file]) {
          acc[item.file] = [];
        }
        acc[item.file].push(item);
        return acc;
      },
      {} as Record<string, ArbitraryValue[]>
    );
  }
}

// Run the audit
async function main() {
  const auditor = new ArbitraryValueAuditor();
  await auditor.audit();
  auditor.printReport();
}

main().catch(console.error);
