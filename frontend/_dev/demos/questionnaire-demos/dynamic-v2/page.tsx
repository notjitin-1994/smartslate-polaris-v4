'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StandardHeader } from '@/components/layout/StandardHeader';
import { DynamicQuestionnaireProgress } from '@/components/demo-dynamicv2/DynamicQuestionnaireProgress';
import { DynamicQuestionRenderer } from '@/components/demo-dynamicv2/DynamicQuestionRenderer';
import { QuestionnaireButton } from '@/components/demo-v2-questionnaire/QuestionnaireButton';

// Type definitions
interface QuestionOption {
  value: string;
  label: string;
  description?: string;
  icon?: string;
}

interface ScaleConfig {
  min: number;
  max: number;
  minLabel?: string;
  maxLabel?: string;
  labels?: string[];
  step?: number;
}

interface SliderConfig {
  min: number;
  max: number;
  step: number;
  unit: string;
  markers?: number[];
}

interface ValidationRule {
  rule: string;
  value?: number;
  message: string;
}

interface Question {
  id: string;
  label: string;
  type: string;
  required: boolean;
  helpText?: string;
  placeholder?: string;
  options?: QuestionOption[];
  scaleConfig?: ScaleConfig;
  sliderConfig?: SliderConfig;
  validation?: ValidationRule[];
  metadata?: Record<string, unknown>;
}

interface Section {
  id: string;
  title: string;
  description: string;
  order: number;
  questions: Question[];
}

interface DynamicQuestionnaire {
  metadata: {
    title: string;
    scenario: string;
    description: string;
    generatedAt: string;
    contextUtilization: Record<string, string>;
  };
  sections: Section[];
}

export default function DemoDynamicV2Page(): React.JSX.Element {
  const [questionnaire, setQuestionnaire] = useState<DynamicQuestionnaire | null>(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load sample questionnaire
  useEffect(() => {
    const loadQuestionnaire = async () => {
      try {
        const response = await fetch('/sample-questionnaires/healthcare-hipaa-compliance.json');
        if (!response.ok) {
          throw new Error('Failed to load questionnaire');
        }
        const data = await response.json();
        setQuestionnaire(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load questionnaire');
      } finally {
        setIsLoading(false);
      }
    };

    loadQuestionnaire();
  }, []);

  const handleAnswerChange = (questionId: string, value: unknown) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const goToNextSection = () => {
    if (questionnaire && currentSection < questionnaire.sections.length - 1) {
      setCurrentSection((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToPreviousSection = () => {
    if (currentSection > 0) {
      setCurrentSection((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = () => {
    console.log('Questionnaire submitted with answers:', answers);
    alert('Dynamic questionnaire completed! Answers logged to console.');
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020C1B]">
        <div className="space-y-4 text-center">
          <div className="border-primary mx-auto h-12 w-12 animate-spin rounded-full border-b-2" />
          <p className="text-white/70">Loading questionnaire...</p>
        </div>
      </div>
    );
  }

  if (error || !questionnaire) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020C1B]">
        <div className="glass-card max-w-md p-8">
          <h2 className="text-error mb-4 text-xl font-bold">Error Loading Questionnaire</h2>
          <p className="text-white/70">{error || 'Questionnaire not found'}</p>
        </div>
      </div>
    );
  }

  const currentSectionData = questionnaire.sections[currentSection];
  const progress = (currentSection / (questionnaire.sections.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-[#020C1B]">
      <StandardHeader
        title="Dynamic Questionnaire Demo (v2.0)"
        backHref="/"
        backLabel="Back to Dashboard"
        backButtonStyle="icon-only"
        showDarkModeToggle={false}
        showUserAvatar={false}
        size="compact"
        user={undefined}
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
          <div className="max-w-6xl text-left">
            {/* Main Title */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="mb-8"
            >
              <h1 className="font-heading lg:text-10xl text-7xl font-bold tracking-tight text-white sm:text-8xl md:text-9xl">
                <span>Dynamic </span>
                <span className="text-primary">Blueprint</span>
              </h1>
            </motion.div>

            {/* Subtitle */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="mb-12"
            >
              <p className="text-xl leading-relaxed text-white/70 sm:text-2xl lg:text-3xl">
                <span className="text-primary font-medium">{questionnaire.metadata.scenario}</span>{' '}
                - {questionnaire.metadata.description}
              </p>
            </motion.div>

            {/* Decorative Line */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1, delay: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="bg-primary mt-16 h-px w-24"
            />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="w-full px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="glass-card space-y-8 p-8 md:p-10"
          >
            {/* Progress Indicator */}
            <DynamicQuestionnaireProgress
              currentStep={currentSection}
              totalSteps={questionnaire.sections.length}
              sections={questionnaire.sections}
              progress={progress}
            />

            {/* Current Section */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSection}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-7"
              >
                {/* Render Questions */}
                {currentSectionData.questions.map((question, index) => (
                  <motion.div
                    key={question.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <DynamicQuestionRenderer
                      question={question}
                      value={answers[question.id]}
                      onChange={(value) => handleAnswerChange(question.id, value)}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-end border-t border-white/10 pt-8">
              <div className="flex items-center gap-3">
                {currentSection > 0 && (
                  <QuestionnaireButton type="button" onClick={goToPreviousSection} variant="ghost">
                    Previous
                  </QuestionnaireButton>
                )}
                {currentSection < questionnaire.sections.length - 1 ? (
                  <QuestionnaireButton type="button" onClick={goToNextSection} variant="primary">
                    Next Section
                  </QuestionnaireButton>
                ) : (
                  <QuestionnaireButton type="button" onClick={handleSubmit} variant="primary">
                    Complete Questionnaire
                  </QuestionnaireButton>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
