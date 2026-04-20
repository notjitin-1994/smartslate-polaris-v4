/**
 * Table Section Component
 * Structured data tables with responsive design
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { formatSectionTitle, formatCurrency } from './utils';

interface TableSectionProps {
  sectionKey: string;
  data: any;
}

export function TableSection({ sectionKey, data }: TableSectionProps): React.JSX.Element {
  const tableData = prepareTableData(data);

  if (!tableData || tableData.rows.length === 0) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <p className="text-text-secondary">No table data available</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-6 md:p-8">
      <h2 className="text-title text-foreground mb-6">{formatSectionTitle(sectionKey)}</h2>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="overflow-x-auto"
      >
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-300">
              {tableData.columns.map((column, index) => (
                <th
                  key={column}
                  className="text-foreground px-4 py-3 text-left text-sm font-semibold"
                >
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    {column}
                  </motion.div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.rows.map((row, rowIndex) => (
              <motion.tr
                key={rowIndex}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: rowIndex * 0.05 + 0.2 }}
                className="hover:bg-foreground/5 border-b border-neutral-200 transition-colors"
              >
                {tableData.columns.map((column) => (
                  <td key={column} className="text-text-secondary px-4 py-3 text-sm">
                    {formatCellValue(row[column])}
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      {/* Budget Total if applicable */}
      {data.budget?.total && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 flex justify-end"
        >
          <div className="glass-strong rounded-xl px-6 py-3">
            <span className="text-text-secondary mr-4 text-sm">Total Budget:</span>
            <span className="text-primary text-xl font-bold">
              {formatCurrency(data.budget.total, data.budget.currency)}
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
}

/**
 * Prepare table data from various section structures
 */
function prepareTableData(data: any): { columns: string[]; rows: any[] } | null {
  // Handle resources section
  if (data.human_resources && Array.isArray(data.human_resources)) {
    return {
      columns: ['Role', 'FTE', 'Duration'],
      rows: data.human_resources.map((hr: any) => ({
        Role: hr.role,
        FTE: hr.fte,
        Duration: hr.duration,
      })),
    };
  }

  if (data.tools_and_platforms && Array.isArray(data.tools_and_platforms)) {
    return {
      columns: ['Category', 'Name', 'Cost Type'],
      rows: data.tools_and_platforms.map((tool: any) => ({
        Category: tool.category,
        Name: tool.name,
        'Cost Type': tool.cost_type,
      })),
    };
  }

  if (data.budget?.items && Array.isArray(data.budget.items)) {
    return {
      columns: ['Item', 'Amount'],
      rows: data.budget.items.map((item: any) => ({
        Item: item.item,
        Amount: formatCurrency(item.amount, data.budget.currency || 'USD'),
      })),
    };
  }

  // Handle risks section
  if (data.risks && Array.isArray(data.risks)) {
    return {
      columns: ['Risk', 'Probability', 'Impact', 'Mitigation Strategy'],
      rows: data.risks.map((risk: any) => ({
        Risk: risk.risk,
        Probability: risk.probability,
        Impact: risk.impact,
        'Mitigation Strategy': risk.mitigation_strategy,
      })),
    };
  }

  // Generic array handling
  if (Array.isArray(data)) {
    if (data.length === 0) return null;

    const firstItem = data[0];
    if (typeof firstItem === 'object') {
      const columns = Object.keys(firstItem).map(formatSectionTitle);
      const rows = data.map((item) => {
        const row: any = {};
        Object.keys(firstItem).forEach((key) => {
          row[formatSectionTitle(key)] = item[key];
        });
        return row;
      });

      return { columns, rows };
    }
  }

  return null;
}

/**
 * Format cell value for display
 */
function formatCellValue(value: any): string {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return value.toLocaleString();
  return String(value);
}
