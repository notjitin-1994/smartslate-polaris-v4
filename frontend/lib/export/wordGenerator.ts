import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ShadingType,
  convertInchesToTwip,
  PageBreak,
  NumberFormat,
  LevelFormat,
  ImageRun,
  Header,
  Footer,
} from 'docx';
import { ExportData, ExportOptions, ExportResult } from './types';
import type { BlueprintData } from '@/lib/stores/types';

// Helper function to check if blueprint is complete
function isFullBlueprint(blueprint: any): blueprint is BlueprintData {
  return (
    blueprint &&
    typeof blueprint.id === 'string' &&
    typeof blueprint.title === 'string' &&
    typeof blueprint.description === 'string'
  );
}

/**
 * Generate a plain markdown Word document (no styling, just raw markdown)
 * Standalone function for simple markdown to Word conversion
 */
export async function generatePlainMarkdownWordDocument(
  markdownContent: string,
  title: string
): Promise<ExportResult> {
  try {
    // Parse the markdown into Word paragraphs
    const generator = new WordGenerator();
    const sections = generator.parseMarkdown(markdownContent);

    // Create a simple document with no branding or styling
    const doc = new Document({
      creator: 'SmartSlate',
      title: title,
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: convertInchesToTwip(1),
                bottom: convertInchesToTwip(1),
                left: convertInchesToTwip(1),
                right: convertInchesToTwip(1),
              },
            },
          },
          children: sections,
        },
      ],
    });

    // Generate blob
    const blob = await Packer.toBlob(doc);

    return {
      success: true,
      data: blob,
      metadata: {
        title,
        description: 'Plain markdown export',
        createdAt: new Date().toISOString(),
        exportedAt: new Date().toISOString(),
        version: '1.0',
      },
      fileSize: blob.size,
    };
  } catch (error) {
    console.error('Plain markdown Word generation failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Plain markdown Word generation failed',
    };
  }
}

/**
 * Word Document Generator with Premium Brand Design & Industry-Standard Layout
 * Features: Professional typography, sophisticated color scheme, structured layout,
 * brand-compliant styling, and executive-level presentation quality
 */
export class WordGenerator {
  // SmartSlate Brand Colors (from globals.css) - Enhanced Palette
  private readonly brandTeal = 'A7DADB'; // Primary accent #a7dadb
  private readonly brandTealLight = 'D0EDF0'; // #d0edf0
  private readonly brandTealDark = '7BC5C7'; // #7bc5c7
  private readonly brandIndigo = '4F46E5'; // Secondary accent #4f46e5
  private readonly brandIndigoLight = '7C69F5'; // #7c69f5
  private readonly brandIndigoDark = '3730A3'; // #3730a3
  private readonly darkBg = '020C1B'; // Dark background
  private readonly paperBg = '0D1B2A'; // Paper background
  private readonly surfaceBg = '142433'; // Surface background
  private readonly textPrimary = 'E0E0E0'; // #e0e0e0
  private readonly textSecondary = 'B0C5C6'; // #b0c5c6
  private readonly textMuted = '8B9FA8'; // #8b9fa8
  private readonly accentGold = 'F59E0B'; // #f59e0b
  private readonly accentRose = 'F43F5E'; // #f43f5e
  private readonly gradientStart = '1E293B'; // #1e293b
  private readonly gradientEnd = '334155'; // #334155

  private logoBase64: string | null = null;

  /**
   * Load SmartSlate logo from public directory
   */
  private async loadLogo(): Promise<void> {
    if (this.logoBase64) return;

    try {
      const response = await fetch('/logo.png');
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      // Convert to base64
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      this.logoBase64 = btoa(binary);
    } catch (error) {
      console.error('Failed to load logo:', error);
      this.logoBase64 = null;
    }
  }

  /**
   * Generate a Word document from blueprint data with premium branding
   */
  public async generateWordDocument(
    data: ExportData,
    options: ExportOptions
  ): Promise<ExportResult> {
    try {
      // Load logo first
      await this.loadLogo();

      const sections: Paragraph[] = [];

      // Add initial dark background paragraph to set page background
      sections.push(
        new Paragraph({
          children: [],
          spacing: { before: 0, after: 0 },
          shading: {
            type: ShadingType.SOLID,
            color: this.darkBg,
            fill: this.darkBg,
          },
        })
      );

      // Add branded title page with logo
      sections.push(...this.createBrandedTitlePage(data));

      // Add page break after title page with dark background
      sections.push(
        new Paragraph({
          children: [new PageBreak()],
          shading: {
            type: ShadingType.SOLID,
            color: this.darkBg,
            fill: this.darkBg,
          },
        })
      );

      // Add table of contents page with dark background
      const tocSections = this.createTableOfContents(data);
      sections.push(...tocSections);

      // Add page break before main content with dark background
      sections.push(
        new Paragraph({
          children: [new PageBreak()],
          shading: {
            type: ShadingType.SOLID,
            color: this.darkBg,
            fill: this.darkBg,
          },
        })
      );

      // Add metadata section if requested
      if (options.includeMetadata) {
        const metadataContent = this.createMetadataSection(data);
        sections.push(...metadataContent);
      }

      // Add blueprint content with dark background styling
      const blueprintContent = isFullBlueprint(data.blueprint)
        ? this.createFullBlueprintContent(data.blueprint)
        : this.createSimpleBlueprintContent(data.blueprint);

      // Apply dark background styling to content sections
      const styledBlueprintContent = blueprintContent;

      sections.push(...styledBlueprintContent);

      // Add dashboard data if available and requested
      if (options.includeCharts && data.dashboardData) {
        sections.push(
          new Paragraph({
            children: [new PageBreak()],
            shading: {
              type: ShadingType.SOLID,
              color: this.darkBg,
              fill: this.darkBg,
            },
          })
        );

        const dashboardContent = this.createDashboardSection(data.dashboardData);
        const styledDashboardContent = dashboardContent;

        sections.push(...styledDashboardContent);
      }

      // Create document with branded styling and headers/footers
      const doc = new Document({
        creator: 'SmartSlate',
        title: data.metadata.title,
        description: data.metadata.description,
        styles: {
          paragraphStyles: [
            {
              id: 'dark-background',
              name: 'Dark Background',
              basedOn: 'Normal',
              run: {
                color: this.textPrimary,
                size: 22,
              },
              paragraph: {
                shading: {
                  type: ShadingType.SOLID,
                  color: this.darkBg,
                  fill: this.darkBg,
                },
              },
            },
            {
              id: 'section-heading',
              name: 'Section Heading',
              basedOn: 'Heading1',
              run: {
                color: this.brandTeal,
                size: 40,
                bold: true,
              },
              paragraph: {
                spacing: {
                  before: 400,
                  after: 200,
                },
                shading: {
                  type: ShadingType.SOLID,
                  color: this.gradientStart,
                  fill: this.gradientStart,
                },
              },
            },
          ],
          characterStyles: [
            {
              id: 'dark-text',
              name: 'Dark Text',
              run: {
                color: this.textPrimary,
                size: 22,
              },
            },
          ],
        },
        sections: [
          {
            properties: {
              page: {
                pageNumbers: {
                  start: 1,
                  formatType: NumberFormat.DECIMAL,
                },
                margin: {
                  top: convertInchesToTwip(1),
                  bottom: convertInchesToTwip(1),
                  left: convertInchesToTwip(1),
                  right: convertInchesToTwip(1),
                },
              },
            },
            headers: {
              default: this.createHeader(data),
            },
            footers: {
              default: this.createFooter(),
            },
            children: sections,
          },
        ],
      });

      // Generate blob
      const blob = await Packer.toBlob(doc);

      return {
        success: true,
        data: blob,
        metadata: data.metadata,
        fileSize: blob.size,
      };
    } catch (error) {
      console.error('Word generation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Word generation failed',
      };
    }
  }

  /**
   * Create sophisticated branded header with modern design and dark theme
   */
  private createHeader(data: ExportData): Header {
    return new Header({
      children: [
        new Table({
          width: {
            size: 100,
            type: WidthType.PERCENTAGE,
          },
          borders: {
            top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
            bottom: { style: BorderStyle.SINGLE, size: 3, color: this.brandTeal },
            left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
            right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
            insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
            insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 70, type: WidthType.PERCENTAGE },
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: data.metadata.title,
                          bold: true,
                          size: 16,
                          color: this.textPrimary,
                          font: 'Quicksand',
                        }),
                      ],
                      alignment: AlignmentType.LEFT,
                      spacing: { before: 100, after: 50 },
                    }),
                  ],
                  shading: {
                    type: ShadingType.SOLID,
                    color: this.darkBg,
                    fill: this.darkBg,
                  },
                }),
                new TableCell({
                  width: { size: 30, type: WidthType.PERCENTAGE },
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: 'SmartSlate',
                          bold: true,
                          size: 18,
                          color: this.brandTeal,
                          font: 'Quicksand',
                          allCaps: true,
                        }),
                      ],
                      alignment: AlignmentType.RIGHT,
                      spacing: { before: 100, after: 50 },
                    }),
                  ],
                  shading: {
                    type: ShadingType.SOLID,
                    color: this.darkBg,
                    fill: this.darkBg,
                  },
                }),
              ],
            }),
          ],
        }),
      ],
    });
  }

  /**
   * Create sophisticated branded footer with modern design and dark theme
   */
  private createFooter(): Footer {
    return new Footer({
      children: [
        new Table({
          width: {
            size: 100,
            type: WidthType.PERCENTAGE,
          },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 3, color: this.brandIndigo },
            bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
            left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
            right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
            insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
            insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 33, type: WidthType.PERCENTAGE },
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: `Page ${this.getCurrentPageNumber()}`,
                          size: 14,
                          color: this.textMuted,
                          font: 'Lato',
                        }),
                      ],
                      alignment: AlignmentType.LEFT,
                      spacing: { before: 50, after: 100 },
                    }),
                  ],
                  shading: {
                    type: ShadingType.SOLID,
                    color: this.darkBg,
                    fill: this.darkBg,
                  },
                }),
                new TableCell({
                  width: { size: 33, type: WidthType.PERCENTAGE },
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: 'Confidential • For Internal Use Only',
                          size: 12,
                          color: this.textMuted,
                          font: 'Lato',
                          italics: true,
                        }),
                      ],
                      alignment: AlignmentType.CENTER,
                      spacing: { before: 50, after: 100 },
                    }),
                  ],
                  shading: {
                    type: ShadingType.SOLID,
                    color: this.darkBg,
                    fill: this.darkBg,
                  },
                }),
                new TableCell({
                  width: { size: 33, type: WidthType.PERCENTAGE },
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: 'smartslate.io',
                          size: 14,
                          color: this.brandTeal,
                          font: 'Lato',
                        }),
                      ],
                      alignment: AlignmentType.RIGHT,
                      spacing: { before: 50, after: 100 },
                    }),
                  ],
                  shading: {
                    type: ShadingType.SOLID,
                    color: this.darkBg,
                    fill: this.darkBg,
                  },
                }),
              ],
            }),
          ],
        }),
      ],
    });
  }

  /**
   * Helper method to get current page number (placeholder for now)
   */
  private getCurrentPageNumber(): string {
    // This would need to be implemented with proper page numbering
    // For now, return a placeholder
    return '•';
  }

  /**
   * Create premium branded title page with sophisticated design
   */
  private createBrandedTitlePage(data: ExportData): Paragraph[] {
    const paragraphs: Paragraph[] = [];

    // Sophisticated header with gradient background and enhanced dark styling
    paragraphs.push(
      new Paragraph({
        children: [],
        spacing: { before: 0, after: 0 },
        shading: {
          type: ShadingType.SOLID,
          color: this.darkBg,
          fill: this.darkBg,
        },
        border: {
          top: { color: this.brandTeal, style: BorderStyle.SINGLE, size: 12 },
          bottom: { color: this.brandIndigo, style: BorderStyle.SINGLE, size: 12 },
          left: { color: this.darkBg, style: BorderStyle.NONE, size: 0 },
          right: { color: this.darkBg, style: BorderStyle.NONE, size: 0 },
        },
      })
    );

    // Add logo with elegant positioning
    if (this.logoBase64) {
      paragraphs.push(
        new Paragraph({
          children: [
            new ImageRun({
              data: Uint8Array.from(atob(this.logoBase64), (c) => c.charCodeAt(0)),
              transformation: {
                width: 200,
                height: 200,
              },
              type: 'png',
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 300, after: 200 },
        })
      );
    }

    // SmartSlate branding with sophisticated typography
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'SmartSlate',
            bold: true,
            size: 36,
            color: this.brandTeal,
            font: 'Quicksand',
            allCaps: true,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
      })
    );

    // Subtitle with modern styling
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'Learning Experience Design Platform',
            size: 18,
            color: this.textSecondary,
            font: 'Lato',
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 },
      })
    );

    // Main title with sophisticated styling
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: data.metadata.title,
            bold: true,
            size: 52,
            color: this.textPrimary,
            font: 'Quicksand',
            shading: {
              type: ShadingType.SOLID,
              color: this.surfaceBg,
              fill: this.surfaceBg,
            },
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 200 },
        shading: {
          type: ShadingType.SOLID,
          color: this.surfaceBg,
          fill: this.surfaceBg,
        },
      })
    );

    // Decorative accent line
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: '━━━',
            size: 24,
            color: this.brandTeal,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 100, after: 300 },
      })
    );

    // Description with elegant typography
    if (data.metadata.description) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: data.metadata.description,
              size: 26,
              color: this.textSecondary,
              font: 'Lato',
              italics: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 100, after: 300 },
        })
      );
    }

    // Metadata section with modern table-like layout
    const createdDate = new Date(data.metadata.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Create metadata as a visual table
    const metadataRows = [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Generated',
                    bold: true,
                    size: 20,
                    color: this.brandIndigo,
                  }),
                ],
                alignment: AlignmentType.LEFT,
              }),
            ],
            shading: {
              type: ShadingType.SOLID,
              color: this.paperBg,
              fill: this.paperBg,
            },
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: createdDate,
                    size: 20,
                    color: this.textPrimary,
                  }),
                ],
                alignment: AlignmentType.RIGHT,
              }),
            ],
            shading: {
              type: ShadingType.SOLID,
              color: this.paperBg,
              fill: this.paperBg,
            },
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Version',
                    bold: true,
                    size: 20,
                    color: this.brandIndigo,
                  }),
                ],
                alignment: AlignmentType.LEFT,
              }),
            ],
            shading: {
              type: ShadingType.SOLID,
              color: this.surfaceBg,
              fill: this.surfaceBg,
            },
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: data.metadata.version,
                    size: 20,
                    color: this.textPrimary,
                  }),
                ],
                alignment: AlignmentType.RIGHT,
              }),
            ],
            shading: {
              type: ShadingType.SOLID,
              color: this.surfaceBg,
              fill: this.surfaceBg,
            },
          }),
        ],
      }),
    ];

    if (data.metadata.author) {
      metadataRows.push(
        new TableRow({
          children: [
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: 'Author',
                      bold: true,
                      size: 20,
                      color: this.brandIndigo,
                    }),
                  ],
                  alignment: AlignmentType.LEFT,
                }),
              ],
              shading: {
                type: ShadingType.SOLID,
                color: this.paperBg,
                fill: this.paperBg,
              },
            }),
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: data.metadata.author,
                      size: 20,
                      color: this.textPrimary,
                    }),
                  ],
                  alignment: AlignmentType.RIGHT,
                }),
              ],
              shading: {
                type: ShadingType.SOLID,
                color: this.paperBg,
                fill: this.paperBg,
              },
            }),
          ],
        })
      );
    }

    // Add metadata as formatted paragraphs instead of table for now
    // TODO: Implement proper table structure for metadata
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'Document Metadata',
            bold: true,
            size: 22,
            color: this.brandIndigo,
            font: 'Quicksand',
          }),
        ],
        alignment: AlignmentType.LEFT,
        spacing: { before: 200, after: 100 },
      })
    );

    // Create metadata table for professional presentation
    const metadataTableRows = [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Generated',
                    bold: true,
                    size: 20,
                    color: this.brandIndigo,
                  }),
                ],
                alignment: AlignmentType.LEFT,
              }),
            ],
            shading: {
              type: ShadingType.SOLID,
              color: this.paperBg,
              fill: this.paperBg,
            },
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: createdDate,
                    size: 20,
                    color: this.textPrimary,
                  }),
                ],
                alignment: AlignmentType.RIGHT,
              }),
            ],
            shading: {
              type: ShadingType.SOLID,
              color: this.paperBg,
              fill: this.paperBg,
            },
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Version',
                    bold: true,
                    size: 20,
                    color: this.brandIndigo,
                  }),
                ],
                alignment: AlignmentType.LEFT,
              }),
            ],
            shading: {
              type: ShadingType.SOLID,
              color: this.surfaceBg,
              fill: this.surfaceBg,
            },
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: data.metadata.version,
                    size: 20,
                    color: this.textPrimary,
                  }),
                ],
                alignment: AlignmentType.RIGHT,
              }),
            ],
            shading: {
              type: ShadingType.SOLID,
              color: this.surfaceBg,
              fill: this.surfaceBg,
            },
          }),
        ],
      }),
    ];

    if (data.metadata.author) {
      metadataTableRows.push(
        new TableRow({
          children: [
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: 'Author',
                      bold: true,
                      size: 20,
                      color: this.brandIndigo,
                    }),
                  ],
                  alignment: AlignmentType.LEFT,
                }),
              ],
              shading: {
                type: ShadingType.SOLID,
                color: this.paperBg,
                fill: this.paperBg,
              },
            }),
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: data.metadata.author,
                      size: 20,
                      color: this.textPrimary,
                    }),
                  ],
                  alignment: AlignmentType.RIGHT,
                }),
              ],
              shading: {
                type: ShadingType.SOLID,
                color: this.paperBg,
                fill: this.paperBg,
              },
            }),
          ],
        })
      );
    }

    // For now, use text-based metadata until proper table integration is implemented
    // TODO: Implement proper table structure that works with Word document format
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Generated: ${createdDate}`,
            size: 18,
            color: this.textPrimary,
          }),
        ],
        spacing: { before: 50, after: 50 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Version: ${data.metadata.version}`,
            size: 18,
            color: this.textPrimary,
          }),
        ],
        spacing: { before: 50, after: 50 },
      })
    );

    if (data.metadata.author) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Author: ${data.metadata.author}`,
              size: 18,
              color: this.textPrimary,
            }),
          ],
          spacing: { before: 50, after: 50 },
        })
      );
    }

    // Footer with sophisticated styling
    paragraphs.push(
      new Paragraph({
        text: '',
        spacing: { before: 400 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: 'Confidential Document',
            size: 14,
            color: this.textMuted,
            font: 'Lato',
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: '© 2025 SmartSlate • smartslate.io',
            size: 12,
            color: this.textMuted,
            font: 'Lato',
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 50 },
      })
    );

    return paragraphs;
  }

  /**
   * Create title page
   */
  private createTitlePage(data: ExportData): Paragraph[] {
    const paragraphs: Paragraph[] = [];

    // Title
    paragraphs.push(
      new Paragraph({
        text: data.metadata.title,
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      })
    );

    // Description
    if (data.metadata.description) {
      paragraphs.push(
        new Paragraph({
          text: data.metadata.description,
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        })
      );
    }

    // Metadata info
    const createdDate = new Date(data.metadata.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    paragraphs.push(
      new Paragraph({
        text: '',
        spacing: { before: 600, after: 200 },
      }),
      new Paragraph({
        text: `Created: ${createdDate}`,
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({
        text: `Version: ${data.metadata.version}`,
        alignment: AlignmentType.CENTER,
      })
    );

    if (data.metadata.author) {
      paragraphs.push(
        new Paragraph({
          text: `Author: ${data.metadata.author}`,
          alignment: AlignmentType.CENTER,
        })
      );
    }

    return paragraphs;
  }

  /**
   * Create table of contents page with dark theme styling
   */
  private createTableOfContents(data: ExportData): Paragraph[] {
    const paragraphs: Paragraph[] = [];

    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'Table of Contents',
            bold: true,
            size: 36,
            color: this.brandTeal,
            font: 'Quicksand',
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 300 },
        shading: {
          type: ShadingType.SOLID,
          color: this.darkBg,
          fill: this.darkBg,
        },
      })
    );

    // Table of contents items
    const tocItems = [
      { title: 'Executive Summary', page: '3' },
      { title: 'Learning Objectives', page: '4' },
      { title: 'Target Audience', page: '6' },
      { title: 'Instructional Strategy', page: '8' },
      { title: 'Content Outline', page: '10' },
      { title: 'Resources & Budget', page: '12' },
      { title: 'Assessment Strategy', page: '14' },
      { title: 'Implementation Timeline', page: '16' },
      { title: 'Risk Mitigation', page: '18' },
      { title: 'Success Metrics', page: '20' },
      { title: 'Sustainability Plan', page: '22' },
    ];

    tocItems.forEach((item, index) => {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${index + 1}. `,
              bold: true,
              size: 20,
              color: this.brandIndigo,
            }),
            new TextRun({
              text: item.title,
              size: 20,
              color: this.textPrimary,
            }),
            new TextRun({
              text: new Array(50).fill('.').join(''),
              size: 20,
              color: this.textSecondary,
            }),
            new TextRun({
              text: item.page,
              bold: true,
              size: 20,
              color: this.brandTeal,
            }),
          ],
          spacing: { before: 75, after: 75 },
          indent: { left: 720 },
          shading: {
            type: ShadingType.SOLID,
            color: this.darkBg,
            fill: this.darkBg,
          },
        })
      );
    });

    return paragraphs;
  }

  /**
   * Create metadata section with brand styling
   */
  private createMetadataSection(data: ExportData): Paragraph[] {
    const paragraphs: Paragraph[] = [];

    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'Document Information',
            bold: true,
            size: 32,
            color: this.brandTeal,
            font: 'Quicksand',
          }),
        ],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      })
    );

    const metadata = data.metadata;

    if (metadata.blueprintId) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Blueprint ID: ',
              bold: true,
              color: this.brandIndigo,
              size: 22,
            }),
            new TextRun({
              text: metadata.blueprintId,
              color: this.textPrimary,
              size: 22,
            }),
          ],
          spacing: { after: 100 },
        })
      );
    }

    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'Generated: ',
            bold: true,
            color: this.brandIndigo,
            size: 22,
          }),
          new TextRun({
            text: new Date(metadata.exportedAt).toLocaleString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }),
            color: this.textPrimary,
            size: 22,
          }),
        ],
        spacing: { after: 100 },
      })
    );

    return paragraphs;
  }

  /**
   * Create sophisticated branded heading with modern styling
   */
  private createBrandedHeading(
    text: string,
    level:
      | typeof HeadingLevel.HEADING_1
      | typeof HeadingLevel.HEADING_2
      | typeof HeadingLevel.HEADING_3 = HeadingLevel.HEADING_1,
    pageBreakBefore: boolean = false
  ): Paragraph {
    const getSize = (lvl: string): number => {
      switch (lvl) {
        case HeadingLevel.HEADING_1:
          return 40;
        case HeadingLevel.HEADING_2:
          return 32;
        case HeadingLevel.HEADING_3:
          return 26;
        default:
          return 24;
      }
    };

    const getColor = (lvl: string): string => {
      switch (lvl) {
        case HeadingLevel.HEADING_1:
          return this.brandTeal;
        case HeadingLevel.HEADING_2:
          return this.brandTealLight;
        case HeadingLevel.HEADING_3:
          return this.brandIndigo;
        default:
          return this.brandTeal;
      }
    };

    const getBackgroundColor = (lvl: string): string => {
      switch (lvl) {
        case HeadingLevel.HEADING_1:
          return this.darkBg;
        case HeadingLevel.HEADING_2:
          return this.paperBg;
        case HeadingLevel.HEADING_3:
          return this.surfaceBg;
        default:
          return this.darkBg;
      }
    };

    return new Paragraph({
      children: [
        new TextRun({
          text,
          bold: true,
          size: getSize(level),
          color: getColor(level),
          font: 'Quicksand',
          allCaps: level === HeadingLevel.HEADING_1,
        }),
      ],
      heading: level,
      pageBreakBefore,
      spacing: { before: level === HeadingLevel.HEADING_1 ? 400 : 200, after: 200 },
      shading: {
        type: ShadingType.SOLID,
        color: getBackgroundColor(level),
        fill: getBackgroundColor(level),
      },
      border: {
        bottom: {
          color: level === HeadingLevel.HEADING_1 ? this.brandTeal : this.brandIndigo,
          space: 1,
          style: BorderStyle.SINGLE,
          size: level === HeadingLevel.HEADING_1 ? 6 : 4,
        },
        left: {
          color: level === HeadingLevel.HEADING_1 ? this.brandTeal : this.brandIndigo,
          space: 1,
          style: BorderStyle.SINGLE,
          size: 8,
        },
      },
    });
  }

  /**
   * Create elegant section divider with geometric pattern
   */
  private createSectionDivider(title?: string): Paragraph[] {
    const paragraphs: Paragraph[] = [];

    // Decorative geometric pattern
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: '◊ ◊ ◊',
            size: 20,
            color: this.brandTeal,
            font: 'Lato',
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 300, after: 100 },
      })
    );

    if (title) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: title,
              bold: true,
              size: 18,
              color: this.brandIndigo,
              font: 'Quicksand',
              allCaps: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 50, after: 100 },
        })
      );
    }

    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: '◊ ◊ ◊',
            size: 20,
            color: this.brandTeal,
            font: 'Lato',
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 100, after: 300 },
      })
    );

    return paragraphs;
  }

  /**
   * Create full blueprint content with branded styling
   */
  private createFullBlueprintContent(blueprint: any): Paragraph[] {
    const paragraphs: Paragraph[] = [];

    // Executive Summary
    if (blueprint.executive_summary) {
      paragraphs.push(this.createBrandedHeading('Executive Summary', HeadingLevel.HEADING_1, true));
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'A comprehensive overview of the learning blueprint strategy and implementation approach.',
              size: 18,
              color: this.textSecondary,
              font: 'Lato',
              italics: true,
            }),
          ],
          alignment: AlignmentType.LEFT,
          spacing: { before: 100, after: 200 },
        })
      );
      paragraphs.push(...this.parseMarkdown(blueprint.executive_summary.content || ''));
    }

    // Learning Objectives
    if (blueprint.learning_objectives?.objectives) {
      paragraphs.push(
        this.createBrandedHeading('Learning Objectives', HeadingLevel.HEADING_1, true)
      );
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Measurable outcomes that define success for this learning initiative.',
              size: 18,
              color: this.textSecondary,
              font: 'Lato',
              italics: true,
            }),
          ],
          alignment: AlignmentType.LEFT,
          spacing: { before: 100, after: 200 },
        })
      );

      blueprint.learning_objectives.objectives.forEach((obj: any, index: number) => {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${index + 1}. `,
                bold: true,
                size: 24,
                color: this.brandIndigo,
              }),
              new TextRun({
                text: obj.title,
                bold: true,
                size: 24,
                color: this.brandTeal,
              }),
            ],
            spacing: { before: 200, after: 100 },
          })
        );

        if (obj.description) {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: obj.description,
                  color: this.textPrimary,
                  size: 20,
                  font: 'Lato',
                }),
              ],
              spacing: { before: 50, after: 150 },
              indent: { left: 720 }, // Indent for better readability
            })
          );
        }

        // Create a metrics table for better visual presentation
        if (obj.metric || obj.target || obj.baseline) {
          const metricRows = [];

          if (obj.metric) {
            metricRows.push(
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 40, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: 'Success Metric',
                            bold: true,
                            size: 18,
                            color: this.brandIndigo,
                          }),
                        ],
                        alignment: AlignmentType.LEFT,
                      }),
                    ],
                    shading: {
                      type: ShadingType.SOLID,
                      color: this.paperBg,
                      fill: this.paperBg,
                    },
                  }),
                  new TableCell({
                    width: { size: 60, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: obj.metric,
                            size: 18,
                            color: this.textPrimary,
                          }),
                        ],
                        alignment: AlignmentType.LEFT,
                      }),
                    ],
                    shading: {
                      type: ShadingType.SOLID,
                      color: this.paperBg,
                      fill: this.paperBg,
                    },
                  }),
                ],
              })
            );
          }

          if (obj.baseline && obj.target) {
            metricRows.push(
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 40, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: 'Progress',
                            bold: true,
                            size: 18,
                            color: this.brandIndigo,
                          }),
                        ],
                        alignment: AlignmentType.LEFT,
                      }),
                    ],
                    shading: {
                      type: ShadingType.SOLID,
                      color: this.surfaceBg,
                      fill: this.surfaceBg,
                    },
                  }),
                  new TableCell({
                    width: { size: 60, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: `${obj.baseline} → ${obj.target}`,
                            size: 18,
                            color: this.textPrimary,
                          }),
                        ],
                        alignment: AlignmentType.LEFT,
                      }),
                    ],
                    shading: {
                      type: ShadingType.SOLID,
                      color: this.surfaceBg,
                      fill: this.surfaceBg,
                    },
                  }),
                ],
              })
            );
          }

          // Create metrics table for better visual presentation
          if (obj.metric || obj.baseline || obj.target) {
            const metricTableRows = [];

            if (obj.metric) {
              metricTableRows.push(
                new TableRow({
                  children: [
                    new TableCell({
                      width: { size: 50, type: WidthType.PERCENTAGE },
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: 'Success Metric',
                              bold: true,
                              size: 20,
                              color: this.brandIndigo,
                            }),
                          ],
                          alignment: AlignmentType.LEFT,
                        }),
                      ],
                      shading: {
                        type: ShadingType.SOLID,
                        color: this.paperBg,
                        fill: this.paperBg,
                      },
                    }),
                    new TableCell({
                      width: { size: 50, type: WidthType.PERCENTAGE },
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: obj.metric,
                              size: 20,
                              color: this.textPrimary,
                            }),
                          ],
                          alignment: AlignmentType.LEFT,
                        }),
                      ],
                      shading: {
                        type: ShadingType.SOLID,
                        color: this.paperBg,
                        fill: this.paperBg,
                      },
                    }),
                  ],
                })
              );
            }

            if (obj.baseline || obj.target) {
              metricTableRows.push(
                new TableRow({
                  children: [
                    new TableCell({
                      width: { size: 50, type: WidthType.PERCENTAGE },
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: 'Progress',
                              bold: true,
                              size: 20,
                              color: this.brandIndigo,
                            }),
                          ],
                          alignment: AlignmentType.LEFT,
                        }),
                      ],
                      shading: {
                        type: ShadingType.SOLID,
                        color: this.surfaceBg,
                        fill: this.surfaceBg,
                      },
                    }),
                    new TableCell({
                      width: { size: 50, type: WidthType.PERCENTAGE },
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text:
                                obj.baseline && obj.target
                                  ? `${obj.baseline} → ${obj.target}`
                                  : obj.baseline || obj.target || 'Not specified',
                              size: 20,
                              color: this.textPrimary,
                            }),
                          ],
                          alignment: AlignmentType.LEFT,
                        }),
                      ],
                      shading: {
                        type: ShadingType.SOLID,
                        color: this.surfaceBg,
                        fill: this.surfaceBg,
                      },
                    }),
                  ],
                })
              );
            }

            // For now, use text-based metrics until proper table integration is implemented
            // TODO: Implement proper table structure that works with Word document format
            if (obj.metric) {
              paragraphs.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `Success Metric: ${obj.metric}`,
                      size: 18,
                      color: this.textPrimary,
                    }),
                  ],
                  spacing: { before: 50, after: 50 },
                })
              );
            }

            if (obj.baseline || obj.target) {
              paragraphs.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `Progress: ${obj.baseline && obj.target ? `${obj.baseline} → ${obj.target}` : obj.baseline || obj.target || 'Not specified'}`,
                      size: 18,
                      color: this.textPrimary,
                    }),
                  ],
                  spacing: { before: 50, after: 50 },
                })
              );
            }
          }

          paragraphs.push(
            new Paragraph({
              text: '',
              spacing: { before: 100, after: 200 },
            })
          );
        }
      });
    }

    // Target Audience
    if (blueprint.target_audience) {
      paragraphs.push(this.createBrandedHeading('Target Audience', HeadingLevel.HEADING_1, true));
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Understanding who will benefit from this learning experience and their unique characteristics.',
              size: 18,
              color: this.textSecondary,
              font: 'Lato',
              italics: true,
            }),
          ],
          alignment: AlignmentType.LEFT,
          spacing: { before: 100, after: 200 },
        })
      );

      if (blueprint.target_audience.demographics) {
        const demo = blueprint.target_audience.demographics;

        if (demo.roles?.length > 0) {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: '🎯 Primary Roles',
                  bold: true,
                  size: 22,
                  color: this.brandIndigo,
                  font: 'Quicksand',
                }),
              ],
              spacing: { before: 200, after: 100 },
            })
          );
          demo.roles.forEach((role: string, index: number) => {
            paragraphs.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${index + 1}. `,
                    bold: true,
                    size: 18,
                    color: this.brandTeal,
                  }),
                  new TextRun({
                    text: role,
                    size: 18,
                    color: this.textPrimary,
                    font: 'Lato',
                  }),
                ],
                spacing: { before: 50, after: 75 },
                indent: { left: 360 },
              })
            );
          });
        }

        if (demo.experience_levels?.length > 0) {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: '📊 Experience Distribution',
                  bold: true,
                  size: 22,
                  color: this.brandIndigo,
                  font: 'Quicksand',
                }),
              ],
              spacing: { before: 300, after: 100 },
            })
          );
          demo.experience_levels.forEach((level: string, index: number) => {
            paragraphs.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${index + 1}. `,
                    bold: true,
                    size: 18,
                    color: this.brandTeal,
                  }),
                  new TextRun({
                    text: level,
                    size: 18,
                    color: this.textPrimary,
                    font: 'Lato',
                  }),
                ],
                spacing: { before: 50, after: 75 },
                indent: { left: 360 },
              })
            );
          });
        }
      }

      // Learning preferences visualization
      if (blueprint.target_audience.learning_preferences) {
        const sectionDividers = this.createSectionDivider('Learning Preferences');
        paragraphs.push(...sectionDividers);

        const preferences = blueprint.target_audience.learning_preferences;
        if (preferences.modalities?.length > 0) {
          preferences.modalities.forEach((modality: any) => {
            paragraphs.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${modality.type}`,
                    bold: true,
                    size: 20,
                    color: this.brandTeal,
                    font: 'Quicksand',
                  }),
                ],
                spacing: { before: 150, after: 50 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: modality.rationale || 'Optimized for this learning style',
                    size: 16,
                    color: this.textSecondary,
                    font: 'Lato',
                  }),
                ],
                spacing: { before: 25, after: 100 },
                indent: { left: 360 },
              })
            );

            if (modality.allocation_percent) {
              paragraphs.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `Allocation: `,
                      bold: true,
                      size: 16,
                      color: this.brandIndigo,
                    }),
                    new TextRun({
                      text: `${modality.allocation_percent}%`,
                      size: 16,
                      color: this.textPrimary,
                    }),
                  ],
                  spacing: { before: 25, after: 150 },
                  indent: { left: 360 },
                })
              );
            }
          });
        }
      }
    }

    // Instructional Strategy
    if (blueprint.instructional_strategy) {
      paragraphs.push(
        this.createBrandedHeading('Instructional Strategy', HeadingLevel.HEADING_1, true)
      );
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'A comprehensive approach to delivering effective learning experiences.',
              size: 18,
              color: this.textSecondary,
              font: 'Lato',
              italics: true,
            }),
          ],
          alignment: AlignmentType.LEFT,
          spacing: { before: 100, after: 200 },
        })
      );

      if (blueprint.instructional_strategy.overview) {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: '📋 Strategic Overview',
                bold: true,
                size: 20,
                color: this.brandIndigo,
                font: 'Quicksand',
              }),
            ],
            spacing: { before: 150, after: 100 },
          })
        );
        paragraphs.push(...this.parseMarkdown(blueprint.instructional_strategy.overview));
      }

      if (blueprint.instructional_strategy.modalities?.length > 0) {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: '🎓 Learning Modalities',
                bold: true,
                size: 22,
                color: this.brandIndigo,
                font: 'Quicksand',
              }),
            ],
            spacing: { before: 300, after: 100 },
          })
        );

        blueprint.instructional_strategy.modalities.forEach((modality: any, index: number) => {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `${index + 1}. `,
                  bold: true,
                  size: 18,
                  color: this.brandTeal,
                }),
                new TextRun({
                  text: modality.type,
                  bold: true,
                  size: 18,
                  color: this.brandTeal,
                }),
              ],
              spacing: { before: 150, after: 75 },
            })
          );

          if (modality.rationale) {
            paragraphs.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: modality.rationale,
                    size: 16,
                    color: this.textPrimary,
                    font: 'Lato',
                  }),
                ],
                spacing: { before: 25, after: 75 },
                indent: { left: 360 },
              })
            );
          }

          if (modality.allocation_percent) {
            paragraphs.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: `📊 Time Allocation: `,
                    bold: true,
                    size: 16,
                    color: this.brandIndigo,
                  }),
                  new TextRun({
                    text: `${modality.allocation_percent}%`,
                    size: 16,
                    color: this.textPrimary,
                  }),
                ],
                spacing: { before: 25, after: 150 },
                indent: { left: 360 },
              })
            );
          }

          if (modality.tools?.length > 0) {
            paragraphs.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: `🛠️ Tools & Platforms: `,
                    bold: true,
                    size: 16,
                    color: this.brandIndigo,
                  }),
                  new TextRun({
                    text: modality.tools.join(', '),
                    size: 16,
                    color: this.textPrimary,
                  }),
                ],
                spacing: { before: 25, after: 150 },
                indent: { left: 360 },
              })
            );
          }
        });
      }

      if (blueprint.instructional_strategy.cohort_model) {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: '👥 Cohort Model',
                bold: true,
                size: 22,
                color: this.brandIndigo,
                font: 'Quicksand',
              }),
            ],
            spacing: { before: 300, after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: blueprint.instructional_strategy.cohort_model,
                size: 16,
                color: this.textPrimary,
                font: 'Lato',
              }),
            ],
            spacing: { before: 50, after: 150 },
            indent: { left: 360 },
          })
        );
      }

      if (blueprint.instructional_strategy.accessibility_considerations?.length > 0) {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: '♿ Accessibility Considerations',
                bold: true,
                size: 22,
                color: this.brandIndigo,
                font: 'Quicksand',
              }),
            ],
            spacing: { before: 300, after: 100 },
          })
        );
        blueprint.instructional_strategy.accessibility_considerations.forEach(
          (consideration: string) => {
            paragraphs.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: `✓ ${consideration}`,
                    size: 16,
                    color: this.textPrimary,
                    font: 'Lato',
                  }),
                ],
                spacing: { before: 25, after: 75 },
                indent: { left: 360 },
              })
            );
          }
        );
      }
    }

    // Content Outline
    if (blueprint.content_outline?.modules) {
      paragraphs.push(
        new Paragraph({
          text: 'Content Outline',
          heading: HeadingLevel.HEADING_1,
          pageBreakBefore: true,
          spacing: { after: 200 },
        })
      );

      blueprint.content_outline.modules.forEach((module: any, index: number) => {
        paragraphs.push(
          new Paragraph({
            text: `Module ${index + 1}: ${module.title}`,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          })
        );

        if (module.description) {
          paragraphs.push(
            new Paragraph({
              text: module.description,
              spacing: { after: 100 },
            })
          );
        }

        if (module.duration) {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({ text: 'Duration: ', bold: true }),
                new TextRun({ text: module.duration }),
              ],
              spacing: { after: 100 },
            })
          );
        }

        if (module.topics?.length > 0) {
          paragraphs.push(
            new Paragraph({
              children: [new TextRun({ text: 'Topics:', bold: true })],
              spacing: { before: 100, after: 50 },
            })
          );
          module.topics.forEach((topic: string) => {
            paragraphs.push(
              new Paragraph({
                text: `• ${topic}`,
                spacing: { after: 50 },
              })
            );
          });
        }

        if (module.learning_activities?.length > 0) {
          paragraphs.push(
            new Paragraph({
              children: [new TextRun({ text: 'Learning Activities:', bold: true })],
              spacing: { before: 100, after: 50 },
            })
          );
          module.learning_activities.forEach((activity: any) => {
            paragraphs.push(
              new Paragraph({
                text: `• ${activity.activity} (${activity.duration || 'Duration TBD'})`,
                spacing: { after: 50 },
              })
            );
          });
        }
      });
    }

    // Resources & Budget
    if (blueprint.resources) {
      paragraphs.push(
        new Paragraph({
          text: 'Resources & Budget',
          heading: HeadingLevel.HEADING_1,
          pageBreakBefore: true,
          spacing: { after: 200 },
        })
      );

      if (blueprint.resources.human_resources?.length > 0) {
        paragraphs.push(
          new Paragraph({
            text: 'Human Resources',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 100, after: 100 },
          })
        );

        blueprint.resources.human_resources.forEach((resource: any) => {
          paragraphs.push(
            new Paragraph({
              text: `• ${resource.role} - ${resource.fte} FTE for ${resource.duration}`,
              spacing: { after: 50 },
            })
          );
        });
      }

      if (blueprint.resources.budget) {
        paragraphs.push(
          new Paragraph({
            text: 'Budget',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          })
        );

        const budget = blueprint.resources.budget;
        if (budget.items?.length > 0) {
          budget.items.forEach((item: any) => {
            paragraphs.push(
              new Paragraph({
                text: `• ${item.item}: ${budget.currency || 'USD'} ${item.amount.toLocaleString()}`,
                spacing: { after: 50 },
              })
            );
          });
        }

        if (budget.total) {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({ text: 'Total Budget: ', bold: true }),
                new TextRun({
                  text: `${budget.currency || 'USD'} ${budget.total.toLocaleString()}`,
                  bold: true,
                }),
              ],
              spacing: { before: 100 },
            })
          );
        }
      }
    }

    // Assessment Strategy
    if (blueprint.assessment_strategy) {
      paragraphs.push(
        new Paragraph({
          text: 'Assessment Strategy',
          heading: HeadingLevel.HEADING_1,
          pageBreakBefore: true,
          spacing: { after: 200 },
        })
      );

      if (blueprint.assessment_strategy.overview) {
        paragraphs.push(...this.parseMarkdown(blueprint.assessment_strategy.overview));
      }

      if (blueprint.assessment_strategy.kpis?.length > 0) {
        paragraphs.push(
          new Paragraph({
            text: 'Key Performance Indicators',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          })
        );

        blueprint.assessment_strategy.kpis.forEach((kpi: any) => {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({ text: `${kpi.metric}: `, bold: true }),
                new TextRun({ text: `Target ${kpi.target}` }),
              ],
              spacing: { after: 50 },
            })
          );

          if (kpi.measurement_method) {
            paragraphs.push(
              new Paragraph({
                text: `  Measurement: ${kpi.measurement_method}`,
                spacing: { after: 50 },
              })
            );
          }
        });
      }
    }

    // Implementation Timeline
    if (blueprint.implementation_timeline?.phases) {
      paragraphs.push(
        new Paragraph({
          text: 'Implementation Timeline',
          heading: HeadingLevel.HEADING_1,
          pageBreakBefore: true,
          spacing: { after: 200 },
        })
      );

      blueprint.implementation_timeline.phases.forEach((phase: any) => {
        paragraphs.push(
          new Paragraph({
            text: phase.phase,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          })
        );

        if (phase.start_date && phase.end_date) {
          const startDate = new Date(phase.start_date).toLocaleDateString();
          const endDate = new Date(phase.end_date).toLocaleDateString();
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({ text: 'Timeline: ', bold: true }),
                new TextRun({ text: `${startDate} to ${endDate}` }),
              ],
              spacing: { after: 100 },
            })
          );
        }

        if (phase.milestones?.length > 0) {
          paragraphs.push(
            new Paragraph({
              children: [new TextRun({ text: 'Milestones:', bold: true })],
              spacing: { before: 100, after: 50 },
            })
          );
          phase.milestones.forEach((milestone: string) => {
            paragraphs.push(
              new Paragraph({
                text: `• ${milestone}`,
                spacing: { after: 50 },
              })
            );
          });
        }
      });
    }

    // Risk Mitigation
    if (blueprint.risk_mitigation?.risks) {
      paragraphs.push(
        new Paragraph({
          text: 'Risk Mitigation',
          heading: HeadingLevel.HEADING_1,
          pageBreakBefore: true,
          spacing: { after: 200 },
        })
      );

      blueprint.risk_mitigation.risks.forEach((risk: any) => {
        paragraphs.push(
          new Paragraph({
            children: [new TextRun({ text: risk.risk, bold: true })],
            spacing: { before: 100, after: 50 },
          }),
          new Paragraph({
            text: `Probability: ${risk.probability} | Impact: ${risk.impact}`,
            spacing: { after: 50 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Mitigation: ', bold: true }),
              new TextRun({ text: risk.mitigation_strategy }),
            ],
            spacing: { after: 100 },
          })
        );
      });
    }

    // Success Metrics
    if (blueprint.success_metrics?.metrics) {
      paragraphs.push(
        new Paragraph({
          text: 'Success Metrics',
          heading: HeadingLevel.HEADING_1,
          pageBreakBefore: true,
          spacing: { after: 200 },
        })
      );

      blueprint.success_metrics.metrics.forEach((metric: any) => {
        paragraphs.push(
          new Paragraph({
            children: [new TextRun({ text: metric.metric, bold: true })],
            spacing: { before: 100, after: 50 },
          }),
          new Paragraph({
            text: `Baseline: ${metric.current_baseline} → Target: ${metric.target}`,
            spacing: { after: 50 },
          })
        );

        if (metric.measurement_method) {
          paragraphs.push(
            new Paragraph({
              text: `Measurement: ${metric.measurement_method}`,
              spacing: { after: 50 },
            })
          );
        }

        if (metric.timeline) {
          paragraphs.push(
            new Paragraph({
              text: `Timeline: ${metric.timeline}`,
              spacing: { after: 100 },
            })
          );
        }
      });
    }

    // Sustainability Plan
    if (blueprint.sustainability_plan?.content) {
      paragraphs.push(
        new Paragraph({
          text: 'Sustainability Plan',
          heading: HeadingLevel.HEADING_1,
          pageBreakBefore: true,
          spacing: { after: 200 },
        })
      );
      paragraphs.push(...this.parseMarkdown(blueprint.sustainability_plan.content));
    }

    return paragraphs;
  }

  /**
   * Create simple blueprint content
   */
  private createSimpleBlueprintContent(blueprint: any): Paragraph[] {
    const paragraphs: Paragraph[] = [];

    // Title
    if (blueprint.title) {
      paragraphs.push(
        new Paragraph({
          text: blueprint.title,
          heading: HeadingLevel.HEADING_1,
          pageBreakBefore: true,
          spacing: { after: 200 },
        })
      );
    }

    // Overview
    if (blueprint.overview) {
      paragraphs.push(...this.parseMarkdown(blueprint.overview));
    }

    return paragraphs;
  }

  /**
   * Create dashboard section
   */
  private createDashboardSection(dashboardData: any): Paragraph[] {
    const paragraphs: Paragraph[] = [];

    paragraphs.push(
      new Paragraph({
        text: 'Analytics Dashboard',
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 200 },
      })
    );

    // Add dashboard summary
    paragraphs.push(
      new Paragraph({
        text: 'Key Metrics Summary',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 },
      })
    );

    // You can expand this based on your dashboard data structure
    if (dashboardData.metrics) {
      Object.entries(dashboardData.metrics).forEach(([key, value]) => {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${key}: `, bold: true }),
              new TextRun({ text: String(value) }),
            ],
            spacing: { after: 50 },
          })
        );
      });
    }

    return paragraphs;
  }

  /**
   * Parse simple markdown to Word paragraphs
   * Supports: headings, bold, italic, lists
   */
  public parseMarkdown(markdown: string): Paragraph[] {
    const paragraphs: Paragraph[] = [];
    const lines = markdown.split('\n');

    for (const line of lines) {
      if (!line.trim()) {
        paragraphs.push(
          new Paragraph({
            text: '',
            spacing: { after: 100 },
          })
        );
        continue;
      }

      // Handle headings
      if (line.startsWith('# ')) {
        paragraphs.push(
          new Paragraph({
            text: line.substring(2),
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 200, after: 100 },
          })
        );
      } else if (line.startsWith('## ')) {
        paragraphs.push(
          new Paragraph({
            text: line.substring(3),
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 150, after: 100 },
          })
        );
      } else if (line.startsWith('### ')) {
        paragraphs.push(
          new Paragraph({
            text: line.substring(4),
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 100, after: 50 },
          })
        );
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        // Handle lists
        paragraphs.push(
          new Paragraph({
            text: line.substring(2),
            bullet: {
              level: 0,
            },
            spacing: { after: 50 },
          })
        );
      } else if (/^\d+\.\s/.test(line)) {
        // Handle numbered lists
        const text = line.replace(/^\d+\.\s/, '');
        paragraphs.push(
          new Paragraph({
            text,
            numbering: {
              reference: 'default-numbering',
              level: 0,
            },
            spacing: { after: 50 },
          })
        );
      } else {
        // Regular paragraph with inline formatting
        const textRuns = this.parseInlineFormatting(line);
        paragraphs.push(
          new Paragraph({
            children: textRuns,
            spacing: { after: 100 },
          })
        );
      }
    }

    return paragraphs;
  }

  /**
   * Parse inline markdown formatting (bold, italic)
   */
  private parseInlineFormatting(text: string): TextRun[] {
    const runs: TextRun[] = [];
    const regex = /(\*\*|__)(.*?)\1|(\*|_)(.*?)\3|([^*_]+)/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match[2]) {
        // Bold
        runs.push(new TextRun({ text: match[2], bold: true }));
      } else if (match[4]) {
        // Italic
        runs.push(new TextRun({ text: match[4], italics: true }));
      } else if (match[5]) {
        // Regular text
        runs.push(new TextRun({ text: match[5] }));
      }
    }

    return runs.length > 0 ? runs : [new TextRun({ text })];
  }
}
