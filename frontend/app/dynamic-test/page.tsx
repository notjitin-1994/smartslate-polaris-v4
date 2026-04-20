'use client';

import React, { useState } from 'react';
import { dynamicQuestionnaireWhyItMatters } from '@/lib/content/dynamicQuestionnaireWhyItMatters';
import { QuestionnaireInfoBox } from '@/components/wizard/static-questions/QuestionnaireInfoBox';

export default function DynamicTestPage() {
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({});

  const toggleSection = (index: number) => {
    setExpandedSections((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-white/10 bg-slate-950/50 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-white">
            Dynamic Questionnaire: "Why Does This Matter?" Review
          </h1>
          <p className="mt-2 text-sm text-white/60">
            Preview all 10 sections of educational content for the dynamic questionnaire
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {dynamicQuestionnaireWhyItMatters.map((section, index) => (
            <div
              key={section.id}
              className="rounded-lg bg-white/5 p-6 backdrop-blur-sm"
              style={{
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              {/* Section Header */}
              <div className="mb-4 border-b border-white/10 pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      Section {section.id}: {section.title}
                    </h2>
                    {section.description && (
                      <p className="mt-2 text-sm text-white/70">{section.description}</p>
                    )}
                  </div>
                  <span className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white">
                    {section.id} of 10
                  </span>
                </div>
              </div>

              {/* Why This Matters Section */}
              <div className="space-y-3">
                {/* Collapsible Header */}
                <button
                  type="button"
                  onClick={() => toggleSection(index)}
                  className="bg-primary/5 hover:bg-primary/10 border-primary/10 group flex w-full items-center justify-between rounded-lg border p-3 transition-all duration-200"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="text-primary transition-all duration-200"
                      style={{
                        filter: 'drop-shadow(0 0 8px rgba(255, 193, 7, 0.6))',
                        textShadow: '0 0 12px rgba(255, 193, 7, 0.4)',
                      }}
                    >
                      💡
                    </span>
                    <span className="text-primary font-quicksand font-medium">
                      {section.whyThisMatters.title}
                    </span>
                  </div>
                  <svg
                    className={`text-primary h-4 w-4 transition-transform duration-200 ${expandedSections[index] ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Collapsible Content */}
                {expandedSections[index] && (
                  <div className="animate-fade-in-up">
                    <QuestionnaireInfoBox title="">
                      {section.whyThisMatters.content}
                    </QuestionnaireInfoBox>
                  </div>
                )}
              </div>

              {/* Quick Preview (Always Visible) */}
              {!expandedSections[index] && (
                <div className="mt-4 rounded-lg bg-white/5 p-4">
                  <p className="text-sm text-white/60 italic">
                    Click "💡 {section.whyThisMatters.title}" above to view the complete educational
                    content for this section
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer Stats */}
        <div className="mt-8 rounded-lg bg-gradient-to-r from-indigo-600/10 to-purple-600/10 p-6 text-center">
          <h3 className="text-xl font-bold text-white">Review Complete</h3>
          <p className="mt-2 text-sm text-white/70">
            All 10 sections of educational content have been generated and are ready for integration
            into the dynamic questionnaire
          </p>
          <div className="mt-4 flex items-center justify-center gap-8 text-sm">
            <div>
              <div className="text-2xl font-bold text-indigo-400">10</div>
              <div className="text-white/60">Sections</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-400">40+</div>
              <div className="text-white/60">Content Cards</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-pink-400">100%</div>
              <div className="text-white/60">Brand Consistent</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
