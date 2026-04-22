import { jsPDF } from 'jspdf';
import { blueprintPDFStyles, defaultMargins, PDFMargins } from './pdfStyles';

export class PDFLayoutManager {
  private doc: jsPDF;
  private currentY: number;
  private pageHeight: number;
  private margins: PDFMargins;

  constructor(doc: jsPDF, margins: PDFMargins = defaultMargins) {
    this.doc = doc;
    this.margins = margins;
    this.currentY = margins.top;
    this.pageHeight = doc.internal.pageSize.height;
  }

  /**
   * Add a section header with divider line
   */
  addSectionHeader(title: string, level: 1 | 2 | 3 = 1): void {
    this.checkPageBreak(40);

    const style =
      level === 1
        ? blueprintPDFStyles.primary
        : level === 2
          ? blueprintPDFStyles.secondary
          : blueprintPDFStyles.body;

    this.doc.setFont(style.family, style.weight);
    this.doc.setFontSize(style.size);
    this.doc.setTextColor(...style.color);
    this.doc.text(title, this.margins.left, this.currentY);
    this.currentY += style.size * 0.6;

    // Add divider line
    this.doc.setDrawColor(...blueprintPDFStyles.body.color);
    this.doc.setLineWidth(0.5);
    this.doc.line(
      this.margins.left,
      this.currentY,
      this.doc.internal.pageSize.width - this.margins.right,
      this.currentY
    );
    this.currentY += 15;
  }

  /**
   * Add text content with proper wrapping
   */
  addTextContent(text: string, style: 'body' | 'caption' = 'body'): void {
    const textStyle = style === 'body' ? blueprintPDFStyles.body : blueprintPDFStyles.caption;
    const maxWidth = this.doc.internal.pageSize.width - this.margins.left - this.margins.right;

    this.doc.setFont(textStyle.family, 'normal');
    this.doc.setFontSize(textStyle.size);
    this.doc.setTextColor(...textStyle.color);

    const lines = this.doc.splitTextToSize(text, maxWidth);

    for (const line of lines) {
      this.checkPageBreak(6);
      this.doc.text(line, this.margins.left, this.currentY);
      this.currentY += textStyle.lineHeight * textStyle.size;
    }

    this.currentY += 8; // Paragraph spacing
  }

  /**
   * Add a bulleted list
   */
  addBulletList(items: string[], indent: number = 0): void {
    const maxWidth =
      this.doc.internal.pageSize.width - this.margins.left - this.margins.right - indent;

    this.doc.setFont(blueprintPDFStyles.body.family, 'normal');
    this.doc.setFontSize(blueprintPDFStyles.body.size);
    this.doc.setTextColor(...blueprintPDFStyles.body.color);

    for (const item of items) {
      this.checkPageBreak(8);

      // Add bullet point
      this.doc.text('•', this.margins.left + indent, this.currentY);

      // Add item text
      const lines = this.doc.splitTextToSize(item, maxWidth - 10);
      for (let i = 0; i < lines.length; i++) {
        this.checkPageBreak(6);
        this.doc.text(lines[i], this.margins.left + indent + 10, this.currentY);
        this.currentY += blueprintPDFStyles.body.lineHeight * blueprintPDFStyles.body.size;
      }

      this.currentY += 4; // Item spacing
    }

    this.currentY += 8; // List spacing
  }

  /**
   * Add a table
   */
  addTable(data: string[][], headers?: string[]): void {
    const tableHeight = (data.length + (headers ? 1 : 0)) * 8 + 20;
    this.checkPageBreak(tableHeight);

    const startY = this.currentY;
    const tableWidth = this.doc.internal.pageSize.width - this.margins.left - this.margins.right;
    const colWidth = tableWidth / (headers ? headers.length : data[0]?.length || 1);

    this.doc.setFont(blueprintPDFStyles.body.family, 'normal');
    this.doc.setFontSize(blueprintPDFStyles.body.size);
    this.doc.setTextColor(...blueprintPDFStyles.body.color);

    // Draw table border
    this.doc.setDrawColor(...blueprintPDFStyles.body.color);
    this.doc.setLineWidth(0.5);
    this.doc.rect(this.margins.left, startY - 5, tableWidth, tableHeight);

    let currentRowY = startY;

    // Draw headers if provided
    if (headers) {
      this.doc.setFont(blueprintPDFStyles.body.family, 'bold');
      for (let i = 0; i < headers.length; i++) {
        this.doc.text(headers[i], this.margins.left + i * colWidth + 2, currentRowY);
      }
      currentRowY += 8;

      // Draw header separator line
      this.doc.line(this.margins.left, currentRowY, this.margins.left + tableWidth, currentRowY);
      currentRowY += 2;
    }

    // Draw data rows
    this.doc.setFont(blueprintPDFStyles.body.family, 'normal');
    for (const row of data) {
      for (let i = 0; i < row.length; i++) {
        this.doc.text(row[i], this.margins.left + i * colWidth + 2, currentRowY);
      }
      currentRowY += 8;
    }

    this.currentY = currentRowY + 15;
  }

  /**
   * Add an image (chart)
   */
  addImage(imageData: string, width: number, height: number, caption?: string): void {
    const imageHeight = height + (caption ? 15 : 0);
    this.checkPageBreak(imageHeight);

    try {
      this.doc.addImage(imageData, 'PNG', this.margins.left, this.currentY, width, height);
      this.currentY += height + 5;

      if (caption) {
        this.addTextContent(caption, 'caption');
      }
    } catch (error) {
      console.warn('Failed to add image to PDF:', error);
      this.addTextContent(`[Chart image could not be rendered]`, 'caption');
    }
  }

  /**
   * Add page break if needed
   */
  addPageBreak(): void {
    this.doc.addPage();
    this.currentY = this.margins.top;
  }

  /**
   * Check if we need a page break and add one if necessary
   */
  private checkPageBreak(requiredSpace: number): void {
    if (this.currentY + requiredSpace > this.pageHeight - this.margins.bottom) {
      this.doc.addPage();
      this.currentY = this.margins.top;
    }
  }

  /**
   * Get current Y position
   */
  getCurrentY(): number {
    return this.currentY;
  }

  /**
   * Set Y position
   */
  setCurrentY(y: number): void {
    this.currentY = y;
  }

  /**
   * Add spacing
   */
  addSpacing(space: number): void {
    this.currentY += space;
  }
}
