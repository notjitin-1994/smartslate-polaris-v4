import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  PageBreak,
  NumberFormat,
  ImageRun,
  Header,
  Footer,
} from 'docx';
import { ExportData, ExportOptions, ExportResult } from './types';
import { isFullBlueprint } from '@/lib/ollama/schema';

/**
 * Word Document Generator with Premium Brand Design
 * Features: Logo integration, dark background theme, rich formatting
 */
export class WordGenerator {
  // SmartSlate Brand Colors (from globals.css)
  private readonly brandTeal = 'A7DADB'; // Primary accent #a7dadb
  private readonly brandTealLight = 'D0EDF0'; // #d0edf0
  private readonly brandTealDark = '7BC5C7'; // #7bc5c7
  private readonly brandIndigo = '4F46E5'; // Secondary accent #4f46e5
  private readonly brandIndigoLight = '7C69F5'; // #7c69f5
  private readonly darkBg = '020C1B'; // Dark background
  private readonly paperBg = '0D1B2A'; // Paper background
  private readonly surfaceBg = '142433'; // Surface background
  private readonly textPrimary = 'E0E0E0'; // #e0e0e0
  private readonly textSecondary = 'B0C5C6'; // #b0c5c6

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

      // Add branded title page with logo
      sections.push(...this.createBrandedTitlePage(data));

      // Add page break
      sections.push(
        new Paragraph({
          children: [new PageBreak()],
        })
      );

      // Add metadata section if requested
      if (options.includeMetadata) {
        sections.push(...this.createMetadataSection(data));
      }

      // Add blueprint content
      if (isFullBlueprint(data.blueprint)) {
        sections.push(...this.createFullBlueprintContent(data.blueprint));
      } else {
        sections.push(...this.createSimpleBlueprintContent(data.blueprint));
      }

      // Add dashboard data if available and requested
      if (options.includeCharts && data.dashboardData) {
        sections.push(
          new Paragraph({
            children: [new PageBreak()],
          })
        );
        sections.push(...this.createDashboardSection(data.dashboardData));
      }

      // Create document with branded styling and headers/footers
      const doc = new Document({
        creator: 'SmartSlate',
        title: data.metadata.title,
        description: data.metadata.description,
        sections: [
          {
            properties: {
              page: {
                pageNumbers: {
                  start: 1,
                  formatType: NumberFormat.DECIMAL,
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
   * Create branded header
   */
  private createHeader(data: ExportData): Header {
    return new Header({
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text: 'SmartSlate',
              bold: true,
              color: this.brandTeal,
              size: 20,
            }),
            new TextRun({
              text: ' | Learning Blueprint',
              color: this.textSecondary,
              size: 20,
            }),
          ],
          alignment: AlignmentType.RIGHT,
          spacing: { after: 200 },
          border: {
            bottom: {
              color: this.brandTeal,
              space: 1,
              style: BorderStyle.SINGLE,
              size: 6,
            },
          },
        }),
      ],
    });
  }

  /**
   * Create branded footer
   */
  private createFooter(): Footer {
    return new Footer({
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text: 'Generated by SmartSlate | ',
              color: this.textSecondary,
              size: 18,
            }),
            new TextRun({
              text: 'smartslate.io',
              color: this.brandTeal,
              size: 18,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 200 },
          border: {
            top: {
              color: this.brandTeal,
              space: 1,
              style: BorderStyle.SINGLE,
              size: 6,
            },
          },
        }),
      ],
    });
  }

  /**
   * Create premium branded title page with logo and dark theme
   */
  private createBrandedTitlePage(data: ExportData): Paragraph[] {
    const paragraphs: Paragraph[] = [];

    // Add logo if available
    if (this.logoBase64) {
      paragraphs.push(
        new Paragraph({
          children: [
            new ImageRun({
              data: Uint8Array.from(atob(this.logoBase64), (c) => c.charCodeAt(0)),
              transformation: {
                width: 180,
                height: 180,
              },
              type: 'png',
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 400, after: 400 },
        })
      );
    }

    // SmartSlate branding
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'SmartSlate',
            bold: true,
            size: 32,
            color: this.brandTeal,
            font: 'Quicksand',
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      })
    );

    // Title with dark theme styling
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: data.metadata.title,
            bold: true,
            size: 48,
            color: this.textPrimary,
            font: 'Quicksand',
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 },
      })
    );

    // Subtitle/Description with accent
    if (data.metadata.description) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: data.metadata.description,
              size: 24,
              color: this.brandTealLight,
              font: 'Lato',
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        })
      );
    }

    // Decorative line
    paragraphs.push(
      new Paragraph({
        text: '',
        spacing: { before: 200, after: 200 },
        border: {
          bottom: {
            color: this.brandTeal,
            space: 1,
            style: BorderStyle.SINGLE,
            size: 12,
          },
        },
      })
    );

    // Metadata info with brand colors
    const createdDate = new Date(data.metadata.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'Created: ',
            bold: true,
            color: this.brandIndigo,
            size: 22,
          }),
          new TextRun({
            text: createdDate,
            color: this.textPrimary,
            size: 22,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: 'Version: ',
            bold: true,
            color: this.brandIndigo,
            size: 22,
          }),
          new TextRun({
            text: data.metadata.version,
            color: this.textPrimary,
            size: 22,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
      })
    );

    if (data.metadata.author) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Author: ',
              bold: true,
              color: this.brandIndigo,
              size: 22,
            }),
            new TextRun({
              text: data.metadata.author,
              color: this.textPrimary,
              size: 22,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
        })
      );
    }

    // Footer tagline
    paragraphs.push(
      new Paragraph({
        text: '',
        spacing: { before: 600 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: 'Powered by SmartSlate',
            italics: true,
            color: this.textSecondary,
            size: 20,
          }),
        ],
        alignment: AlignmentType.CENTER,
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
   * Create a branded heading with brand colors
   */
  private createBrandedHeading(
    text: string,
    level: HeadingLevel = HeadingLevel.HEADING_1,
    pageBreakBefore: boolean = false
  ): Paragraph {
    const getSize = (level: any): number => {
      switch (level) {
        case HeadingLevel.HEADING_1:
          return 36;
        case HeadingLevel.HEADING_2:
          return 28;
        case HeadingLevel.HEADING_3:
          return 24;
        default:
          return 24;
      }
    };

    const getColor = (level: any): string => {
      switch (level) {
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

    return new Paragraph({
      children: [
        new TextRun({
          text,
          bold: true,
          size: getSize(level),
          color: getColor(level),
          font: 'Quicksand',
        }),
      ],
      heading: level,
      pageBreakBefore,
      spacing: { before: 300, after: 200 },
      border: {
        bottom: {
          color: this.brandTeal,
          space: 1,
          style: BorderStyle.SINGLE,
          size: 4,
        },
      },
    });
  }

  /**
   * Create full blueprint content with branded styling
   */
  private createFullBlueprintContent(blueprint: any): Paragraph[] {
    const paragraphs: Paragraph[] = [];

    // Executive Summary
    if (blueprint.executive_summary) {
      paragraphs.push(this.createBrandedHeading('Executive Summary', HeadingLevel.HEADING_1, true));
      paragraphs.push(...this.parseMarkdown(blueprint.executive_summary.content || ''));
    }

    // Learning Objectives
    if (blueprint.learning_objectives?.objectives) {
      paragraphs.push(
        this.createBrandedHeading('Learning Objectives', HeadingLevel.HEADING_1, true)
      );

      blueprint.learning_objectives.objectives.forEach((obj: any, index: number) => {
        paragraphs.push(
          this.createBrandedHeading(`${index + 1}. ${obj.title}`, HeadingLevel.HEADING_2),
          new Paragraph({
            children: [
              new TextRun({
                text: obj.description || '',
                color: this.textPrimary,
                size: 22,
              }),
            ],
            spacing: { after: 100 },
          })
        );

        if (obj.metric) {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Success Metric: ',
                  bold: true,
                  color: this.brandIndigo,
                  size: 20,
                }),
                new TextRun({
                  text: obj.metric,
                  color: this.textPrimary,
                  size: 20,
                }),
              ],
              spacing: { after: 100 },
            })
          );
        }

        if (obj.target) {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Target: ',
                  bold: true,
                  color: this.brandIndigo,
                  size: 20,
                }),
                new TextRun({
                  text: obj.target,
                  color: this.textPrimary,
                  size: 20,
                }),
              ],
              spacing: { after: 100 },
            })
          );
        }
      });
    }

    // Target Audience
    if (blueprint.target_audience) {
      paragraphs.push(this.createBrandedHeading('Target Audience', HeadingLevel.HEADING_1, true));

      if (blueprint.target_audience.demographics) {
        const demo = blueprint.target_audience.demographics;

        if (demo.roles?.length > 0) {
          paragraphs.push(
            new Paragraph({
              children: [new TextRun({ text: 'Roles:', bold: true })],
              spacing: { before: 100, after: 50 },
            })
          );
          demo.roles.forEach((role: string) => {
            paragraphs.push(
              new Paragraph({
                text: `• ${role}`,
                spacing: { after: 50 },
              })
            );
          });
        }

        if (demo.experience_levels?.length > 0) {
          paragraphs.push(
            new Paragraph({
              children: [new TextRun({ text: 'Experience Levels:', bold: true })],
              spacing: { before: 100, after: 50 },
            })
          );
          demo.experience_levels.forEach((level: string) => {
            paragraphs.push(
              new Paragraph({
                text: `• ${level}`,
                spacing: { after: 50 },
              })
            );
          });
        }
      }
    }

    // Instructional Strategy
    if (blueprint.instructional_strategy) {
      paragraphs.push(
        new Paragraph({
          text: 'Instructional Strategy',
          heading: HeadingLevel.HEADING_1,
          pageBreakBefore: true,
          spacing: { after: 200 },
        })
      );

      if (blueprint.instructional_strategy.overview) {
        paragraphs.push(...this.parseMarkdown(blueprint.instructional_strategy.overview));
      }

      if (blueprint.instructional_strategy.modalities?.length > 0) {
        paragraphs.push(
          new Paragraph({
            text: 'Learning Modalities',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          })
        );

        blueprint.instructional_strategy.modalities.forEach((modality: any) => {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({ text: `${modality.type}: `, bold: true }),
                new TextRun({ text: modality.rationale || '' }),
              ],
              spacing: { after: 100 },
            })
          );

          if (modality.allocation_percent) {
            paragraphs.push(
              new Paragraph({
                text: `  Allocation: ${modality.allocation_percent}%`,
                spacing: { after: 50 },
              })
            );
          }
        });
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
  private parseMarkdown(markdown: string): Paragraph[] {
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
