/**
 * Blueprint to Markdown Conversion Service
 * Converts blueprint JSON to formatted markdown document
 */

import { formatSectionTitle, formatDate, formatCurrency } from '@/components/blueprint/utils';
import type { BlueprintJSON } from '@/components/blueprint/types';

/**
 * Convert blueprint JSON to markdown
 */
export function convertBlueprintToMarkdown(blueprint: BlueprintJSON): string {
  let md = '';

  // Title and Metadata
  md += `# ${blueprint.metadata.title}\n\n`;
  md += `**Organization:** ${blueprint.metadata.organization}\n\n`;
  md += `**Role:** ${blueprint.metadata.role}\n\n`;
  md += `**Generated:** ${formatDate(blueprint.metadata.generated_at)}\n\n`;
  md += `**Version:** ${blueprint.metadata.version}\n\n`;
  md += `---\n\n`;

  // Convert each section
  for (const [key, section] of Object.entries(blueprint)) {
    if (key === 'metadata' || key.startsWith('_')) continue;

    md += `## ${formatSectionTitle(key)}\n\n`;
    md += convertSectionToMarkdown(section);
    md += `\n---\n\n`;
  }

  return md;
}

/**
 * Convert individual section to markdown
 */
function convertSectionToMarkdown(section: any): string {
  if (!section) return '';

  // Handle content field
  if (section.content) {
    return `${section.content}\n\n`;
  }

  // Handle overview field
  if (section.overview) {
    return `${section.overview}\n\n`;
  }

  // Handle objectives
  if (section.objectives && Array.isArray(section.objectives)) {
    let md = '';
    section.objectives.forEach((obj: any, index: number) => {
      md += `### ${index + 1}. ${obj.title}\n\n`;
      md += `${obj.description}\n\n`;
      md += `**Metric:** ${obj.metric}\n\n`;
      md += `**Baseline:** ${obj.baseline} | **Target:** ${obj.target}\n\n`;
      md += `**Due Date:** ${formatDate(obj.due_date)}\n\n`;
    });
    return md;
  }

  // Handle modules
  if (section.modules && Array.isArray(section.modules)) {
    let md = '';
    section.modules.forEach((module: any, index: number) => {
      md += `### ${index + 1}. ${module.title}\n\n`;
      if (module.description) {
        md += `${module.description}\n\n`;
      }
      md += `**Duration:** ${module.duration}\n\n`;
      if (module.delivery_method) {
        md += `**Delivery Method:** ${module.delivery_method}\n\n`;
      }

      if (module.topics && module.topics.length > 0) {
        md += `**Topics:**\n\n`;
        module.topics.forEach((topic: string) => {
          md += `- ${topic}\n`;
        });
        md += '\n';
      }

      if (module.learning_activities && module.learning_activities.length > 0) {
        md += `**Learning Activities:**\n\n`;
        module.learning_activities.forEach((activity: any) => {
          if (typeof activity === 'string') {
            md += `- ${activity}\n`;
          } else {
            md += `- ${activity.type}: ${activity.activity} (${activity.duration})\n`;
          }
        });
        md += '\n';
      }

      if (module.assessment) {
        md += `**Assessment:**\n\n`;
        md += `- Type: ${module.assessment.type}\n`;
        if (module.assessment.description) {
          md += `- Description: ${module.assessment.description}\n`;
        }
        md += '\n';
      }
    });
    return md;
  }

  // Handle KPIs
  if (section.kpis && Array.isArray(section.kpis)) {
    let md = section.overview ? `${section.overview}\n\n### Key Performance Indicators\n\n` : '';

    md += '| Metric | Target | Measurement Method | Frequency |\n';
    md += '|--------|--------|-------------------|----------|\n';
    section.kpis.forEach((kpi: any) => {
      md += `| ${kpi.metric} | ${kpi.target} | ${kpi.measurement_method} | ${kpi.frequency} |\n`;
    });
    md += '\n';

    // Add evaluation methods if present
    if (section.evaluation_methods && section.evaluation_methods.length > 0) {
      md += '### Evaluation Methods\n\n';
      md += '| Method | Timing | Weight |\n';
      md += '|--------|--------|--------|\n';
      section.evaluation_methods.forEach((method: any) => {
        md += `| ${method.method} | ${method.timing} | ${method.weight} |\n`;
      });
      md += '\n';
    }

    return md;
  }

  // Handle metrics
  if (section.metrics && Array.isArray(section.metrics)) {
    let md = '| Metric | Current Baseline | Target | Measurement Method | Timeline |\n';
    md += '|--------|-----------------|--------|-------------------|----------|\n';
    section.metrics.forEach((metric: any) => {
      md += `| ${metric.metric} | ${metric.current_baseline} | ${metric.target} | ${metric.measurement_method} | ${metric.timeline} |\n`;
    });
    md += '\n';

    // Add reporting cadence if present
    if (section.reporting_cadence) {
      md += `**Reporting Cadence:** ${section.reporting_cadence}\n\n`;
    }

    // Add dashboard requirements if present
    if (section.dashboard_requirements && section.dashboard_requirements.length > 0) {
      md += '### Dashboard Requirements\n\n';
      section.dashboard_requirements.forEach((req: string) => {
        md += `- ${req}\n`;
      });
      md += '\n';
    }

    return md;
  }

  // Handle risks
  if (section.risks && Array.isArray(section.risks)) {
    let md = '| Risk | Probability | Impact | Mitigation Strategy |\n';
    md += '|------|-------------|--------|--------------------|\n';
    section.risks.forEach((risk: any) => {
      md += `| ${risk.risk} | ${risk.probability} | ${risk.impact} | ${risk.mitigation_strategy} |\n`;
    });
    md += '\n';

    // Add contingency plans if present
    if (section.contingency_plans && section.contingency_plans.length > 0) {
      md += '### Contingency Plans\n\n';
      section.contingency_plans.forEach((plan: string) => {
        md += `- ${plan}\n`;
      });
      md += '\n';
    }

    return md;
  }

  // Handle phases
  if (section.phases && Array.isArray(section.phases)) {
    let md = '';
    section.phases.forEach((phase: any) => {
      md += `### ${phase.phase}\n\n`;
      md += `**Period:** ${formatDate(phase.start_date)} - ${formatDate(phase.end_date)}\n\n`;
      if (phase.milestones && phase.milestones.length > 0) {
        md += `**Milestones:**\n\n`;
        phase.milestones.forEach((milestone: string) => {
          md += `- ${milestone}\n`;
        });
        md += '\n';
      }
    });
    return md;
  }

  // Handle resources
  if (section.human_resources || section.tools_and_platforms || section.budget) {
    let md = '';

    if (section.human_resources) {
      md += '### Human Resources\n\n';
      md += '| Role | FTE | Duration |\n';
      md += '|------|-----|----------|\n';
      section.human_resources.forEach((hr: any) => {
        md += `| ${hr.role} | ${hr.fte} | ${hr.duration} |\n`;
      });
      md += '\n';
    }

    if (section.tools_and_platforms) {
      md += '### Tools & Platforms\n\n';
      md += '| Category | Name | Cost Type |\n';
      md += '|----------|------|----------|\n';
      section.tools_and_platforms.forEach((tool: any) => {
        md += `| ${tool.category} | ${tool.name} | ${tool.cost_type} |\n`;
      });
      md += '\n';
    }

    if (section.budget) {
      md += '### Budget\n\n';
      if (section.budget.items) {
        md += '| Item | Amount |\n';
        md += '|------|--------|\n';
        section.budget.items.forEach((item: any) => {
          md += `| ${item.item} | ${formatCurrency(item.amount, section.budget.currency)} |\n`;
        });
        md += '\n';
      }
      md += `**Total Budget:** ${formatCurrency(section.budget.total, section.budget.currency)}\n\n`;
    }

    return md;
  }

  // Handle instructional strategy modalities
  if (section.modalities && Array.isArray(section.modalities)) {
    let md = section.overview ? `${section.overview}\n\n` : '';

    md += '### Learning Modalities\n\n';
    section.modalities.forEach((modality: any) => {
      md += `#### ${modality.type} (${modality.allocation_percent}%)\n\n`;
      md += `${modality.rationale}\n\n`;
      if (modality.tools && modality.tools.length > 0) {
        md += `**Tools:** ${modality.tools.join(', ')}\n\n`;
      }
    });

    if (section.cohort_model) {
      md += `### Cohort Model\n\n${section.cohort_model}\n\n`;
    }

    if (section.accessibility_considerations && section.accessibility_considerations.length > 0) {
      md += '### Accessibility Considerations\n\n';
      section.accessibility_considerations.forEach((consideration: string) => {
        md += `- ${consideration}\n`;
      });
      md += '\n';
    }

    return md;
  }

  // Handle target audience demographics
  if (section.demographics || section.learning_preferences) {
    let md = '';

    if (section.demographics) {
      md += '### Demographics\n\n';

      if (section.demographics.roles && section.demographics.roles.length > 0) {
        md += `**Roles:** ${section.demographics.roles.join(', ')}\n\n`;
      }

      if (
        section.demographics.experience_levels &&
        section.demographics.experience_levels.length > 0
      ) {
        md += `**Experience Levels:** ${section.demographics.experience_levels.join(', ')}\n\n`;
      }

      if (
        section.demographics.department_distribution &&
        section.demographics.department_distribution.length > 0
      ) {
        md += '**Department Distribution:**\n\n';
        md += '| Department | Percentage |\n';
        md += '|------------|------------|\n';
        section.demographics.department_distribution.forEach((dept: any) => {
          md += `| ${dept.department} | ${dept.percentage}% |\n`;
        });
        md += '\n';
      }
    }

    if (section.learning_preferences && section.learning_preferences.modalities) {
      md += '### Learning Preferences\n\n';
      md += '| Modality | Percentage |\n';
      md += '|----------|------------|\n';
      section.learning_preferences.modalities.forEach((pref: any) => {
        md += `| ${pref.type} | ${pref.percentage}% |\n`;
      });
      md += '\n';
    }

    return md;
  }

  // Handle sustainability plan
  if (section.maintenance_schedule || section.scaling_considerations) {
    let md = section.content ? `${section.content}\n\n` : '';

    if (section.maintenance_schedule) {
      md += '### Maintenance Schedule\n\n';
      md += `**Review Frequency:** ${section.maintenance_schedule.review_frequency}\n\n`;

      if (
        section.maintenance_schedule.update_triggers &&
        section.maintenance_schedule.update_triggers.length > 0
      ) {
        md += '**Update Triggers:**\n\n';
        section.maintenance_schedule.update_triggers.forEach((trigger: string) => {
          md += `- ${trigger}\n`;
        });
        md += '\n';
      }
    }

    if (section.scaling_considerations && section.scaling_considerations.length > 0) {
      md += '### Scaling Considerations\n\n';
      section.scaling_considerations.forEach((consideration: string) => {
        md += `- ${consideration}\n`;
      });
      md += '\n';
    }

    return md;
  }

  // Fallback: JSON stringify
  return `\`\`\`json\n${JSON.stringify(section, null, 2)}\n\`\`\`\n\n`;
}

/**
 * Export for use in API routes
 */
export const blueprintMarkdownConverter = {
  convertBlueprintToMarkdown,
};
