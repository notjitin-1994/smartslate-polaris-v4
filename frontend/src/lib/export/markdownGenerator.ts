import { AnyBlueprint, isFullBlueprint } from '@/lib/ollama/schema';
import { DashboardData } from '@/types/dashboard';
import { ExportData, ExportOptions, ExportMetadata } from './types';

export class MarkdownGenerator {
  /**
   * Generate Markdown content from blueprint data
   */
  generateMarkdown(data: ExportData, options: ExportOptions): string {
    const { blueprint, dashboardData, metadata } = data;

    let markdown = '';

    // Add front matter
    markdown += this.generateFrontMatter(metadata);

    // Add title and overview
    markdown += this.generateHeader(blueprint, metadata);

    // Add learning objectives
    markdown += this.generateLearningObjectives(blueprint);

    // Add modules section
    markdown += this.generateModules(blueprint);

    // Add timeline if available
    if (blueprint.timeline) {
      if (Array.isArray(blueprint.timeline)) {
        markdown += this.generateTimelineArray(blueprint.timeline);
      } else {
        markdown += this.generateTimeline(blueprint.timeline as Record<string, string>);
      }
    }

    // Add resources section
    if (blueprint.resources) {
      if (Array.isArray(blueprint.resources)) {
        markdown += this.generateResourcesArray(blueprint.resources);
      } else {
        markdown += this.generateResources(
          blueprint.resources as Array<{ name: string; type: string; url?: string }>
        );
      }
    }

    // Add dashboard analytics if available
    if (options.includeCharts && dashboardData) {
      markdown += this.generateDashboardAnalytics(dashboardData);
    }

    // Add footer
    markdown += this.generateFooter(metadata);

    return markdown;
  }

  /**
   * Generate front matter metadata
   */
  private generateFrontMatter(metadata: ExportMetadata): string {
    return `---
title: "${this.escapeMarkdown(metadata.title)}"
description: "${this.escapeMarkdown(metadata.description || '')}"
author: "${this.escapeMarkdown(metadata.author || 'Unknown')}"
created: ${metadata.createdAt}
exported: ${metadata.exportedAt}
version: ${metadata.version}
${metadata.blueprintId ? `blueprint_id: ${metadata.blueprintId}` : ''}
---

`;
  }

  /**
   * Generate header section
   */
  private generateHeader(blueprint: AnyBlueprint, metadata: ExportMetadata): string {
    if (isFullBlueprint(blueprint)) {
      const title = blueprint.metadata?.organization
        ? `${blueprint.metadata.organization} Learning Blueprint`
        : 'Learning Blueprint';
      const parts: string[] = [];
      if (blueprint.metadata?.role) parts.push(`Role: ${blueprint.metadata.role}`);
      if (blueprint.instructional_strategy?.cohort_model)
        parts.push(`Cohort: ${blueprint.instructional_strategy.cohort_model}`);
      const overview = parts.join(' • ') || 'Auto-generated learning blueprint overview.';
      return `# ${this.escapeMarkdown(title)}

${this.escapeMarkdown(overview)}

---
`;
    }
    // Fallback to canonical blueprint
    const canonical = blueprint as any;
    return `# ${this.escapeMarkdown(canonical.title)}

${this.escapeMarkdown(canonical.overview)}

---
`;
  }

  /**
   * Generate learning objectives section
   */
  private generateLearningObjectives(blueprint: AnyBlueprint): string {
    if (isFullBlueprint(blueprint)) {
      let markdown = '## Learning Objectives\n\n';
      const objs = Array.isArray(blueprint.objectives) ? blueprint.objectives : [];
      if (objs.length === 0) {
        markdown += '1. Define measurable learning objectives\n\n---\n\n';
        return markdown;
      }
      objs.forEach((o, index) => {
        markdown += `${index + 1}. ${this.escapeMarkdown(o.title)}\n`;
      });
      markdown += '\n---\n\n';
      return markdown;
    }
    let markdown = '## Learning Objectives\n\n';

    (blueprint as any).learningObjectives.forEach((objective: string, index: number) => {
      markdown += `${index + 1}. ${this.escapeMarkdown(objective)}\n`;
    });

    markdown += '\n---\n\n';
    return markdown;
  }

  /**
   * Generate modules section
   */
  private generateModules(blueprint: AnyBlueprint): string {
    if (isFullBlueprint(blueprint)) {
      let markdown = '## Learning Modules\n\n';
      const outline = Array.isArray(blueprint.content_outline) ? blueprint.content_outline : [];
      outline.forEach((m, index) => {
        markdown += `### ${index + 1}. ${this.escapeMarkdown(m.title)}\n\n`;
        markdown += `**Duration:** ${this.escapeMarkdown(m.duration)}\n\n`;
        markdown += `**Topics:**\n`;
        (Array.isArray(m.topics) ? m.topics : []).forEach((topic: string) => {
          markdown += `- ${this.escapeMarkdown(topic)}\n`;
        });
        markdown += '\n';
        markdown += `**Delivery:** ${this.escapeMarkdown(m.delivery_method)}\n\n`;
        if (Array.isArray(m.prerequisites) && m.prerequisites.length > 0) {
          markdown += `**Prerequisites:**\n`;
          m.prerequisites.forEach((p: string) => {
            markdown += `- ${this.escapeMarkdown(p)}\n`;
          });
          markdown += '\n';
        }
        markdown += '---\n\n';
      });
      return markdown;
    }
    let markdown = '## Learning Modules\n\n';

    (blueprint as any).modules.forEach((module: any, index: number) => {
      markdown += `### ${index + 1}. ${this.escapeMarkdown(module.title)}\n\n`;
      markdown += `**Duration:** ${module.duration} hours\n\n`;

      // Topics
      markdown += `**Topics:**\n`;
      module.topics.forEach((topic: string) => {
        markdown += `- ${this.escapeMarkdown(topic)}\n`;
      });
      markdown += '\n';

      // Activities
      if (module.activities.length > 0) {
        markdown += `**Activities:**\n`;
        module.activities.forEach((activity: string) => {
          markdown += `- ${this.escapeMarkdown(activity)}\n`;
        });
        markdown += '\n';
      }

      // Assessments
      if (module.assessments.length > 0) {
        markdown += `**Assessments:**\n`;
        module.assessments.forEach((assessment: string) => {
          markdown += `- ${this.escapeMarkdown(assessment)}\n`;
        });
        markdown += '\n';
      }

      markdown += '---\n\n';
    });

    return markdown;
  }

  /**
   * Generate timeline section
   */
  private generateTimeline(timeline: Record<string, string>): string {
    let markdown = '## Timeline\n\n';

    const timelineEntries = Object.entries(timeline);
    if (timelineEntries.length === 0) {
      markdown += '*No timeline information available.*\n\n';
      return markdown;
    }

    markdown += '| Week | Description |\n';
    markdown += '|------|-------------|\n';

    timelineEntries.forEach(([week, description]) => {
      markdown += `| ${this.escapeMarkdown(week)} | ${this.escapeMarkdown(description)} |\n`;
    });

    markdown += '\n---\n\n';
    return markdown;
  }

  /**
   * Generate timeline array section
   */
  private generateTimelineArray(timeline: any[]): string {
    let markdown = '## Timeline\n\n';

    if (timeline.length === 0) {
      markdown += '*No timeline information available.*\n\n';
      return markdown;
    }

    markdown += '| Phase | Duration | Description |\n';
    markdown += '|-------|----------|-------------|\n';

    timeline.forEach((item) => {
      markdown += `| ${this.escapeMarkdown(item.phase)} | ${this.escapeMarkdown(item.duration)} | ${this.escapeMarkdown(item.description || '')} |\n`;
    });

    markdown += '\n---\n\n';
    return markdown;
  }

  /**
   * Generate resources section
   */
  private generateResources(
    resources: Array<{ name: string; type: string; url?: string }>
  ): string {
    let markdown = '## Resources\n\n';

    if (resources.length === 0) {
      markdown += '*No resources available.*\n\n';
      return markdown;
    }

    markdown += '| Name | Type | URL |\n';
    markdown += '|------|------|-----|\n';

    resources.forEach((resource) => {
      const url = resource.url ? `[${this.escapeMarkdown(resource.url)}](${resource.url})` : 'N/A';
      markdown += `| ${this.escapeMarkdown(resource.name)} | ${this.escapeMarkdown(resource.type)} | ${url} |\n`;
    });

    markdown += '\n---\n\n';
    return markdown;
  }

  /**
   * Generate resources array section
   */
  private generateResourcesArray(resources: any[]): string {
    let markdown = '## Resources\n\n';

    if (resources.length === 0) {
      markdown += '*No resources available.*\n\n';
      return markdown;
    }

    markdown += '| Name | Type | Description |\n';
    markdown += '|------|------|-------------|\n';

    resources.forEach((resource) => {
      markdown += `| ${this.escapeMarkdown(resource.name)} | ${this.escapeMarkdown(resource.type)} | ${this.escapeMarkdown(resource.description || '')} |\n`;
    });

    markdown += '\n---\n\n';
    return markdown;
  }

  /**
   * Generate dashboard analytics section
   */
  private generateDashboardAnalytics(dashboardData: DashboardData): string {
    let markdown = '## Dashboard Analytics\n\n';

    // KPIs
    markdown += '### Key Performance Indicators\n\n';
    markdown += `- **Total Learning Hours:** ${dashboardData.kpis.totalLearningHours}\n`;
    markdown += `- **Total Modules:** ${dashboardData.kpis.totalModules}\n`;
    markdown += `- **Completed Modules:** ${dashboardData.kpis.completedModules}\n`;
    markdown += `- **Total Assessments:** ${dashboardData.kpis.totalAssessments}\n`;
    markdown += `- **Completed Assessments:** ${dashboardData.kpis.completedAssessments}\n`;
    markdown += `- **Total Resources:** ${dashboardData.kpis.totalResources}\n`;
    markdown += `- **Estimated Completion Date:** ${dashboardData.kpis.estimatedCompletionDate}\n\n`;

    // Module breakdown
    if (dashboardData.modules.length > 0) {
      markdown += '### Module Progress\n\n';
      markdown += '| Module | Status | Progress | Estimated Hours |\n';
      markdown += '|--------|--------|----------|----------------|\n';

      dashboardData.modules.forEach((module) => {
        markdown += `| ${this.escapeMarkdown(module.title)} | ${module.status} | ${module.progressPercentage}% | ${module.estimatedHours} |\n`;
      });
      markdown += '\n';
    }

    // Activity distribution
    if (dashboardData.activities.length > 0) {
      markdown += '### Activity Distribution\n\n';
      markdown += '| Category | Hours | Percentage |\n';
      markdown += '|----------|-------|------------|\n';

      dashboardData.activities.forEach((activity) => {
        markdown += `| ${this.escapeMarkdown(activity.category)} | ${activity.hours} | ${activity.percentage}% |\n`;
      });
      markdown += '\n';
    }

    markdown += '---\n\n';
    return markdown;
  }

  /**
   * Generate footer
   */
  private generateFooter(metadata: ExportMetadata): string {
    return `---

*This document was generated on ${new Date(metadata.exportedAt).toLocaleDateString()} at ${new Date(metadata.exportedAt).toLocaleTimeString()}.*
*Version: ${metadata.version}*
`;
  }

  /**
   * Escape Markdown special characters
   */
  private escapeMarkdown(text: string): string {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/\*/g, '\\*')
      .replace(/_/g, '\\_')
      .replace(/`/g, '\\`')
      .replace(/\[/g, '\\[')
      .replace(/\]/g, '\\]')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
      .replace(/#/g, '\\#')
      .replace(/\+/g, '\\+')
      .replace(/-/g, '\\-')
      .replace(/\./g, '\\.')
      .replace(/!/g, '\\!')
      .replace(/\|/g, '\\|');
  }
}
