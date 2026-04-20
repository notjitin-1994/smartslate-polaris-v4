import React from 'react';
import { InfographicSection } from '../InfographicSection';
import { MarkdownSection } from '../MarkdownSection';
import { TimelineSection } from '../TimelineSection';
import { TableSection } from '../TableSection';
import type { BlueprintJSON } from '../types';

// Minimal, focused renderer used by dashboard/presentation consumers
// Renders known sections based on their displayType with graceful fallbacks
export function renderSectionContent(
  sectionId: string,
  blueprint: BlueprintJSON,
  objectives: any[],
  modules: any[]
): React.ReactNode {
  const data: any = (blueprint as any)[sectionId] ?? {};
  const displayType: string = data.displayType || inferDisplayType(sectionId, data);

  switch (displayType) {
    case 'infographic':
      return <InfographicSection sectionKey={sectionId} data={data} />;
    case 'timeline':
      return <TimelineSection sectionKey={sectionId} data={data} />;
    case 'table':
      return <TableSection sectionKey={sectionId} data={data} />;
    case 'markdown':
    default:
      return <MarkdownSection sectionKey={sectionId} data={data} />;
  }
}

function inferDisplayType(
  sectionId: string,
  data: any
): 'infographic' | 'markdown' | 'timeline' | 'table' {
  // Heuristics based on section id and available fields
  if (sectionId === 'content_outline' && (data?.modules?.length ?? 0) > 0) return 'timeline';
  if (sectionId === 'implementation_timeline' && (data?.phases?.length ?? 0) > 0) return 'timeline';
  if (
    sectionId === 'resources' ||
    sectionId === 'risk_mitigation' ||
    'risks' in data ||
    'budget' in data
  )
    return 'table';
  if (
    sectionId === 'learning_objectives' ||
    sectionId === 'assessment_strategy' ||
    sectionId === 'success_metrics' ||
    sectionId === 'target_audience' ||
    'objectives' in data ||
    'kpis' in data ||
    'metrics' in data ||
    'demographics' in data
  )
    return 'infographic';
  if (sectionId === 'instructional_strategy' || 'modalities' in data) return 'infographic';
  if (
    sectionId === 'sustainability_plan' ||
    (data?.content && (data?.maintenance_schedule || data?.scaling_considerations))
  )
    return 'infographic';
  if (sectionId === 'executive_summary') return 'markdown';
  return 'markdown';
}
