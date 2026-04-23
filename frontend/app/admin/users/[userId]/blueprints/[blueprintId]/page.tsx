'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MessageSquare,
  Sparkles,
  CheckCircle,
  Circle,
  RefreshCw,
  Edit2,
  Save,
  X,
  Share2,
  Copy,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useToast } from '@/components/ui/toast';
import { InteractiveBlueprintDashboard } from '@/components/blueprint/InteractiveBlueprintDashboard';
import type { BlueprintJSON } from '@/components/blueprint/types';
import { DynamicQuestionRenderer } from '@/components/demo-dynamicv2/DynamicQuestionRenderer';

type BlueprintStatus = 'draft' | 'generating' | 'completed' | 'error';

interface Blueprint {
  id: string;
  user_id: string;
  status: BlueprintStatus;
  static_answers: any;
  dynamic_questions: any;
  dynamic_answers: any;
  blueprint_json: any;
  blueprint_markdown: string | null;
  created_at: string;
  updated_at: string;
}

interface UserInfo {
  user_id: string;
  email: string;
  full_name: string | null;
}

type TabType = 'static' | 'dynamic' | 'blueprint';

const STATUS_CONFIG: Record<
  BlueprintStatus,
  { label: string; icon: typeof FileText; color: string; bgColor: string }
> = {
  draft: {
    label: 'Draft',
    icon: FileText,
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
  },
  generating: {
    label: 'Generating',
    icon: Loader2,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle2,
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
  },
  error: {
    label: 'Error',
    icon: AlertCircle,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
  },
};

// Component to render static questionnaire
function StaticQuestionnaireView({ staticAnswers }: { staticAnswers: any }) {
  if (!staticAnswers || Object.keys(staticAnswers).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-white/60">
        <MessageSquare className="mb-4 h-12 w-12 text-white/40" />
        <p>No static questionnaire data available</p>
      </div>
    );
  }

  // Helper to extract display value from objects with {label, value} structure
  const extractDisplayValue = (item: any): string => {
    if (item === null || item === undefined) return '';
    if (typeof item === 'string') return item;
    if (typeof item === 'number' || typeof item === 'boolean') return String(item);
    if (typeof item === 'object' && !Array.isArray(item)) {
      // Handle {label, value} structure
      if ('label' in item && typeof item.label === 'string') return item.label;
      if ('value' in item && typeof item.value === 'string') return item.value;
      // For any other object, convert to JSON
      return JSON.stringify(item);
    }
    return String(item);
  };

  const renderField = (label: string, value: any, isArray: boolean = false) => {
    if (value === undefined || value === null || value === '') return null;

    return (
      <div className="border-b border-white/5 pb-3 last:border-0">
        <dt className="mb-1 text-sm font-medium text-white/60">{label}</dt>
        <dd className="text-white">
          {isArray && Array.isArray(value) ? (
            <div className="flex flex-wrap gap-2">
              {value.map((item, idx) => (
                <Badge
                  key={idx}
                  variant="outline"
                  className="border-cyan-500/20 bg-cyan-500/10 text-cyan-400"
                >
                  {extractDisplayValue(item)}
                </Badge>
              ))}
            </div>
          ) : typeof value === 'object' && !Array.isArray(value) ? (
            <div className="space-y-2 pl-4">
              {Object.entries(value).map(([key, val]) => (
                <div key={key} className="text-sm">
                  <span className="font-medium text-white/70">{key}: </span>
                  <span>{extractDisplayValue(val)}</span>
                </div>
              ))}
            </div>
          ) : (
            <span>{extractDisplayValue(value)}</span>
          )}
        </dd>
      </div>
    );
  };

  // Helper to format field names for display
  const formatFieldName = (key: string): string => {
    return key
      .replace(/_/g, ' ')
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Check if this is the old V2.0 3-section format
  const isOldFormat =
    staticAnswers.section_1_role_experience ||
    staticAnswers.section_2_organization ||
    staticAnswers.section_3_learning_gap;

  if (isOldFormat) {
    // Render old 3-section format
    return (
      <div className="space-y-8">
        {staticAnswers.section_1_role_experience && (
          <div>
            <h3 className="mb-4 text-xl font-bold text-cyan-400">Role & Experience</h3>
            <div className="space-y-4 rounded-lg border border-white/10 bg-white/5 p-6">
              {Object.entries(staticAnswers.section_1_role_experience).map(([key, value]) => (
                <div key={key}>
                  {renderField(formatFieldName(key), value, Array.isArray(value))}
                </div>
              ))}
            </div>
          </div>
        )}

        {staticAnswers.section_2_organization && (
          <div>
            <h3 className="mb-4 text-xl font-bold text-cyan-400">Organization</h3>
            <div className="space-y-4 rounded-lg border border-white/10 bg-white/5 p-6">
              {Object.entries(staticAnswers.section_2_organization).map(([key, value]) => (
                <div key={key}>
                  {renderField(formatFieldName(key), value, Array.isArray(value))}
                </div>
              ))}
            </div>
          </div>
        )}

        {staticAnswers.section_3_learning_gap && (
          <div>
            <h3 className="mb-4 text-xl font-bold text-cyan-400">Learning Gap & Goals</h3>
            <div className="space-y-4 rounded-lg border border-white/10 bg-white/5 p-6">
              {Object.entries(staticAnswers.section_3_learning_gap).map(([key, value]) => (
                <div key={key}>
                  {renderField(formatFieldName(key), value, Array.isArray(value))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Render new V2 8-section wizard format
  return (
    <div className="space-y-8">
      {/* Role */}
      {staticAnswers.role && (
        <div>
          <h3 className="mb-4 text-xl font-bold text-cyan-400">Role</h3>
          <div className="space-y-4 rounded-lg border border-white/10 bg-white/5 p-6">
            {renderField('Your Role', staticAnswers.role)}
          </div>
        </div>
      )}

      {/* Organization */}
      {staticAnswers.organization && (
        <div>
          <h3 className="mb-4 text-xl font-bold text-cyan-400">Organization</h3>
          <div className="space-y-4 rounded-lg border border-white/10 bg-white/5 p-6">
            {renderField('Organization Name', staticAnswers.organization.name)}
            {renderField('Industry', staticAnswers.organization.industry)}
            {renderField('Organization Size', staticAnswers.organization.size)}
            {renderField('Geographic Regions', staticAnswers.organization.regions, true)}
          </div>
        </div>
      )}

      {/* Learner Profile */}
      {staticAnswers.learnerProfile && (
        <div>
          <h3 className="mb-4 text-xl font-bold text-cyan-400">Learner Profile</h3>
          <div className="space-y-4 rounded-lg border border-white/10 bg-white/5 p-6">
            {renderField('Audience Size', staticAnswers.learnerProfile.audienceSize)}
            {renderField('Prior Knowledge Level', staticAnswers.learnerProfile.priorKnowledge)}
            {renderField('Motivation Factors', staticAnswers.learnerProfile.motivation, true)}
            {renderField('Learning Environment', staticAnswers.learnerProfile.environment, true)}
            {renderField('Available Devices', staticAnswers.learnerProfile.devices, true)}
            {renderField('Time Available (hours/week)', staticAnswers.learnerProfile.timeAvailable)}
            {renderField('Accessibility Needs', staticAnswers.learnerProfile.accessibility, true)}
          </div>
        </div>
      )}

      {/* Learning Gap & Objectives */}
      {staticAnswers.learningGap && (
        <div>
          <h3 className="mb-4 text-xl font-bold text-cyan-400">Learning Gap & Objectives</h3>
          <div className="space-y-4 rounded-lg border border-white/10 bg-white/5 p-6">
            {renderField('Gap Description', staticAnswers.learningGap.description)}
            {renderField('Gap Type', staticAnswers.learningGap.gapType)}
            {renderField('Urgency Level', staticAnswers.learningGap.urgency)}
            {renderField('Impact Level', staticAnswers.learningGap.impact)}
            {renderField('Impact Areas', staticAnswers.learningGap.impactAreas, true)}
            {renderField("Bloom's Taxonomy Level", staticAnswers.learningGap.bloomsLevel)}
            {renderField('Learning Objectives', staticAnswers.learningGap.objectives)}
          </div>
        </div>
      )}

      {/* Resources & Budget */}
      {staticAnswers.resources && (
        <div>
          <h3 className="mb-4 text-xl font-bold text-cyan-400">Resources & Budget</h3>
          <div className="space-y-4 rounded-lg border border-white/10 bg-white/5 p-6">
            {staticAnswers.resources.budget && (
              <>
                {renderField('Budget Amount', staticAnswers.resources.budget.amount)}
                {renderField('Budget Flexibility', staticAnswers.resources.budget.flexibility)}
              </>
            )}
            {staticAnswers.resources.timeline && (
              <>
                {renderField('Target Date', staticAnswers.resources.timeline.targetDate)}
                {renderField('Timeline Flexibility', staticAnswers.resources.timeline.flexibility)}
                {renderField('Duration (weeks)', staticAnswers.resources.timeline.duration)}
              </>
            )}
            {staticAnswers.resources.team && (
              <>
                {renderField(
                  'Instructional Designers',
                  staticAnswers.resources.team.instructionalDesigners
                )}
                {renderField('Content Developers', staticAnswers.resources.team.contentDevelopers)}
                {renderField(
                  'Multimedia Specialists',
                  staticAnswers.resources.team.multimediaSpecialists
                )}
                {renderField('SME Availability', staticAnswers.resources.team.smeAvailability)}
                {renderField('Team Experience Level', staticAnswers.resources.team.experienceLevel)}
              </>
            )}
            {staticAnswers.resources.technology && (
              <>
                {renderField('LMS', staticAnswers.resources.technology.lms)}
                {renderField(
                  'Authoring Tools',
                  staticAnswers.resources.technology.authoringTools,
                  true
                )}
                {renderField('Other Tools', staticAnswers.resources.technology.otherTools, true)}
              </>
            )}
            {staticAnswers.resources.contentStrategy && (
              <>
                {renderField('Content Source', staticAnswers.resources.contentStrategy.source)}
                {renderField(
                  'Existing Materials',
                  staticAnswers.resources.contentStrategy.existingMaterials,
                  true
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Delivery Strategy */}
      {staticAnswers.deliveryStrategy && (
        <div>
          <h3 className="mb-4 text-xl font-bold text-cyan-400">Delivery Strategy</h3>
          <div className="space-y-4 rounded-lg border border-white/10 bg-white/5 p-6">
            {renderField('Modality', staticAnswers.deliveryStrategy.modality)}
            {renderField('Interactivity Level', staticAnswers.deliveryStrategy.interactivityLevel)}
            {renderField(
              'Practice Opportunities',
              staticAnswers.deliveryStrategy.practiceOpportunities,
              true
            )}
            {renderField('Social Learning', staticAnswers.deliveryStrategy.socialLearning, true)}
            {renderField('Reinforcement Strategy', staticAnswers.deliveryStrategy.reinforcement)}
          </div>
        </div>
      )}

      {/* Constraints */}
      {staticAnswers.constraints && staticAnswers.constraints.length > 0 && (
        <div>
          <h3 className="mb-4 text-xl font-bold text-cyan-400">Constraints</h3>
          <div className="space-y-4 rounded-lg border border-white/10 bg-white/5 p-6">
            {renderField('Project Constraints', staticAnswers.constraints, true)}
          </div>
        </div>
      )}

      {/* Assessment & Evaluation */}
      {staticAnswers.evaluation && (
        <div>
          <h3 className="mb-4 text-xl font-bold text-cyan-400">Assessment & Evaluation</h3>
          <div className="space-y-4 rounded-lg border border-white/10 bg-white/5 p-6">
            {staticAnswers.evaluation.level1 && (
              <>
                {renderField(
                  'Level 1 Methods (Reaction)',
                  staticAnswers.evaluation.level1.methods,
                  true
                )}
                {renderField(
                  'Satisfaction Target %',
                  staticAnswers.evaluation.level1.satisfactionTarget
                )}
              </>
            )}
            {staticAnswers.evaluation.level2 && (
              <>
                {renderField(
                  'Level 2 Assessment Methods (Learning)',
                  staticAnswers.evaluation.level2.assessmentMethods,
                  true
                )}
                {renderField(
                  'Passing Score Required',
                  staticAnswers.evaluation.level2.passingRequired ? 'Yes' : 'No'
                )}
              </>
            )}
            {staticAnswers.evaluation.level3 && (
              <>
                {renderField(
                  'Measure Behavior Change (Level 3)',
                  staticAnswers.evaluation.level3.measureBehavior ? 'Yes' : 'No'
                )}
              </>
            )}
            {staticAnswers.evaluation.level4 && (
              <>
                {renderField(
                  'Measure ROI (Level 4)',
                  staticAnswers.evaluation.level4.measureROI ? 'Yes' : 'No'
                )}
              </>
            )}
            {renderField('Certification Type', staticAnswers.evaluation.certification)}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to safely render any value as a string
const safeRender = (value: any): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'object') {
    // Handle objects with label/value structure
    if ('label' in value && typeof value.label === 'string') return value.label;
    if ('value' in value && typeof value.value === 'string') return value.value;
    // Fallback to JSON
    return JSON.stringify(value);
  }
  return String(value);
};

// Helper to safely convert any value to string (handles {label, value} objects)
const toSafeString = (value: any): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'object' && !Array.isArray(value)) {
    // Handle {label, value} structure
    if ('label' in value && typeof value.label === 'string') return value.label;
    if ('value' in value && typeof value.value === 'string') return value.value;
    // Fallback to JSON
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return value.map(toSafeString).join(', ');
  }
  return String(value);
};

/**
 * Normalize answer values for storage - extracts strings from {label, value} objects
 * but preserves array structure for multi-select questions
 */
const normalizeAnswerForStorage = (value: any): any => {
  if (value === null || value === undefined) return value;

  // For arrays, normalize each item but keep as array
  if (Array.isArray(value)) {
    return value.map((item) => {
      if (item === null || item === undefined) return item;
      if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
        return item;
      }
      // Handle {label, value} objects in arrays
      if (typeof item === 'object') {
        if ('value' in item && (typeof item.value === 'string' || typeof item.value === 'number')) {
          return item.value;
        }
        if ('label' in item && (typeof item.label === 'string' || typeof item.label === 'number')) {
          return item.label;
        }
        // Fallback to JSON for complex objects
        return JSON.stringify(item);
      }
      return String(item);
    });
  }

  // For primitives, return as-is
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  // For objects, extract the value or label string
  if (typeof value === 'object') {
    if ('value' in value && (typeof value.value === 'string' || typeof value.value === 'number')) {
      return value.value;
    }
    if ('label' in value && (typeof value.label === 'string' || typeof value.label === 'number')) {
      return value.label;
    }
    // Fallback to JSON
    return JSON.stringify(value);
  }

  return String(value);
};

// Component to render dynamic questionnaire
function DynamicQuestionnaireView({
  dynamicQuestions,
  dynamicAnswers,
  isEditing = false,
  onUpdateAnswer,
}: {
  dynamicQuestions: any;
  dynamicAnswers: any;
  isEditing?: boolean;
  onUpdateAnswer?: (questionId: string, value: any) => void;
}) {
  if (!dynamicQuestions) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-white/60">
        <Sparkles className="mb-4 h-12 w-12 text-white/40" />
        <p>No dynamic questions generated yet</p>
      </div>
    );
  }

  // Handle both array format and object with sections property
  let rawSections: any[] = [];

  if (Array.isArray(dynamicQuestions)) {
    rawSections = dynamicQuestions;
  } else if (dynamicQuestions.sections && Array.isArray(dynamicQuestions.sections)) {
    rawSections = dynamicQuestions.sections;
  }

  // Transform sections to ensure all strings (replicate dynamic-questionnaire/[blueprintId]/page.tsx:183-208)
  const sections = rawSections
    .filter(
      (section: any) =>
        section && (section.section_title || section.title) && Array.isArray(section.questions)
    )
    .map((section: any, idx: number) => ({
      id: String(section.id ?? `section-${idx}`),
      title: toSafeString(section.section_title || section.title || `Section ${idx + 1}`),
      description: section.description ? toSafeString(section.description) : undefined,
      questions: Array.isArray(section.questions)
        ? section.questions.map((q: any, qIdx: number) => ({
            id: String(q.id ?? `question-${idx}-${qIdx}`),
            label: toSafeString(q.label || q.question || 'Question'),
            type: String(q.type || 'text'),
            required: Boolean(q.required),
            helpText: q.helpText ? toSafeString(q.helpText) : undefined,
            options: Array.isArray(q.options)
              ? (() => {
                  // First pass: transform options
                  const transformedOptions = q.options.map((opt: any) => {
                    if (typeof opt === 'string') return { value: opt, label: opt };
                    if (typeof opt === 'object' && opt !== null) {
                      return {
                        value: toSafeString(opt.value || opt.label || opt),
                        label: toSafeString(opt.label || opt.value || opt),
                      };
                    }
                    const str = toSafeString(opt);
                    return { value: str, label: str };
                  });

                  // Check if all options have the same value (AI generation bug)
                  const values = transformedOptions.map((o: any) => o.value);
                  const uniqueValues = new Set(values);

                  // If all values are the same, use labels as values for uniqueness
                  if (uniqueValues.size === 1 && transformedOptions.length > 1) {
                    console.warn(
                      `Question "${q.label || q.id}" has duplicate values for all options. Using labels as values.`
                    );
                    return transformedOptions.map((opt: any) => ({
                      value: opt.label, // Use label as unique value
                      label: opt.label,
                    }));
                  }

                  return transformedOptions;
                })()
              : undefined,
            scaleConfig: q.scaleConfig,
            sliderConfig: q.sliderConfig,
            validation: q.validation,
            rows: q.rows,
            maxLength: q.maxLength,
          }))
        : [],
    }));

  if (sections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-white/60">
        <Sparkles className="mb-4 h-12 w-12 text-white/40" />
        <p>Dynamic questions format not recognized</p>
        <p className="mt-2 text-xs text-white/40">
          Expected structure with sections array containing questions
        </p>
      </div>
    );
  }

  const hasAnswers = dynamicAnswers && Object.keys(dynamicAnswers).length > 0;

  return (
    <div className="space-y-8">
      {sections.map((section, sectionIdx: number) => {
        return (
          <div key={section.id}>
            <h3 className="mb-4 text-xl font-bold text-cyan-400">{section.title}</h3>
            <div className="space-y-6 rounded-lg border border-white/10 bg-white/5 p-6">
              {section.questions.map((question: any, qIdx: number) => {
                // Get answer and normalize it to string
                const rawAnswer = hasAnswers ? dynamicAnswers[question.id] : null;

                // Normalize answer to string/string[]
                const normalizeAnswerValue = (val: any): any => {
                  if (val === null || val === undefined) return val;
                  if (Array.isArray(val)) {
                    return val.map((item) => toSafeString(item));
                  }
                  return toSafeString(val);
                };

                const answer = normalizeAnswerValue(rawAnswer);
                const hasAnswer = answer !== null && answer !== undefined && answer !== '';

                return (
                  <div
                    key={question.id}
                    className="border-b border-white/5 pb-6 last:border-0 last:pb-0"
                  >
                    <div className="mb-3 flex items-start gap-3">
                      {hasAnswer ? (
                        <CheckCircle className="mt-1 h-5 w-5 flex-shrink-0 text-green-400" />
                      ) : (
                        <Circle className="mt-1 h-5 w-5 flex-shrink-0 text-white/20" />
                      )}
                      <div className="flex-1">
                        <h4 className="mb-1 font-medium text-white">
                          {question.label}
                          {question.required && <span className="ml-1 text-red-400">*</span>}
                        </h4>
                        {question.helpText && (
                          <p className="mb-3 text-sm text-white/50">{question.helpText}</p>
                        )}

                        {/* Display options if available */}
                        {question.options && question.options.length > 0 && (
                          <div className="mb-3 space-y-1">
                            <p className="text-xs font-medium tracking-wide text-white/40 uppercase">
                              Options:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {question.options.map(
                                (option: { value: string; label: string }, optIdx: number) => {
                                  const isSelected = Array.isArray(answer)
                                    ? answer.includes(option.value)
                                    : answer === option.value;

                                  return (
                                    <Badge
                                      key={optIdx}
                                      variant="outline"
                                      className={
                                        isSelected
                                          ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300'
                                          : 'border-white/10 bg-white/5 text-white/60'
                                      }
                                    >
                                      {option.label}
                                    </Badge>
                                  );
                                }
                              )}
                            </div>
                          </div>
                        )}

                        {/* Display/Edit answer */}
                        {isEditing ? (
                          <div className="mt-3">
                            <DynamicQuestionRenderer
                              question={question}
                              value={answer}
                              onChange={(newValue) => onUpdateAnswer?.(question.id, newValue)}
                            />
                          </div>
                        ) : (
                          <>
                            {hasAnswer && (
                              <div className="mt-3 rounded-md border border-cyan-500/20 bg-cyan-500/5 p-3">
                                <p className="text-xs font-medium tracking-wide text-cyan-400/80 uppercase">
                                  Answer:
                                </p>
                                <div className="mt-1 text-white">
                                  {Array.isArray(answer) ? (
                                    <div className="flex flex-wrap gap-2">
                                      {answer.map((item, idx) => (
                                        <Badge
                                          key={idx}
                                          variant="outline"
                                          className="border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
                                        >
                                          {item}
                                        </Badge>
                                      ))}
                                    </div>
                                  ) : (
                                    <span>{answer}</span>
                                  )}
                                </div>
                              </div>
                            )}

                            {!hasAnswer && (
                              <p className="mt-3 text-sm text-white/40 italic">
                                No answer provided
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {!hasAnswers && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-400" />
            <div>
              <p className="font-medium text-amber-400">No Answers Submitted</p>
              <p className="mt-1 text-sm text-amber-400/70">
                The user has not submitted answers to the dynamic questionnaire yet.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BlueprintDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;
  const blueprintId = params.blueprintId as string;
  const { showError } = useToast();

  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('static');
  const [regeneratingQuestions, setRegeneratingQuestions] = useState(false);
  const [regeneratingBlueprint, setRegeneratingBlueprint] = useState(false);
  const [isEditingDynamic, setIsEditingDynamic] = useState(false);
  const [editedDynamicAnswers, setEditedDynamicAnswers] = useState<Record<string, any>>({});
  const [savingDynamicAnswers, setSavingDynamicAnswers] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareUrl, setShareUrl] = useState<string>('');
  const [generatingShare, setGeneratingShare] = useState(false);
  const [copiedShareLink, setCopiedShareLink] = useState(false);

  useEffect(() => {
    const fetchBlueprint = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/admin/users/${userId}/starmaps/${blueprintId}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || `Failed to fetch blueprint (${response.status})`);
        }

        const data = await response.json();
        setBlueprint(data.blueprint);
        setUser(data.user);
      } catch (err) {
        console.error('Failed to fetch blueprint:', err);
        setError(err instanceof Error ? err.message : 'Failed to load blueprint');
        showError(err instanceof Error ? err.message : 'Failed to load blueprint');
      } finally {
        setLoading(false);
      }
    };

    fetchBlueprint();
  }, [userId, blueprintId, showError]);

  const handleRegenerateDynamicQuestions = async () => {
    if (!blueprint) return;

    try {
      setRegeneratingQuestions(true);

      const response = await fetch('/api/generate-dynamic-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staticAnswers: blueprint.static_answers,
          blueprintId: blueprint.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate dynamic questions');
      }

      const data = await response.json();

      // Update blueprint with new dynamic questions
      setBlueprint((prev) =>
        prev
          ? {
              ...prev,
              dynamic_questions: data.dynamicQuestions || data.questions,
            }
          : null
      );

      showError('Dynamic questions regenerated successfully!'); // Using showError for notifications
    } catch (err) {
      console.error('Failed to regenerate dynamic questions:', err);
      showError(err instanceof Error ? err.message : 'Failed to regenerate dynamic questions');
    } finally {
      setRegeneratingQuestions(false);
    }
  };

  const handleRegenerateBlueprint = async () => {
    if (!blueprint) return;

    try {
      setRegeneratingBlueprint(true);

      const response = await fetch('/api/starmaps/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staticAnswers: blueprint.static_answers,
          dynamicAnswers: blueprint.dynamic_answers,
          blueprintId: blueprint.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate blueprint');
      }

      const data = await response.json();

      // Update blueprint with new generated data
      setBlueprint((prev) =>
        prev
          ? {
              ...prev,
              blueprint_json: data.blueprint,
              blueprint_markdown: data.markdown,
              status: 'completed',
            }
          : null
      );

      showError('Blueprint regenerated successfully!');
    } catch (err) {
      console.error('Failed to regenerate blueprint:', err);
      showError(err instanceof Error ? err.message : 'Failed to regenerate blueprint');
    } finally {
      setRegeneratingBlueprint(false);
    }
  };

  const handleStartEditDynamic = () => {
    if (!blueprint) return;
    setEditedDynamicAnswers(blueprint.dynamic_answers || {});
    setIsEditingDynamic(true);
  };

  const handleCancelEditDynamic = () => {
    setIsEditingDynamic(false);
    setEditedDynamicAnswers({});
  };

  const handleUpdateDynamicAnswer = (questionId: string, value: any) => {
    // Normalize the value to prevent {label, value} objects from being stored
    const normalizedValue = normalizeAnswerForStorage(value);
    setEditedDynamicAnswers((prev) => ({
      ...prev,
      [questionId]: normalizedValue,
    }));
  };

  const handleSaveDynamicAnswers = async () => {
    if (!blueprint) return;

    try {
      setSavingDynamicAnswers(true);

      const response = await fetch(
        `/api/admin/users/${userId}/starmaps/${blueprintId}/dynamic-answers`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dynamicAnswers: editedDynamicAnswers,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save dynamic answers');
      }

      // Update local state
      setBlueprint((prev) =>
        prev
          ? {
              ...prev,
              dynamic_answers: editedDynamicAnswers,
            }
          : null
      );

      setIsEditingDynamic(false);
      showError('Dynamic answers saved successfully!');
    } catch (err) {
      console.error('Failed to save dynamic answers:', err);
      showError(err instanceof Error ? err.message : 'Failed to save dynamic answers');
    } finally {
      setSavingDynamicAnswers(false);
    }
  };

  const handleGenerateShareLink = async () => {
    if (!blueprint) return;

    try {
      setGeneratingShare(true);

      const response = await fetch('/api/starmaps/share/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blueprintId: blueprint.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate share link');
      }

      const data = await response.json();
      setShareUrl(data.shareUrl);
      setShowShareDialog(true);
    } catch (err) {
      console.error('Failed to generate share link:', err);
      showError(err instanceof Error ? err.message : 'Failed to generate share link');
    } finally {
      setGeneratingShare(false);
    }
  };

  const handleCopyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedShareLink(true);
      setTimeout(() => setCopiedShareLink(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
      showError('Failed to copy link to clipboard');
    }
  };

  const getBlueprintTitle = (blueprint: Blueprint): string => {
    const staticAnswers = blueprint.static_answers as any;
    if (staticAnswers?.section_3_learning_gap?.learning_goal) {
      const goal = staticAnswers.section_3_learning_gap.learning_goal;
      return goal.slice(0, 60) + (goal.length > 60 ? '...' : '');
    }
    return `Blueprint ${blueprint.id.slice(0, 8)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <GlassCard className="p-12">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
              <p className="text-white/60">Loading blueprint details...</p>
            </div>
          </GlassCard>
        </div>
      </div>
    );
  }

  if (error || !blueprint || !user) {
    return (
      <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <GlassCard className="p-12">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="rounded-full bg-red-500/10 p-6">
                <AlertCircle className="h-12 w-12 text-red-500" />
              </div>
              <h3 className="text-xl font-semibold text-white">Failed to Load Blueprint</h3>
              <p className="text-white/60">{error || 'An unexpected error occurred'}</p>
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="border-white/10 bg-white/5 text-white hover:bg-white/10"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
            </div>
          </GlassCard>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[blueprint.status];

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="space-y-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div className="flex items-center space-x-4">
              <Link href={`/admin/users/${userId}/blueprints`}>
                <Button variant="ghost" size="icon" className="text-white/60 hover:text-white">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                <FileText className="h-8 w-8 text-purple-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h1 className="font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl">
                    {getBlueprintTitle(blueprint)}
                  </h1>
                  <Badge
                    variant="outline"
                    className={`${statusConfig.bgColor} ${statusConfig.color} border-transparent`}
                  >
                    {statusConfig.label}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-white/70">
                  {user.full_name || user.email} • Created{' '}
                  {new Date(blueprint.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <GlassCard className="p-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('static')}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                    activeTab === 'static'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <MessageSquare className="h-4 w-4" />
                  Static Questionnaire
                </button>
                <button
                  onClick={() => setActiveTab('dynamic')}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                    activeTab === 'dynamic'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Sparkles className="h-4 w-4" />
                  Dynamic Questionnaire
                </button>
                <button
                  onClick={() => setActiveTab('blueprint')}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                    activeTab === 'blueprint'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <FileText className="h-4 w-4" />
                  Blueprint
                </button>
              </div>
            </GlassCard>
          </motion.div>

          {/* Tab Content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <GlassCard className="p-6">
              {activeTab === 'static' && (
                <div>
                  <h2 className="mb-6 text-2xl font-bold text-white">
                    Static Questionnaire Answers
                  </h2>
                  <StaticQuestionnaireView staticAnswers={blueprint.static_answers} />
                </div>
              )}

              {activeTab === 'dynamic' && (
                <div>
                  <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white">Dynamic Questionnaire</h2>
                    <div className="flex gap-2">
                      {isEditingDynamic ? (
                        <>
                          <Button
                            variant="outline"
                            onClick={handleCancelEditDynamic}
                            disabled={savingDynamicAnswers}
                            className="border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 disabled:opacity-50"
                          >
                            <X className="mr-2 h-4 w-4" />
                            Cancel
                          </Button>
                          <Button
                            variant="outline"
                            onClick={handleSaveDynamicAnswers}
                            disabled={savingDynamicAnswers}
                            className="border-green-500/20 bg-green-500/10 text-green-400 hover:bg-green-500/20 disabled:opacity-50"
                          >
                            {savingDynamicAnswers ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Save className="mr-2 h-4 w-4" />
                            )}
                            Save Changes
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={handleStartEditDynamic}
                            className="border-cyan-500/20 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20"
                            title="Edit Dynamic Answers"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={handleRegenerateDynamicQuestions}
                            disabled={regeneratingQuestions}
                            className="border-cyan-500/20 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 disabled:opacity-50"
                            title="Regenerate Dynamic Questionnaire"
                          >
                            <RefreshCw
                              className={`h-4 w-4 ${regeneratingQuestions ? 'animate-spin' : ''}`}
                            />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  <DynamicQuestionnaireView
                    dynamicQuestions={blueprint.dynamic_questions}
                    dynamicAnswers={
                      isEditingDynamic ? editedDynamicAnswers : blueprint.dynamic_answers
                    }
                    isEditing={isEditingDynamic}
                    onUpdateAnswer={handleUpdateDynamicAnswer}
                  />
                </div>
              )}

              {activeTab === 'blueprint' && (
                <div>
                  <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white">Generated Blueprint</h2>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleGenerateShareLink}
                        disabled={generatingShare || !blueprint.blueprint_json}
                        className="border-cyan-500/20 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 disabled:opacity-50"
                        title="Share Blueprint"
                      >
                        <Share2 className={`h-4 w-4 ${generatingShare ? 'animate-pulse' : ''}`} />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleRegenerateBlueprint}
                        disabled={regeneratingBlueprint}
                        className="border-purple-500/20 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 disabled:opacity-50"
                        title="Regenerate Blueprint"
                      >
                        <RefreshCw
                          className={`h-4 w-4 ${regeneratingBlueprint ? 'animate-spin' : ''}`}
                        />
                      </Button>
                    </div>
                  </div>
                  {blueprint.blueprint_json && Object.keys(blueprint.blueprint_json).length > 0 ? (
                    <div className="space-y-8">
                      {/* Executive Summary Section */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.4 }}
                        className="relative"
                      >
                        <h2 className="mb-4 text-xl font-semibold text-white">Executive Summary</h2>
                        <div className="space-y-4">
                          {(() => {
                            const blueprintData = blueprint.blueprint_json as any;
                            const executiveSummary =
                              blueprintData?.executive_summary?.content ||
                              blueprintData?.executive_summary ||
                              'No executive summary available.';

                            return executiveSummary
                              .split(/\.\s+/)
                              .filter(Boolean)
                              .map((sentence: string, index: number) => (
                                <p
                                  key={index}
                                  className="text-lg leading-relaxed text-white/90 sm:text-xl"
                                >
                                  {sentence.trim()}
                                  {sentence.trim().endsWith('.') ? '' : '.'}
                                </p>
                              ));
                          })()}
                        </div>
                      </motion.div>

                      {/* Blueprint Dashboard */}
                      <InteractiveBlueprintDashboard
                        blueprint={blueprint.blueprint_json as BlueprintJSON}
                        blueprintId={blueprint.id}
                        isPublicView={true}
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-white/60">
                      <FileText className="mb-4 h-12 w-12 text-white/40" />
                      <p>Blueprint has not been generated yet</p>
                    </div>
                  )}
                </div>
              )}
            </GlassCard>
          </motion.div>
        </div>

        {/* Share Dialog */}
        {showShareDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowShareDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <GlassCard className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/20">
                      <Share2 className="h-5 w-5 text-cyan-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">Share Blueprint</h3>
                  </div>
                  <button
                    onClick={() => setShowShareDialog(false)}
                    className="rounded-lg p-1 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <p className="mb-4 text-sm text-white/70">
                  Anyone with this link can view the blueprint. The link does not expire.
                </p>

                <div className="space-y-4">
                  <div className="flex gap-2">
                    <div className="flex-1 overflow-hidden rounded-lg border border-white/10 bg-white/5 px-4 py-3">
                      <p className="truncate text-sm text-white">{shareUrl}</p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={handleCopyShareLink}
                      className="border-cyan-500/20 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20"
                    >
                      {copiedShareLink ? (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="mr-2 h-4 w-4" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowShareDialog(false)}
                      className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                    >
                      Close
                    </Button>
                    <a
                      href={shareUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg border border-cyan-500/20 bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2 text-sm font-medium text-white transition-all hover:from-cyan-600 hover:to-blue-600"
                    >
                      Open Link
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </a>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
