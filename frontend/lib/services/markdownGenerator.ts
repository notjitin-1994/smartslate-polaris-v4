import { Blueprint, AnyBlueprint, isFullBlueprint } from '@/lib/ollama/schema';

export class MarkdownGeneratorService {
  // Helper function to escape markdown special characters
  private escapeMarkdown(text: string): string {
    return text
      .replace(/\*/g, '\\*')
      .replace(/_/g, '\\_')
      .replace(/`/g, '\\`')
      .replace(/\[/g, '\\[')
      .replace(/\]/g, '\\]')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
      .replace(/\|/g, '\\|')
      .replace(/#/g, '\\#')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  public generateMarkdown(blueprint: AnyBlueprint): string {
    if (isFullBlueprint(blueprint)) {
      return this.generateMarkdownFromFull(blueprint);
    }
    let markdown = `# ${this.escapeMarkdown(blueprint.title)}\n\n`;

    markdown += `## Overview\n\n${this.escapeMarkdown(blueprint.overview)}\n\n`;

    markdown += `## Learning Objectives\n\n`;
    blueprint.learningObjectives.forEach((objective) => {
      markdown += `- ${this.escapeMarkdown(objective)}\n`;
    });
    markdown += `\n`;

    markdown += `## Modules\n\n`;
    blueprint.modules.forEach((module) => {
      markdown += `### ${this.escapeMarkdown(module.title)}\n\n`;
      markdown += `- **Duration:** ${module.duration} hours\n`;
      markdown += `- **Topics:** ${module.topics.map((topic) => this.escapeMarkdown(topic)).join(', ')}\n`;
      markdown += `- **Activities:** ${module.activities.map((activity) => this.escapeMarkdown(activity)).join(', ')}\n`;
      markdown += `- **Assessments:** ${module.assessments.map((assessment) => this.escapeMarkdown(assessment)).join(', ')}\n\n`;
    });

    if (blueprint.timeline && Object.keys(blueprint.timeline).length > 0) {
      markdown += `## Timeline\n\n`;
      markdown += `| Week/Phase | Description |\n`;
      markdown += `|---|---|\n`;
      for (const [key, value] of Object.entries(blueprint.timeline)) {
        markdown += `| ${this.escapeMarkdown(key)} | ${this.escapeMarkdown(value)} |\n`;
      }
      markdown += `\n`;
    }

    if (blueprint.resources && blueprint.resources.length > 0) {
      markdown += `## Resources\n\n`;
      blueprint.resources.forEach((resource) => {
        markdown += `- [${this.escapeMarkdown(resource.name)} (${this.escapeMarkdown(resource.type)})](${resource.url || '#'})\n`;
      });
      markdown += `\n`;
    }

    return markdown;
  }

  private generateMarkdownFromFull(blueprint: AnyBlueprint): string {
    const b = blueprint as any;
    const title = b.metadata?.organization
      ? `${b.metadata.organization} Learning Blueprint`
      : 'Learning Blueprint';
    let markdown = `# ${this.escapeMarkdown(title)}\n\n`;

    // Overview
    const overviewParts: string[] = [];
    if (b.metadata?.role) overviewParts.push(`Role: ${b.metadata.role}`);
    if (b.instructional_strategy?.cohort_model)
      overviewParts.push(`Cohort: ${b.instructional_strategy.cohort_model}`);
    if (Array.isArray(b.assessment?.kpis) && b.assessment.kpis.length) {
      overviewParts.push(`KPIs: ${b.assessment.kpis.map((k: any) => k.name).join(', ')}`);
    }
    const overview = overviewParts.join(' • ') || 'Auto-generated learning blueprint overview.';
    markdown += `## Overview\n\n${this.escapeMarkdown(overview)}\n\n`;

    // Learning Objectives
    const objectives = Array.isArray(b.objectives) ? b.objectives : [];
    markdown += `## Learning Objectives\n\n`;
    if (objectives.length === 0) {
      markdown += `- Define measurable learning objectives\n\n`;
    } else {
      for (const o of objectives) {
        markdown += `- ${this.escapeMarkdown(o.title || '')}\n`;
      }
      markdown += `\n`;
    }

    // Content Outline → Modules
    const outline = Array.isArray(b.content_outline) ? b.content_outline : [];
    markdown += `## Modules\n\n`;
    for (const m of outline) {
      markdown += `### ${this.escapeMarkdown(m.title)}\n\n`;
      markdown += `- **Duration:** ${this.escapeMarkdown(m.duration)}\n`;
      markdown += `- **Topics:** ${(Array.isArray(m.topics) ? m.topics : []).map((t: string) => this.escapeMarkdown(t)).join(', ')}\n`;
      markdown += `- **Delivery:** ${this.escapeMarkdown(m.delivery_method)}\n`;
      if (Array.isArray(m.prerequisites) && m.prerequisites.length) {
        markdown += `- **Prerequisites:** ${m.prerequisites.map((p: string) => this.escapeMarkdown(p)).join(', ')}\n`;
      }
      markdown += `\n`;
    }

    // Timeline
    const phases = b.timeline?.phases || [];
    if (Array.isArray(phases) && phases.length > 0) {
      markdown += `## Timeline\n\n`;
      markdown += `| Phase | Start | End |\n`;
      markdown += `|---|---|---|\n`;
      for (const p of phases) {
        markdown += `| ${this.escapeMarkdown(p.name)} | ${this.escapeMarkdown(p.start)} | ${this.escapeMarkdown(p.end)} |\n`;
      }
      markdown += `\n`;
    }

    // Resources
    const human = b.resources?.human || [];
    const tools = b.resources?.tools || [];
    const budget = b.resources?.budget || [];
    if ((human?.length || 0) + (tools?.length || 0) + (budget?.length || 0) > 0) {
      markdown += `## Resources\n\n`;
      for (const h of human)
        markdown += `- ${this.escapeMarkdown(h.role)}: ${this.escapeMarkdown(h.name)} (FTE: ${h.fte})\n`;
      for (const t of tools)
        markdown += `- ${this.escapeMarkdown(t.category)}: ${this.escapeMarkdown(t.name)}\n`;
      for (const bgt of budget)
        markdown += `- ${this.escapeMarkdown(bgt.item)}: ${this.escapeMarkdown(bgt.currency)} ${bgt.amount}\n`;
      markdown += `\n`;
    }

    // Assessment
    if (Array.isArray(b.assessment?.methods) && b.assessment.methods.length) {
      markdown += `## Assessment & Measurement\n\n`;
      for (const method of b.assessment.methods) markdown += `- ${this.escapeMarkdown(method)}\n`;
      markdown += `\n`;
    }

    // Implementation Roadmap
    const roadmap = Array.isArray(b.implementation_roadmap) ? b.implementation_roadmap : [];
    if (roadmap.length) {
      markdown += `## Implementation Roadmap\n\n`;
      for (const step of roadmap) {
        markdown += `- ${this.escapeMarkdown(step.step)} (Owner: ${this.escapeMarkdown(step.owner_role)})\n`;
      }
      markdown += `\n`;
    }

    // Dashboard & Visuals
    const infographics = Array.isArray(b.infographics) ? b.infographics : [];
    if (infographics.length) {
      markdown += `## Visualizations\n\n`;
      for (const g of infographics) {
        markdown += `- ${this.escapeMarkdown(g.title)} (${this.escapeMarkdown(g.type)})\n`;
      }
      markdown += `\n`;
    }

    return markdown;
  }
}

export const markdownGeneratorService = new MarkdownGeneratorService();
