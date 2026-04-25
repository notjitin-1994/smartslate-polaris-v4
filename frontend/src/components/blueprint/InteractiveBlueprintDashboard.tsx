'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import {
  Clock,
  BookOpen,
  Target,
  Layers,
  Maximize2,
  Minimize2,
  FileText,
  Leaf,
  Wand2,
  ChevronDown,
  Users,
  DollarSign,
  BarChart3,
  Calendar,
  Shield,
  TrendingUp,
  CheckCircle2,
  Edit,
} from 'lucide-react';
import { VisualJSONEditor } from '@/components/modals/VisualJSONEditor';
import { ObjectivesInfographic } from './infographics/ObjectivesInfographic';
import { TargetAudienceInfographic } from './infographics/TargetAudienceInfographic';
import { AssessmentStrategyInfographic } from './infographics/AssessmentStrategyInfographic';
import { SuccessMetricsInfographic } from './infographics/SuccessMetricsInfographic';
import { TimelineInfographic } from './infographics/TimelineInfographic';
import { RiskMitigationInfographic } from './infographics/RiskMitigationInfographic';
import { BudgetResourcesInfographic } from './infographics/BudgetResourcesInfographic';
import { ContentOutlineInfographic } from './infographics/ContentOutlineInfographic';
import { InstructionalStrategyInfographic } from './infographics/InstructionalStrategyInfographic';
import { SustainabilityPlanInfographic } from './infographics/SustainabilityPlanInfographic';
import { AdditionalDataInfographic } from './infographics/AdditionalDataInfographic';
import type { BlueprintJSON } from './types';
import { useRouter } from 'next/navigation';
import CountUp from 'react-countup';
import { useMobileDetect } from '@/lib/hooks/useMobileDetect';

interface InteractiveBlueprintDashboardProps {
  blueprint: BlueprintJSON;
  blueprintId: string;
  isPublicView?: boolean;
}

interface SectionDef {
  id: string;
  title: string;
  icon: React.ElementType;
  gradient: string;
  iconColor: string;
  description: string;
  defaultExpanded?: boolean;
}

/**
 * Helper function to format reporting cadence into a readable string
 */
function formatReportingCadence(cadence: string | Record<string, any> | undefined): string {
  if (!cadence) return '';

  // If it's already a string, return it
  if (typeof cadence === 'string') {
    return cadence;
  }

  // If it's an object, convert it to a readable format
  if (typeof cadence === 'object' && cadence !== null) {
    const frequencies: string[] = [];

    // Check each known reporting frequency field
    // Handle both boolean values and string descriptions
    const checkField = (field: string, label: string) => {
      if (cadence[field]) {
        // If the value is a string (description), use it; otherwise use the label
        if (typeof cadence[field] === 'string' && cadence[field] !== 'true') {
          frequencies.push(cadence[field]);
        } else {
          frequencies.push(label);
        }
      }
    };

    checkField('weekly_reports', 'Weekly');
    checkField('monthly_reports', 'Monthly');
    checkField('quarterly_reviews', 'Quarterly');
    checkField('annual_evaluation', 'Annual');
    checkField('real_time_dashboards', 'Real-time');

    // If we found any frequencies, join them
    if (frequencies.length > 0) {
      return frequencies.join(', ');
    }

    // Fallback: try to extract and format any keys from the object
    const keys = Object.keys(cadence).filter((k) => cadence[k] && typeof cadence[k] !== 'object');
    if (keys.length > 0) {
      const formatted = keys
        .map((k) => {
          // Convert snake_case to Title Case
          const value = cadence[k];
          // If the value is a descriptive string, use it
          if (
            typeof value === 'string' &&
            value.length > 1 &&
            value !== 'true' &&
            value !== 'false'
          ) {
            return value;
          }
          // Otherwise format the key name
          return k.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
        })
        .join(', ');

      return formatted || 'Regular';
    }
  }

  return 'Regular';
}

export function InteractiveBlueprintDashboard({
  blueprint,
  blueprintId,
  isPublicView = false,
}: InteractiveBlueprintDashboardProps): React.JSX.Element {
  const router = useRouter();
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [mounted, setMounted] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set() // All sections collapsed by default
  );
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const { shouldReduceAnimations } = useMobileDetect();

  // JSON Editor Modal State
  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [selectedSectionTitle, setSelectedSectionTitle] = useState<string>('');
  const [selectedSectionData, setSelectedSectionData] = useState<unknown>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Track animation state once to prevent flickering
  // Also set hasAnimated to true after a delay as fallback
  // Immediate for touch devices to ensure visibility
  useEffect(() => {
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    if (isTouchDevice || (isInView && !hasAnimated)) {
      setHasAnimated(true);
    }

    // Fallback: ensure hasAnimated is set after a short delay
    const fallbackTimer = setTimeout(
      () => {
        if (!hasAnimated) {
          setHasAnimated(true);
        }
      },
      isTouchDevice ? 100 : 1000
    );

    return () => clearTimeout(fallbackTimer);
  }, [isInView, hasAnimated]);

  // Extract data from blueprint
  const modules = blueprint.content_outline?.modules || [];
  const objectives = blueprint.learning_objectives?.objectives || [];
  const totalActivities = modules.reduce((sum, m) => sum + (m.learning_activities?.length || 0), 0);
  const totalTopics = modules.reduce((sum, m) => sum + (m.topics?.length || 0), 0);
  const totalDuration = modules.reduce((sum, module) => {
    const duration = module.duration || '';
    const weeks = duration.match(/(\d+)\s*(?:week|weeks|wk|w)\b/i);
    const days = duration.match(/(\d+)\s*(?:day|days|d)\b/i);
    const hours = duration.match(/(\d+)\s*(?:hour|hours|hr|h)\b/i);
    const minutes = duration.match(/(\d+)\s*(?:minute|minutes|min|m)\b/i);

    // Convert to learning hours (not calendar hours):
    // 1 week = 10 study hours, 1 day = 2 study hours
    const totalHours =
      (weeks ? parseInt(weeks[1]) * 10 : 0) +
      (days ? parseInt(days[1]) * 2 : 0) +
      (hours ? parseInt(hours[1]) : 0) +
      (minutes ? parseInt(minutes[1]) / 60 : 0);

    return sum + totalHours;
  }, 0);

  // Build sections array dynamically based on available data
  // Note: Executive Summary is now shown at top (non-collapsible), so excluded from sections
  const sections: SectionDef[] = [];

  if (blueprint.learning_objectives) {
    sections.push({
      id: 'learning_objectives',
      title: 'Learning Objectives',
      icon: Target,
      gradient: 'bg-success/20',
      iconColor: 'text-success',
      description: `${objectives.length} objectives to achieve • Target completion rates and KPIs defined`,
      defaultExpanded: true,
    });
  }

  if (blueprint.target_audience) {
    const demographics = blueprint.target_audience.demographics;
    const rolesCount = demographics?.roles?.length || 0;
    const learningPrefs = blueprint.target_audience.learning_preferences;
    const modalitiesCount = learningPrefs?.modalities?.length || 0;

    sections.push({
      id: 'target_audience',
      title: 'Target Audience',
      icon: Users,
      gradient: 'bg-secondary/20',
      iconColor: 'text-secondary',
      description: `${rolesCount} target roles • ${modalitiesCount} learning modalities • Demographics and preferences analyzed`,
    });
  }

  if (blueprint.assessment_strategy) {
    const kpis = blueprint.assessment_strategy.kpis || [];
    const evalMethods = blueprint.assessment_strategy.evaluation_methods || [];

    sections.push({
      id: 'assessment_strategy',
      title: 'Assessment Strategy',
      icon: BarChart3,
      gradient: 'bg-primary/20',
      iconColor: 'text-primary',
      description: `${kpis.length} KPIs defined • ${evalMethods.length} evaluation methods • Comprehensive measurement framework`,
    });
  }

  if (blueprint.content_outline) {
    sections.push({
      id: 'content_outline',
      title: 'Content Outline',
      icon: BookOpen,
      gradient: 'bg-primary/20',
      iconColor: 'text-primary',
      description: `${modules.length} comprehensive learning modules • ${totalActivities} activities • ${totalTopics} topics covered`,
    });
  }

  if (blueprint.instructional_strategy) {
    const modalities = blueprint.instructional_strategy.modalities || [];
    const accessibilityCount =
      blueprint.instructional_strategy.accessibility_considerations?.length || 0;

    sections.push({
      id: 'instructional_strategy',
      title: 'Instructional Strategy',
      icon: FileText,
      gradient: 'bg-primary/20',
      iconColor: 'text-primary',
      description: `${modalities.length} delivery modalities • ${accessibilityCount} accessibility considerations • Cohort model defined`,
    });
  }

  if (blueprint.resources) {
    const budget = blueprint.resources.budget;
    const budgetTotal = budget?.total || 0;
    const humanResources = blueprint.resources.human_resources || [];
    const tools = blueprint.resources.tools_and_platforms || [];

    sections.push({
      id: 'resources',
      title: 'Resources & Budget',
      icon: DollarSign,
      gradient: 'bg-success/20',
      iconColor: 'text-success',
      description: `${budgetTotal > 0 ? `${budget?.currency || 'USD'} ${budgetTotal.toLocaleString()} budget` : 'Budget analysis'} • ${humanResources.length} team roles • ${tools.length} platforms`,
    });
  }

  if (blueprint.implementation_timeline) {
    const phases = blueprint.implementation_timeline.phases || [];
    const totalMilestones = phases.reduce((sum, p) => sum + (p.milestones?.length || 0), 0);
    const criticalPath = blueprint.implementation_timeline.critical_path || [];

    sections.push({
      id: 'implementation_timeline',
      title: 'Implementation Timeline',
      icon: Calendar,
      gradient: 'bg-secondary/20',
      iconColor: 'text-secondary',
      description: `${phases.length} phases from start to finish • ${totalMilestones} milestones • ${criticalPath.length} critical path items`,
    });
  }

  if (blueprint.success_metrics) {
    const metrics = blueprint.success_metrics.metrics || [];
    const reportingCadence =
      formatReportingCadence(blueprint.success_metrics.reporting_cadence) || 'Not specified';

    sections.push({
      id: 'success_metrics',
      title: 'Success Metrics',
      icon: TrendingUp,
      gradient: 'bg-success/20',
      iconColor: 'text-success',
      description: `${metrics.length} success metrics tracked • ${reportingCadence} reporting • Performance dashboard requirements`,
    });
  }

  if (blueprint.risk_mitigation) {
    const risks = blueprint.risk_mitigation.risks || [];
    const contingencyPlans = blueprint.risk_mitigation.contingency_plans || [];
    const highImpactRisks = risks.filter((r) => r.impact?.toLowerCase() === 'high').length;

    sections.push({
      id: 'risk_mitigation',
      title: 'Risk Mitigation',
      icon: Shield,
      gradient: 'bg-warning/20',
      iconColor: 'text-warning',
      description: `${risks.length} risks identified and addressed • ${highImpactRisks} high-impact • ${contingencyPlans.length} contingency plans`,
    });
  }

  if (blueprint.sustainability_plan) {
    const maintenanceSchedule = blueprint.sustainability_plan.maintenance_schedule;
    const scalingConsiderations = blueprint.sustainability_plan.scaling_considerations || [];

    sections.push({
      id: 'sustainability_plan',
      title: 'Sustainability Plan',
      icon: Leaf,
      gradient: 'bg-success/20',
      iconColor: 'text-success',
      description: `${maintenanceSchedule?.review_frequency || 'Regular'} reviews • ${scalingConsiderations.length} scaling strategies • Long-term viability ensured`,
    });
  }

  // Detect additional/unknown sections in the blueprint JSON
  const knownSections = new Set([
    'metadata',
    'executive_summary',
    'learning_objectives',
    'target_audience',
    'instructional_strategy',
    'content_outline',
    'resources',
    'assessment_strategy',
    'implementation_timeline',
    'risk_mitigation',
    'success_metrics',
    'sustainability_plan',
  ]);

  // Sections to always exclude from display (even if present in blueprint)
  const excludedSections = new Set(['metadata', '_generation_metadata']);

  const additionalSections: Array<{ key: string; data: any }> = [];

  for (const [key, value] of Object.entries(blueprint)) {
    // Skip known sections and explicitly excluded sections (like metadata)
    if (
      !knownSections.has(key) &&
      !excludedSections.has(key) &&
      value &&
      typeof value === 'object'
    ) {
      additionalSections.push({ key, data: value });

      // Add to sections array for expandable section
      sections.push({
        id: key,
        title: key
          .replace(/([A-Z])/g, ' $1')
          .replace(/_/g, ' ')
          .split(' ')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ')
          .trim(),
        icon: Wand2, // Use magic wand icon for additional sections
        gradient: 'bg-primary/20',
        iconColor: 'text-primary',
        description: 'Additional data from starmap creation',
      });
    }
  }

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const scrollToSection = (sectionId: string) => {
    sectionRefs.current[sectionId]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (!expandedSections.has(sectionId)) {
      toggleSection(sectionId);
    }
  };

  const expandAll = () => {
    setExpandedSections(new Set(sections.map((s) => s.id)));
  };

  const collapseAll = () => {
    setExpandedSections(new Set());
  };

  // JSON Editor Modal Handlers
  const handleOpenEditor = (sectionId: string, sectionTitle: string) => {
    // Get the section data from blueprint based on section ID
    const sectionDataMap: Record<string, unknown> = {
      learning_objectives: blueprint.learning_objectives,
      target_audience: blueprint.target_audience,
      content_outline: blueprint.content_outline,
      resources: blueprint.resources,
      assessment_strategy: blueprint.assessment_strategy,
      implementation_timeline: blueprint.implementation_timeline,
      risk_mitigation: blueprint.risk_mitigation,
      success_metrics: blueprint.success_metrics,
      instructional_strategy: blueprint.instructional_strategy,
      sustainability_plan: blueprint.sustainability_plan,
    };

    // Add additional sections to the map
    for (const { key, data } of additionalSections) {
      sectionDataMap[key] = data;
    }

    const sectionData = sectionDataMap[sectionId];
    if (!sectionData) {
      console.error(`Section data not found for ID: ${sectionId}`);
      return;
    }

    setSelectedSectionId(sectionId);
    setSelectedSectionTitle(sectionTitle);
    setSelectedSectionData(sectionData);
    setIsEditorModalOpen(true);
  };

  const handleCloseEditor = () => {
    setIsEditorModalOpen(false);
    setSelectedSectionId(null);
    setSelectedSectionTitle('');
    setSelectedSectionData(null);
  };

  const handleSaveEditorChanges = async (editedJSON: unknown) => {
    if (!selectedSectionId) {
      console.error('No section selected');
      throw new Error('No section selected');
    }

    // Validate editedJSON is not null/undefined
    if (editedJSON === null || editedJSON === undefined) {
      throw new Error('Cannot save empty data. Please ensure all fields are filled.');
    }

    // Create backup of current data before attempting save
    const backupData = JSON.parse(JSON.stringify(blueprint));

    try {
      console.log('Saving changes for section:', selectedSectionId, editedJSON);

      const response = await fetch('/api/starmaps/update-section', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          blueprintId,
          sectionId: selectedSectionId,
          data: editedJSON,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save changes');
      }

      console.log('Save successful:', result);

      // Instead of full page reload, trigger a soft refresh using router
      // This preserves scroll position and provides better UX
      router.refresh();
    } catch (error) {
      console.error('Error saving section changes:', error);

      // Throw detailed error for better user feedback
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Failed to save changes. Your data has been preserved and you can try again.'
      );
    }
  };

  // Placeholder handler for coming soon feature
  const handleSolaraProPlaceholder = () => {
    // Do nothing - this is a placeholder button
    console.log('Solara Learning Engine Pro - Coming Soon');
  };

  // Animation variants - optimized for mobile performance
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceAnimations ? 0 : 0.05,
        delayChildren: 0,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: shouldReduceAnimations ? 1 : 0, y: 0 },
    visible: {
      opacity: 1,
      y: 0,
      transition: shouldReduceAnimations
        ? { duration: 0 }
        : {
            type: 'spring',
            stiffness: 100,
            damping: 12,
            duration: 0.3,
          },
    },
  };

  const MetricCard = React.memo(
    ({
      icon: Icon,
      label,
      value,
      suffix = '',
      gradient,
      delay = 0,
    }: {
      icon: React.ElementType;
      label: string;
      value: number;
      suffix?: string;
      gradient: string;
      delay?: number;
    }) => {
      // Derive icon color from gradient
      const iconColor = gradient.includes('primary')
        ? 'text-primary'
        : gradient.includes('secondary')
          ? 'text-secondary'
          : gradient.includes('success')
            ? 'text-success'
            : gradient.includes('warning')
              ? 'text-warning'
              : 'text-primary';

      const isTouchDevice =
        typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

      return (
        <motion.div
          initial={
            shouldReduceAnimations || isTouchDevice ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
          }
          animate={{ opacity: 1, y: 0 }}
          transition={
            shouldReduceAnimations || isTouchDevice ? { duration: 0 } : { duration: 0.5, delay }
          }
          whileHover={shouldReduceAnimations || isTouchDevice ? undefined : { scale: 1.02, y: -5 }}
          className="group glass-card gpu-accelerated hover:shadow-primary/10 relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:shadow-2xl"
        >
          <div
            className={`absolute inset-0 ${gradient} opacity-5 transition-opacity group-hover:opacity-10`}
          />
          <div className="relative z-10">
            <div className="mb-4 flex items-start justify-between">
              <div
                className={`rounded-xl p-3 ${gradient} bg-opacity-20 transition-transform group-hover:scale-110`}
              >
                <Icon className={`drop-shadow-glow h-6 w-6 ${iconColor}`} />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-text-secondary text-sm font-medium">{label}</p>
              <div className="flex items-baseline gap-1">
                {shouldReduceAnimations ? (
                  <span className="text-4xl font-bold text-white">
                    {suffix === 'hrs' ? value.toFixed(1) : value.toLocaleString()}
                  </span>
                ) : mounted && hasAnimated ? (
                  <CountUp
                    start={0}
                    end={value}
                    duration={2}
                    delay={delay}
                    decimals={suffix === 'hrs' ? 1 : 0}
                    className="text-4xl font-bold text-white"
                    separator=","
                  />
                ) : (
                  <span className="text-4xl font-bold text-white">
                    {suffix === 'hrs' ? value.toFixed(1) : value.toLocaleString()}
                  </span>
                )}
                {suffix && <span className="text-primary text-xl font-medium">{suffix}</span>}
              </div>
            </div>
          </div>
        </motion.div>
      );
    }
  );

  MetricCard.displayName = 'MetricCard';

  const StatCard = (_children: { children: React.ReactNode }) => {
    return (
      <motion.div
        variants={containerVariants}
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
      >
        <MetricCard
          icon={Clock}
          label="Total Duration"
          value={totalDuration}
          suffix="hrs"
          gradient="bg-primary/20"
          delay={0.1}
        />
        <MetricCard
          icon={BookOpen}
          label="Modules"
          value={modules.length}
          gradient="bg-secondary/20"
          delay={0.2}
        />
        <MetricCard
          icon={Target}
          label="Learning Objectives"
          value={objectives.length}
          gradient="bg-success/20"
          delay={0.3}
        />
        <MetricCard
          icon={Layers}
          label="Activities"
          value={totalActivities}
          gradient="bg-warning/20"
          delay={0.4}
        />
      </motion.div>
    );
  };

  return (
    <motion.div
      ref={ref}
      initial={shouldReduceAnimations ? { opacity: 1 } : { opacity: 0 }}
      animate={shouldReduceAnimations ? { opacity: 1 } : (hasAnimated || isInView) ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="relative w-full space-y-8"
      style={{ overflowAnchor: 'none' }}
    >
      {/* High-level Summary Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:gap-6">
        <MetricCard
          icon={Clock}
          label="Total Duration"
          value={totalDuration}
          suffix="hrs"
          gradient="bg-primary/20"
          delay={0.1}
        />
        <MetricCard
          icon={BookOpen}
          label="Modules"
          value={modules.length}
          gradient="bg-secondary/20"
          delay={0.2}
        />
        <MetricCard
          icon={Target}
          label="Learning Objectives"
          value={objectives.length}
          gradient="bg-success/20"
          delay={0.3}
        />
        <MetricCard
          icon={Layers}
          label="Activities"
          value={totalActivities}
          gradient="bg-warning/20"
          delay={0.4}
        />
      </div>

      {/* Subgoals / Objectives Preview Cards */}
      {objectives.length > 0 && objectives.length <= 3 && (
        <motion.div variants={itemVariants} className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {objectives.slice(0, 3).map((objective, index) => (
            <motion.div
              key={objective.id}
              variants={itemVariants}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="glass-card rounded-2xl p-5"
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="bg-primary/20 rounded-lg p-2">
                  <Target className="text-primary h-5 w-5" />
                </div>
                <div className="bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-semibold">
                  Subgoal {index + 1}
                </div>
              </div>
              <h3 className="mb-2 font-semibold text-white">{objective.title}</h3>
              <p className="text-text-secondary mb-3 text-sm">{objective.description}</p>
              <div className="border-t border-white/10 pt-3">
                <div className="text-text-secondary flex items-center gap-2 text-xs">
                  <CheckCircle2 className="text-success h-4 w-4" />
                  <span>
                    Target:{' '}
                    {typeof objective.target === 'string'
                      ? objective.target
                      : JSON.stringify(objective.target)}{' '}
                    • Metric:{' '}
                    {typeof objective.metric === 'string'
                      ? objective.metric
                      : JSON.stringify(objective.metric)}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Control Bar - Always visible with better desktop/mobile support */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 lg:mt-3">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={expandAll}
            style={{ touchAction: 'manipulation' }}
            className="border-primary/40 bg-primary/10 hover:bg-primary/20 active:bg-primary/30 flex min-h-[44px] min-w-[44px] touch-manipulation items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium text-white transition-colors active:scale-95"
            aria-label="Expand all sections"
          >
            <Maximize2 className="h-4 w-4 flex-shrink-0" />
            <span>Expand All</span>
          </button>
          <button
            onClick={collapseAll}
            style={{ touchAction: 'manipulation' }}
            className="flex min-h-[44px] min-w-[44px] touch-manipulation items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10 active:scale-95 active:bg-white/15"
            aria-label="Collapse all sections"
          >
            <Minimize2 className="h-4 w-4 flex-shrink-0" />
            <span>Collapse All</span>
          </button>
        </div>
        <div className="text-text-secondary text-sm">
          {expandedSections.size} of {sections.length} sections expanded
        </div>
      </div>

      {/* Expandable Sections */}
      <div className="space-y-4">
        {/* Learning Objectives */}
        {blueprint.learning_objectives && (
          <>
            <ExpandableSection
              section={sections.find((s) => s.id === 'learning_objectives')!}
              isExpanded={expandedSections.has('learning_objectives')}
              onToggle={() => toggleSection('learning_objectives')}
              onEditClick={(sectionId, sectionTitle) => handleOpenEditor(sectionId, sectionTitle)}
              onSolaraProClick={handleSolaraProPlaceholder}
              ref={(el) => {
                sectionRefs.current['objectives'] = el;
              }}
              isPublicView={isPublicView}
            >
              <ObjectivesInfographic
                objectives={objectives}
                chartConfig={blueprint.learning_objectives.chartConfig}
              />
            </ExpandableSection>
          </>
        )}

        {/* Target Audience */}
        {blueprint.target_audience && (
          <>
            <ExpandableSection
              section={sections.find((s) => s.id === 'target_audience')!}
              isExpanded={expandedSections.has('target_audience')}
              onToggle={() => toggleSection('target_audience')}
              onEditClick={(sectionId, sectionTitle) => handleOpenEditor(sectionId, sectionTitle)}
              onSolaraProClick={handleSolaraProPlaceholder}
              ref={(el) => {
                sectionRefs.current['target_audience'] = el;
              }}
              isPublicView={isPublicView}
            >
              <TargetAudienceInfographic data={blueprint.target_audience} />
            </ExpandableSection>
          </>
        )}

        {/* Assessment Strategy */}
        {blueprint.assessment_strategy && (
          <>
            <ExpandableSection
              section={sections.find((s) => s.id === 'assessment_strategy')!}
              isExpanded={expandedSections.has('assessment_strategy')}
              onToggle={() => toggleSection('assessment_strategy')}
              onEditClick={(sectionId, sectionTitle) => handleOpenEditor(sectionId, sectionTitle)}
              onSolaraProClick={handleSolaraProPlaceholder}
              ref={(el) => {
                sectionRefs.current['assessment'] = el;
              }}
              isPublicView={isPublicView}
            >
              <AssessmentStrategyInfographic
                kpis={blueprint.assessment_strategy.kpis}
                overview={blueprint.assessment_strategy.overview}
                evaluationMethods={blueprint.assessment_strategy.evaluation_methods}
                chartConfig={blueprint.assessment_strategy.chartConfig}
              />
            </ExpandableSection>
          </>
        )}

        {/* Content Outline */}
        {blueprint.content_outline && modules.length > 0 && (
          <>
            <ExpandableSection
              section={sections.find((s) => s.id === 'content_outline')!}
              isExpanded={expandedSections.has('content_outline')}
              onToggle={() => toggleSection('content_outline')}
              onEditClick={(sectionId, sectionTitle) => handleOpenEditor(sectionId, sectionTitle)}
              onSolaraProClick={handleSolaraProPlaceholder}
              ref={(el) => {
                sectionRefs.current['content_outline'] = el;
              }}
              isPublicView={isPublicView}
            >
              <ContentOutlineInfographic modules={modules} />
            </ExpandableSection>
          </>
        )}

        {/* Instructional Strategy */}
        {blueprint.instructional_strategy && (
          <ExpandableSection
            section={sections.find((s) => s.id === 'instructional_strategy')!}
            isExpanded={expandedSections.has('instructional_strategy')}
            onToggle={() => toggleSection('instructional_strategy')}
            onEditClick={(sectionId, sectionTitle) => handleOpenEditor(sectionId, sectionTitle)}
            onSolaraProClick={handleSolaraProPlaceholder}
            ref={(el) => {
              sectionRefs.current['strategy'] = el;
            }}
            isPublicView={isPublicView}
          >
            <InstructionalStrategyInfographic
              overview={blueprint.instructional_strategy.overview}
              modalities={blueprint.instructional_strategy.modalities}
              cohort_model={blueprint.instructional_strategy.cohort_model}
              accessibility_considerations={
                blueprint.instructional_strategy.accessibility_considerations
              }
            />
          </ExpandableSection>
        )}

        {/* Resources & Budget */}
        {blueprint.resources && (
          <ExpandableSection
            section={sections.find((s) => s.id === 'resources')!}
            isExpanded={expandedSections.has('resources')}
            onToggle={() => toggleSection('resources')}
            onEditClick={(sectionId, sectionTitle) => handleOpenEditor(sectionId, sectionTitle)}
            onSolaraProClick={handleSolaraProPlaceholder}
            ref={(el) => {
              sectionRefs.current['resources'] = el;
            }}
            isPublicView={isPublicView}
          >
            <BudgetResourcesInfographic
              budget={blueprint.resources.budget}
              human_resources={blueprint.resources.human_resources}
              tools_and_platforms={blueprint.resources.tools_and_platforms}
            />
          </ExpandableSection>
        )}

        {/* Implementation Timeline */}
        {blueprint.implementation_timeline && (
          <ExpandableSection
            section={sections.find((s) => s.id === 'implementation_timeline')!}
            isExpanded={expandedSections.has('implementation_timeline')}
            onToggle={() => toggleSection('implementation_timeline')}
            onEditClick={(sectionId, sectionTitle) => handleOpenEditor(sectionId, sectionTitle)}
            onSolaraProClick={handleSolaraProPlaceholder}
            ref={(el) => {
              sectionRefs.current['timeline'] = el;
            }}
            isPublicView={isPublicView}
          >
            <TimelineInfographic
              phases={blueprint.implementation_timeline.phases}
              critical_path={blueprint.implementation_timeline.critical_path}
            />
          </ExpandableSection>
        )}

        {/* Success Metrics */}
        {blueprint.success_metrics && (
          <ExpandableSection
            section={sections.find((s) => s.id === 'success_metrics')!}
            isExpanded={expandedSections.has('success_metrics')}
            onToggle={() => toggleSection('success_metrics')}
            onEditClick={(sectionId, sectionTitle) => handleOpenEditor(sectionId, sectionTitle)}
            onSolaraProClick={handleSolaraProPlaceholder}
            ref={(el) => {
              sectionRefs.current['metrics'] = el;
            }}
            isPublicView={isPublicView}
          >
            <SuccessMetricsInfographic
              metrics={blueprint.success_metrics.metrics}
              reportingCadence={blueprint.success_metrics.reporting_cadence}
            />
          </ExpandableSection>
        )}

        {/* Risk Mitigation */}
        {blueprint.risk_mitigation && (
          <ExpandableSection
            section={sections.find((s) => s.id === 'risk_mitigation')!}
            isExpanded={expandedSections.has('risk_mitigation')}
            onToggle={() => toggleSection('risk_mitigation')}
            onEditClick={(sectionId, sectionTitle) => handleOpenEditor(sectionId, sectionTitle)}
            onSolaraProClick={handleSolaraProPlaceholder}
            ref={(el) => {
              sectionRefs.current['risks'] = el;
            }}
            isPublicView={isPublicView}
          >
            <RiskMitigationInfographic
              risks={blueprint.risk_mitigation.risks}
              contingency_plans={blueprint.risk_mitigation.contingency_plans}
            />
          </ExpandableSection>
        )}

        {/* Sustainability Plan */}
        {blueprint.sustainability_plan && (
          <ExpandableSection
            section={sections.find((s) => s.id === 'sustainability_plan')!}
            isExpanded={expandedSections.has('sustainability_plan')}
            onToggle={() => toggleSection('sustainability_plan')}
            onEditClick={(sectionId, sectionTitle) => handleOpenEditor(sectionId, sectionTitle)}
            onSolaraProClick={handleSolaraProPlaceholder}
            ref={(el) => {
              sectionRefs.current['sustainability'] = el;
            }}
            isPublicView={isPublicView}
          >
            <SustainabilityPlanInfographic
              content={blueprint.sustainability_plan.content}
              maintenance_schedule={blueprint.sustainability_plan.maintenance_schedule}
              scaling_considerations={blueprint.sustainability_plan.scaling_considerations}
            />
          </ExpandableSection>
        )}

        {/* Additional/Unknown Sections */}
        {additionalSections.map(({ key, data }) => {
          const section = sections.find((s) => s.id === key);
          if (!section) return null;

          return (
            <ExpandableSection
              key={key}
              section={section}
              isExpanded={expandedSections.has(key)}
              onToggle={() => toggleSection(key)}
              onEditClick={(sectionId, sectionTitle) => handleOpenEditor(sectionId, sectionTitle)}
              onSolaraProClick={handleSolaraProPlaceholder}
              ref={(el) => {
                sectionRefs.current[key] = el;
              }}
              isPublicView={isPublicView}
            >
              <AdditionalDataInfographic data={data} sectionKey={key} />
            </ExpandableSection>
          );
        })}
      </div>

      {/* Visual JSON Editor Modal */}
      <VisualJSONEditor
        isOpen={isEditorModalOpen}
        onClose={handleCloseEditor}
        onSave={handleSaveEditorChanges}
        sectionTitle={selectedSectionTitle}
        sectionData={selectedSectionData}
      />
    </motion.div>
  );
}

// Expandable Section Component
const ExpandableSection = React.forwardRef<
  HTMLDivElement,
  {
    section: SectionDef;
    isExpanded: boolean;
    onToggle: () => void;
    onEditClick?: (sectionId: string, sectionTitle: string) => void;
    onSolaraProClick?: () => void;
    children: React.ReactNode;
    isPublicView?: boolean;
  }
>(
  (
    {
      section,
      isExpanded,
      onToggle,
      onEditClick,
      onSolaraProClick,
      children,
      isPublicView = false,
    },
    ref
  ) => {
    const Icon = section.icon;

    const handleSolaraPro = (e: React.MouseEvent | React.KeyboardEvent) => {
      e.stopPropagation();
      if (onSolaraProClick) {
        onSolaraProClick();
      }
    };

    const handleEdit = (e: React.MouseEvent | React.KeyboardEvent) => {
      e.stopPropagation();
      if (onEditClick) {
        onEditClick(section.id, section.title);
      }
    };

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="glass-card overflow-hidden rounded-2xl transition-all"
        style={{ overflowAnchor: 'none' }}
      >
        {/* Section Header - Always Visible, Clickable */}
        <button
          onClick={onToggle}
          className="flex min-h-[56px] w-full touch-manipulation items-center justify-between p-4 text-left transition-all hover:bg-white/5 active:bg-white/10 sm:p-6"
          type="button"
          aria-expanded={isExpanded}
          aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${section.title} section`}
        >
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <div className={`rounded-xl p-2.5 ${section.gradient} sm:p-3`}>
              <Icon className={`h-5 w-5 ${section.iconColor} sm:h-6 sm:w-6`} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white sm:text-lg md:text-xl">
                {section.title}
              </h3>
              <p className="text-text-secondary text-xs sm:text-sm">{section.description}</p>
            </div>
          </div>

          {/* Right Side Controls */}
          <div className="ml-4 flex shrink-0 items-center gap-2">
            {/* Edit Section Button - Hidden in public view */}
            {isExpanded && !isPublicView && (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit(e);
                }}
                className="pressable border-primary bg-primary/10 text-primary hover:bg-primary/20 active:bg-primary/30 hover:border-primary inline-flex h-11 min-h-[44px] w-11 min-w-[44px] cursor-pointer touch-manipulation items-center justify-center rounded-full border-2 transition-all hover:shadow-[0_0_15px_rgba(167,218,219,0.6)] active:scale-95"
                title="Edit Section"
                aria-label="Edit section"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    handleEdit(e as React.KeyboardEvent);
                  }
                }}
              >
                <Edit className="h-5 w-5" />
              </motion.div>
            )}

            {/* Solara Pro Placeholder Button with Vibrant Glow & Pulse - Hidden in public view */}
            {isExpanded && !isPublicView && (
              <motion.div
                animate={{
                  boxShadow: [
                    '0 0 15px rgba(167,218,219,0.5)',
                    '0 0 20px rgba(167,218,219,0.7)',
                    '0 0 15px rgba(167,218,219,0.5)',
                  ],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSolaraPro(e);
                }}
                className="pressable border-primary bg-primary/10 text-primary hover:bg-primary/20 active:bg-primary/30 hover:border-primary inline-flex h-11 min-h-[44px] w-11 min-w-[44px] cursor-pointer touch-manipulation items-center justify-center rounded-full border-2 transition-all hover:shadow-[0_0_25px_rgba(167,218,219,0.8)] active:scale-95"
                title="Edit with Solara Learning Engine Pro: Coming Soon"
                aria-label="Edit with Solara Learning Engine Pro: Coming Soon"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSolaraPro(e as React.KeyboardEvent);
                  }
                }}
              >
                <Wand2 className="h-5 w-5 drop-shadow-[0_0_8px_rgba(167,218,219,0.9)]" />
              </motion.div>
            )}

            {/* Collapse/Expand Button */}
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.3 }}
              className="rounded-full bg-white/5 p-2 sm:p-2.5"
            >
              <ChevronDown className="text-text-secondary h-4 w-4 sm:h-5 sm:w-5" />
            </motion.div>
          </div>
        </button>

        {/* Expandable Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
              style={{ overflowAnchor: 'none' }}
            >
              <div className="border-t border-white/10 p-4 sm:p-6">{children}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }
);

ExpandableSection.displayName = 'ExpandableSection';

