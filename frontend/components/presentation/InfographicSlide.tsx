/**
 * InfographicSlide - Visual representation of data
 * Converts raw data into visual infographics for presentations
 */

'use client';

import React from 'react';
import { PieChart, Users, Globe, Target, BookOpen, Clock, Phone } from 'lucide-react';
import type { ContentSlideContent } from '@/types/presentation';

interface InfographicData {
  displayType?: string;
  demographics?: any;
  work_context?: any;
  current_challenges?: any;
  learning_preferences?: any;
  [key: string]: any;
}

interface InfographicSlideProps {
  slide: ContentSlideContent;
}

// Helper to parse JSON content
function parseInfographicData(content: string | any): InfographicData | null {
  if (typeof content === 'object' && content !== null) {
    return content as InfographicData;
  }

  if (typeof content === 'string') {
    try {
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed === 'object') {
        return parsed as InfographicData;
      }
    } catch {
      // Not JSON, return null
    }
  }

  return null;
}

// Demographics Visualization Component
function DemographicsVisual({ data }: { data: any }) {
  if (!data) return null;

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Roles Distribution */}
      {data.roles && (
        <div className="glass-card-nested p-4">
          <div className="mb-3 flex items-center gap-2">
            <Users className="text-accent-teal h-5 w-5" />
            <h3 className="text-heading-sm text-primary font-semibold">Target Roles</h3>
          </div>
          <ul className="space-y-2">
            {data.roles.map((role: string, idx: number) => (
              <li key={idx} className="text-body text-secondary flex items-center gap-2">
                <span className="bg-accent-teal h-2 w-2 rounded-full" />
                {role}
              </li>
            ))}
          </ul>
          {data.total_learners && (
            <p className="text-text-tertiary mt-3 text-sm">Total Learners: {data.total_learners}</p>
          )}
        </div>
      )}

      {/* Geographic Distribution */}
      {data.geographic_distribution && (
        <div className="glass-card-nested p-4">
          <div className="mb-3 flex items-center gap-2">
            <Globe className="text-accent-teal h-5 w-5" />
            <h3 className="text-heading-sm text-primary font-semibold">Geographic Spread</h3>
          </div>
          <div className="space-y-2">
            {data.geographic_distribution.map((item: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-body text-secondary">{item.region}</span>
                <div className="flex items-center gap-2">
                  <div className="bg-background-tertiary h-2 w-24 overflow-hidden rounded-full">
                    <div
                      className="bg-accent-teal h-full transition-all duration-500"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                  <span className="text-text-tertiary w-10 text-right text-sm">
                    {item.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Experience Levels */}
      {data.experience_levels && (
        <div className="glass-card-nested p-4">
          <div className="mb-3 flex items-center gap-2">
            <Target className="text-accent-teal h-5 w-5" />
            <h3 className="text-heading-sm text-primary font-semibold">Experience Levels</h3>
          </div>
          <div className="space-y-2">
            {data.experience_levels.map((item: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-body text-secondary">{item.level}</span>
                <span className="text-accent-teal font-semibold">{item.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Department Distribution */}
      {data.department_distribution && (
        <div className="glass-card-nested p-4">
          <div className="mb-3 flex items-center gap-2">
            <Users className="text-accent-teal h-5 w-5" />
            <h3 className="text-heading-sm text-primary font-semibold">Departments</h3>
          </div>
          <div className="space-y-2">
            {data.department_distribution.map((item: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-body text-secondary">{item.department}</span>
                <span className="text-accent-teal font-semibold">{item.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Work Context Visualization
function WorkContextVisual({ data }: { data: any }) {
  if (!data) return null;

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Pressure Factors */}
      {data.pressure_factors && (
        <div className="glass-card-nested p-4">
          <h3 className="text-heading-sm text-primary mb-3 font-semibold">Key Pressure Points</h3>
          <ul className="space-y-2">
            {data.pressure_factors.map((factor: string, idx: number) => (
              <li key={idx} className="text-body text-secondary flex items-start gap-2">
                <span className="text-error mt-1">⚠️</span>
                {factor}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Work Metrics */}
      <div className="glass-card-nested space-y-3 p-4">
        <h3 className="text-heading-sm text-primary font-semibold">Work Metrics</h3>
        {data.weekly_call_volume && (
          <div className="flex items-center gap-3">
            <Phone className="text-accent-teal h-4 w-4" />
            <span className="text-body text-secondary">
              Weekly Calls:{' '}
              <span className="text-primary font-semibold">{data.weekly_call_volume}</span>
            </span>
          </div>
        )}
        {data.training_availability && (
          <div className="flex items-center gap-3">
            <Clock className="text-accent-teal h-4 w-4" />
            <span className="text-body text-secondary">
              Training Time:{' '}
              <span className="text-primary font-semibold">{data.training_availability}</span>
            </span>
          </div>
        )}
        {data.primary_locations && (
          <div className="mt-2">
            <p className="text-text-tertiary text-sm">Locations:</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {data.primary_locations.map((loc: string, idx: number) => (
                <span
                  key={idx}
                  className="bg-background-secondary text-primary rounded px-2 py-1 text-xs"
                >
                  {loc}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Motivation Drivers */}
      {data.motivation_drivers && (
        <div className="glass-card-nested col-span-2 p-4">
          <h3 className="text-heading-sm text-primary mb-3 font-semibold">Motivation Drivers</h3>
          <div className="flex flex-wrap gap-3">
            {data.motivation_drivers.map((driver: string, idx: number) => (
              <div
                key={idx}
                className="from-accent-teal/20 to-accent-purple/20 rounded-lg bg-gradient-to-r px-4 py-2"
              >
                <span className="text-body text-primary">{driver}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Learning Preferences Visualization
function LearningPreferencesVisual({ data }: { data: any }) {
  if (!data) return null;

  const colors = ['bg-accent-teal', 'bg-accent-purple', 'bg-accent-coral', 'bg-accent-gold'];

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Learning Modalities */}
      {data.modalities && (
        <div className="glass-card-nested p-4">
          <div className="mb-3 flex items-center gap-2">
            <BookOpen className="text-accent-teal h-5 w-5" />
            <h3 className="text-heading-sm text-primary font-semibold">Learning Styles</h3>
          </div>
          <div className="space-y-3">
            {data.modalities.map((item: any, idx: number) => (
              <div key={idx}>
                <div className="mb-1 flex justify-between">
                  <span className="text-body text-secondary">{item.type}</span>
                  <span className="text-text-tertiary text-sm">{item.percentage}%</span>
                </div>
                <div className="bg-background-tertiary h-3 w-full overflow-hidden rounded-full">
                  <div
                    className={`h-full ${colors[idx % colors.length]} transition-all duration-500`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Accessibility Needs */}
      {data.accessibility_needs && (
        <div className="glass-card-nested p-4">
          <h3 className="text-heading-sm text-primary mb-3 font-semibold">Accessibility Needs</h3>
          <div className="space-y-2">
            {data.accessibility_needs.map((item: any, idx: number) => (
              <div
                key={idx}
                className="bg-background-secondary flex items-center justify-between rounded p-2"
              >
                <span className="text-body text-secondary">{item.need}</span>
                <span className="text-accent-teal font-semibold">{item.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Main Infographic Slide Component
export function InfographicSlide({ slide }: InfographicSlideProps) {
  const data = parseInfographicData(slide.content);

  // If not infographic data, return normal content slide
  if (!data || !data.displayType) {
    return null;
  }

  return (
    <div className="glass-card h-full w-full space-y-6 overflow-auto p-8">
      <div>
        <h1 className="text-display text-primary mb-2 font-bold">{slide.title}</h1>
        {slide.subtitle && <p className="text-heading text-secondary">{slide.subtitle}</p>}
      </div>

      <div className="space-y-8">
        {data.demographics && (
          <div>
            <h2 className="text-heading text-primary mb-4 font-semibold">Learner Demographics</h2>
            <DemographicsVisual data={data.demographics} />
          </div>
        )}

        {data.work_context && (
          <div>
            <h2 className="text-heading text-primary mb-4 font-semibold">Work Context</h2>
            <WorkContextVisual data={data.work_context} />
          </div>
        )}

        {data.learning_preferences && (
          <div>
            <h2 className="text-heading text-primary mb-4 font-semibold">Learning Preferences</h2>
            <LearningPreferencesVisual data={data.learning_preferences} />
          </div>
        )}

        {data.current_challenges && (
          <div className="glass-card-nested p-4">
            <h2 className="text-heading text-primary mb-4 font-semibold">Current Challenges</h2>
            <div className="grid grid-cols-2 gap-4">
              {data.current_challenges.confidence_gaps && (
                <div>
                  <h4 className="text-accent-teal mb-1 text-sm font-semibold">Confidence Gaps</h4>
                  <p className="text-body text-secondary">
                    {data.current_challenges.confidence_gaps}
                  </p>
                </div>
              )}
              {data.current_challenges.skepticism_factors && (
                <div>
                  <h4 className="text-accent-teal mb-1 text-sm font-semibold">
                    Skepticism Factors
                  </h4>
                  <p className="text-body text-secondary">
                    {data.current_challenges.skepticism_factors}
                  </p>
                </div>
              )}
              {data.current_challenges.behavioral_patterns && (
                <div>
                  <h4 className="text-accent-teal mb-1 text-sm font-semibold">
                    Behavioral Patterns
                  </h4>
                  <p className="text-body text-secondary">
                    {data.current_challenges.behavioral_patterns}
                  </p>
                </div>
              )}
              {data.current_challenges.geographic_barriers && (
                <div>
                  <h4 className="text-accent-teal mb-1 text-sm font-semibold">
                    Geographic Barriers
                  </h4>
                  <p className="text-body text-secondary">
                    {data.current_challenges.geographic_barriers}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default InfographicSlide;
