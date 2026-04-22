/**
 * Report Export Service
 * Handles exporting reports to various formats: PDF, Excel, CSV, JSON
 */

export interface ReportData {
  name: string;
  type: string;
  generatedAt: string;
  dateRange?: {
    start: string | null;
    end: string | null;
  };
  data: any;
}

/**
 * Export report to JSON format
 */
export function exportToJSON(reportData: ReportData): Blob {
  const jsonString = JSON.stringify(reportData, null, 2);
  return new Blob([jsonString], { type: 'application/json' });
}

/**
 * Export report to CSV format
 * Flattens nested objects and exports as CSV
 */
export function exportToCSV(reportData: ReportData): Blob {
  const data = reportData.data;

  // Convert data to flat rows
  const rows: string[][] = [];

  // Add header row with metadata
  rows.push(['Report Name', reportData.name]);
  rows.push(['Report Type', reportData.type]);
  rows.push(['Generated At', reportData.generatedAt]);

  if (reportData.dateRange) {
    rows.push(['Date Range Start', reportData.dateRange.start || 'N/A']);
    rows.push(['Date Range End', reportData.dateRange.end || 'N/A']);
  }

  rows.push([]); // Empty row separator

  // Add summary section
  if (data.summary) {
    rows.push(['Summary']);
    Object.entries(data.summary).forEach(([key, value]) => {
      rows.push([formatKey(key), String(value)]);
    });
    rows.push([]); // Empty row separator
  }

  // Add other sections as tables
  Object.entries(data).forEach(([sectionKey, sectionValue]) => {
    if (sectionKey === 'summary' || sectionKey === 'dateRange' || sectionKey === 'generatedAt') {
      return; // Skip already processed sections
    }

    rows.push([formatKey(sectionKey)]);

    if (typeof sectionValue === 'object' && !Array.isArray(sectionValue)) {
      // Convert object to key-value pairs
      Object.entries(sectionValue as Record<string, any>).forEach(([key, value]) => {
        if (typeof value === 'object') {
          rows.push([formatKey(key), JSON.stringify(value)]);
        } else {
          rows.push([formatKey(key), String(value)]);
        }
      });
    } else if (Array.isArray(sectionValue)) {
      // Convert array to table
      if (sectionValue.length > 0 && typeof sectionValue[0] === 'object') {
        // Array of objects - use keys as headers
        const headers = Object.keys(sectionValue[0]);
        rows.push(headers.map(formatKey));

        sectionValue.forEach((item: any) => {
          rows.push(headers.map((key) => String(item[key] || '')));
        });
      } else {
        // Array of primitives
        sectionValue.forEach((item: any) => {
          rows.push([String(item)]);
        });
      }
    }

    rows.push([]); // Empty row separator
  });

  // Convert rows to CSV string
  const csvContent = rows
    .map((row) =>
      row
        .map((cell) => {
          // Escape quotes and wrap in quotes if contains comma or newline
          if (cell.includes(',') || cell.includes('\n') || cell.includes('"')) {
            return `"${cell.replace(/"/g, '""')}"`;
          }
          return cell;
        })
        .join(',')
    )
    .join('\n');

  return new Blob([csvContent], { type: 'text/csv' });
}

/**
 * Export report to Excel format
 * Creates a multi-sheet workbook with formatted data
 */
export async function exportToExcel(reportData: ReportData): Promise<Blob> {
  const { default: ExcelJS } = await import('exceljs');
  const workbook = new ExcelJS.Workbook();

  // Create summary sheet
  const summarySheet = workbook.addWorksheet('Summary');

  // Add summary data
  summarySheet.addRow(['Report Information']);
  summarySheet.addRow(['Report Name', reportData.name]);
  summarySheet.addRow(['Report Type', reportData.type]);
  summarySheet.addRow(['Generated At', reportData.generatedAt]);

  if (reportData.dateRange) {
    summarySheet.addRow(['Date Range Start', reportData.dateRange.start || 'N/A']);
    summarySheet.addRow(['Date Range End', reportData.dateRange.end || 'N/A']);
  }

  summarySheet.addRow([]); // Empty row

  // Add summary data
  if (reportData.data.summary) {
    summarySheet.addRow(['Summary']);
    Object.entries(reportData.data.summary).forEach(([key, value]) => {
      summarySheet.addRow([formatKey(key), value]);
    });
  }

  // Create sheets for each data section
  Object.entries(reportData.data).forEach(([sectionKey, sectionValue]) => {
    if (sectionKey === 'summary' || sectionKey === 'dateRange' || sectionKey === 'generatedAt') {
      return; // Skip already processed sections
    }

    const sheetName = formatKey(sectionKey).substring(0, 31); // Excel sheet name limit
    const sheet = workbook.addWorksheet(sheetName);

    if (typeof sectionValue === 'object' && !Array.isArray(sectionValue)) {
      // Convert object to key-value pairs
      sheet.addRow(['Key', 'Value']);
      Object.entries(sectionValue as Record<string, any>).forEach(([key, value]) => {
        sheet.addRow([formatKey(key), typeof value === 'object' ? JSON.stringify(value) : value]);
      });
    } else if (Array.isArray(sectionValue) && sectionValue.length > 0) {
      // Convert array to table
      if (typeof sectionValue[0] === 'object') {
        const headers = Object.keys(sectionValue[0]);
        sheet.addRow(headers.map(formatKey));

        sectionValue.forEach((item: any) => {
          sheet.addRow(headers.map((key) => item[key]));
        });
      } else {
        sheet.addRow(['Index', 'Value']);
        sectionValue.forEach((item, index) => {
          sheet.addRow([index + 1, item]);
        });
      }
    }
  });

  // Generate Excel file
  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

/**
 * Export report to PDF format
 * Uses HTML canvas rendering for client-side PDF generation
 */
export async function exportToPDF(reportData: ReportData): Promise<Blob> {
  // For client-side PDF generation, we'll use jsPDF with html2canvas
  // This will be imported dynamically to reduce initial bundle size

  try {
    const { default: jsPDF } = await import('jspdf');
    const { default: html2canvas } = await import('html2canvas');

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Create HTML content for the report
    const htmlContent = createReportHTML(reportData);

    // Create temporary container
    const container = document.createElement('div');
    container.innerHTML = htmlContent;
    container.style.width = '210mm'; // A4 width
    container.style.padding = '10mm';
    container.style.backgroundColor = 'white';
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    document.body.appendChild(container);

    // Convert HTML to canvas
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    });

    // Remove temporary container
    document.body.removeChild(container);

    // Add canvas to PDF
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add new pages if content exceeds one page
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      doc.addPage();
      doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    return doc.output('blob');
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  }
}

/**
 * Create HTML content for PDF rendering
 */
function createReportHTML(reportData: ReportData): string {
  const data = reportData.data;

  let html = `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <div style="border-bottom: 2px solid #4f46e5; padding-bottom: 10px; margin-bottom: 20px;">
        <h1 style="color: #4f46e5; margin: 0;">${escapeHtml(reportData.name)}</h1>
        <p style="color: #666; margin: 5px 0;">Type: ${escapeHtml(reportData.type)}</p>
        <p style="color: #666; margin: 5px 0;">Generated: ${escapeHtml(new Date(reportData.generatedAt).toLocaleString())}</p>
  `;

  if (reportData.dateRange) {
    html += `
      <p style="color: #666; margin: 5px 0;">
        Date Range: ${escapeHtml(reportData.dateRange.start ? new Date(reportData.dateRange.start).toLocaleDateString() : 'N/A')}
        to ${escapeHtml(reportData.dateRange.end ? new Date(reportData.dateRange.end).toLocaleDateString() : 'N/A')}
      </p>
    `;
  }

  html += `</div>`;

  // Add summary section
  if (data.summary) {
    html += `
      <div style="margin-bottom: 20px;">
        <h2 style="color: #4f46e5; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">Summary</h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
    `;

    Object.entries(data.summary).forEach(([key, value]) => {
      html += `
        <tr style="border-bottom: 1px solid #f3f4f6;">
          <td style="padding: 8px; font-weight: 600; width: 50%;">${escapeHtml(formatKey(key))}</td>
          <td style="padding: 8px;">${escapeHtml(value)}</td>
        </tr>
      `;
    });

    html += `</table></div>`;
  }

  // Add other sections
  Object.entries(data).forEach(([sectionKey, sectionValue]) => {
    if (sectionKey === 'summary' || sectionKey === 'dateRange' || sectionKey === 'generatedAt') {
      return;
    }

    html += `
      <div style="margin-bottom: 20px; page-break-inside: avoid;">
        <h2 style="color: #4f46e5; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">${escapeHtml(formatKey(sectionKey))}</h2>
    `;

    if (typeof sectionValue === 'object' && !Array.isArray(sectionValue)) {
      html += `<table style="width: 100%; border-collapse: collapse; margin-top: 10px;">`;

      Object.entries(sectionValue as Record<string, any>).forEach(([key, value]) => {
        html += `
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 8px; font-weight: 600; width: 50%;">${escapeHtml(formatKey(key))}</td>
            <td style="padding: 8px;">${escapeHtml(typeof value === 'object' ? JSON.stringify(value) : value)}</td>
          </tr>
        `;
      });

      html += `</table>`;
    } else if (Array.isArray(sectionValue) && sectionValue.length > 0) {
      if (typeof sectionValue[0] === 'object') {
        const headers = Object.keys(sectionValue[0]);

        html += `
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <thead>
              <tr style="background-color: #f3f4f6;">
        `;

        headers.forEach((header) => {
          html += `<th style="padding: 8px; text-align: left; font-weight: 600;">${escapeHtml(formatKey(header))}</th>`;
        });

        html += `</tr></thead><tbody>`;

        sectionValue.forEach((item: any) => {
          html += `<tr style="border-bottom: 1px solid #f3f4f6;">`;
          headers.forEach((header) => {
            html += `<td style="padding: 8px;">${escapeHtml(item[header] || '')}</td>`;
          });
          html += `</tr>`;
        });

        html += `</tbody></table>`;
      } else {
        html += `<ul style="margin-top: 10px;">`;
        sectionValue.forEach((item: any) => {
          html += `<li style="padding: 5px 0;">${escapeHtml(item)}</li>`;
        });
        html += `</ul>`;
      }
    }

    html += `</div>`;
  });

  html += `</div>`;
  return html;
}

/**
 * Escape HTML to prevent XSS attacks
 */
function escapeHtml(unsafe: any): string {
  if (unsafe === null || unsafe === undefined) {
    return '';
  }
  const str = String(unsafe);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Format camelCase or snake_case keys to Title Case
 */
function formatKey(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1') // Add space before capital letters
    .replace(/_/g, ' ') // Replace underscores with spaces
    .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
    .trim();
}

/**
 * Download blob as file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Main export function - handles all export formats
 */
export async function exportReport(
  reportData: ReportData,
  format: 'pdf' | 'excel' | 'csv' | 'json'
): Promise<void> {
  try {
    let blob: Blob;
    let extension: string;

    switch (format) {
      case 'json':
        blob = exportToJSON(reportData);
        extension = 'json';
        break;
      case 'csv':
        blob = exportToCSV(reportData);
        extension = 'csv';
        break;
      case 'excel':
        blob = await exportToExcel(reportData);
        extension = 'xlsx';
        break;
      case 'pdf':
        blob = await exportToPDF(reportData);
        extension = 'pdf';
        break;
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }

    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const filename = `${reportData.name.replace(/[^a-z0-9]/gi, '_')}_${timestamp}.${extension}`;

    downloadBlob(blob, filename);
  } catch (error) {
    console.error(`Error exporting report as ${format}:`, error);
    throw error;
  }
}
