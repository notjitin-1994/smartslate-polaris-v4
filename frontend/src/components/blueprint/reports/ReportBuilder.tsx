/**
 * Report Builder Component
 * Drag-drop interface for creating custom reports
 */

'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useDndContext,
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Plus,
  Save,
  Download,
  Share2,
  Layout,
  FileText,
  Presentation,
  Palette,
  Type,
  Spacing,
  GripVertical,
  X,
  Check,
  Wand2,
  Eye,
  Settings,
} from 'lucide-react';
import {
  glassCard,
  glassPanel,
  itemAnimations,
  microInteractions,
  cn,
  typographyPresets,
  componentStyles,
  elevation,
} from '@/lib/design-system';
import type { CustomReport, ReportTheme } from '@/store/blueprintStore';

interface Section {
  id: string;
  title: string;
  type: string;
  content: any;
}

interface ReportBuilderProps {
  sections: Section[];
  pinnedSections: string[];
  onSave: (report: Omit<CustomReport, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

interface DraggableSection extends Section {
  sortId: string;
}

function SortableSection({ section }: { section: DraggableSection }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.sortId,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      className={cn(glassCard.base, 'group relative p-4', isDragging && 'opacity-50')}
      layout
      layoutId={section.sortId}
    >
      <div className="flex items-start gap-3">
        <button
          {...attributes}
          {...listeners}
          className={cn(
            'mt-0.5 cursor-grab touch-none rounded p-1',
            'text-text-secondary hover:text-foreground',
            'hover:bg-white/10 active:cursor-grabbing'
          )}
        >
          <GripVertical className="h-5 w-5" />
        </button>

        <div className="flex-1">
          <h4 className="text-foreground font-medium">{section.title}</h4>
          <p className="text-text-secondary text-xs">{section.type} section</p>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            // Section removal will be handled
          }}
          className={cn(
            'opacity-0 group-hover:opacity-100',
            'text-text-secondary rounded p-1',
            'hover:text-error hover:bg-white/10',
            'transition-all'
          )}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}

export function ReportBuilder({
  sections,
  pinnedSections,
  onSave,
  onCancel,
}: ReportBuilderProps): React.JSX.Element {
  const [reportSections, setReportSections] = useState<DraggableSection[]>(() =>
    pinnedSections
      .map((id) => sections.find((s) => s.id === id))
      .filter(Boolean)
      .map((section, index) => ({
        ...section!,
        sortId: `section-${index}`,
      }))
  );

  const [reportConfig, setReportConfig] = useState({
    name: '',
    description: '',
    layout: 'dashboard' as const,
    theme: {
      primaryColor: '#a7dada',
      accentColor: '#e6b89c',
      fontFamily: 'Inter',
      spacing: 'normal' as const,
    },
  });

  const [activeId, setActiveId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [currentStep, setCurrentStep] = useState<'sections' | 'config' | 'theme'>('sections');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setReportSections((items) => {
        const oldIndex = items.findIndex((i) => i.sortId === active.id);
        const newIndex = items.findIndex((i) => i.sortId === over?.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }

    setActiveId(null);
  };

  const addSection = (section: Section) => {
    const newSection: DraggableSection = {
      ...section,
      sortId: `section-${reportSections.length}`,
    };
    setReportSections([...reportSections, newSection]);
  };

  const removeSection = (sortId: string) => {
    setReportSections(reportSections.filter((s) => s.sortId !== sortId));
  };

  const handleSave = () => {
    if (reportConfig.name && reportSections.length > 0) {
      onSave({
        name: reportConfig.name,
        description: reportConfig.description,
        sections: reportSections.map((s) => s.id),
        layout: reportConfig.layout,
        theme: reportConfig.theme,
      });
    }
  };

  const steps = [
    { id: 'sections', label: 'Select Sections', icon: Layout },
    { id: 'config', label: 'Configure Report', icon: Settings },
    { id: 'theme', label: 'Customize Theme', icon: Palette },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={cn(
          glassPanel.floating,
          elevation.xl,
          'relative h-full max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-3xl'
        )}
      >
        {/* Header */}
        <div className="border-b border-white/10 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className={cn(typographyPresets.articleTitle, 'text-foreground')}>
                Create Custom Report
              </h2>
              <p className="text-text-secondary mt-1 text-sm">
                Build a personalized report from your blueprint sections
              </p>
            </div>

            <div className="flex items-center gap-2">
              <motion.button
                {...microInteractions.buttonPress}
                onClick={() => setShowPreview(!showPreview)}
                className={cn(
                  componentStyles.button.base,
                  componentStyles.button.variants.ghost,
                  componentStyles.button.sizes.sm
                )}
              >
                <Eye className="h-4 w-4" />
                <span>Preview</span>
              </motion.button>

              <motion.button
                {...microInteractions.buttonPress}
                onClick={onCancel}
                className={cn(
                  componentStyles.button.base,
                  componentStyles.button.variants.ghost,
                  componentStyles.button.sizes.sm
                )}
              >
                Cancel
              </motion.button>
            </div>
          </div>

          {/* Steps */}
          <div className="mt-6 flex items-center gap-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = steps.findIndex((s) => s.id === currentStep) > index;

              return (
                <button
                  key={step.id}
                  onClick={() => setCurrentStep(step.id as typeof currentStep)}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-4 py-2',
                    'text-sm font-medium transition-all',
                    isActive
                      ? 'bg-primary/20 text-primary'
                      : isCompleted
                        ? 'text-success hover:bg-white/5'
                        : 'text-text-secondary hover:bg-white/5'
                  )}
                >
                  {isCompleted ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  <span>{step.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <AnimatePresence mode="wait">
              {currentStep === 'sections' && (
                <motion.div
                  key="sections"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="grid grid-cols-2 gap-6"
                >
                  {/* Available Sections */}
                  <div>
                    <h3 className={cn(typographyPresets.labelText, 'text-foreground mb-4')}>
                      Available Sections
                    </h3>
                    <div className="space-y-2">
                      {sections
                        .filter((s) => !reportSections.some((rs) => rs.id === s.id))
                        .map((section) => (
                          <motion.div
                            key={section.id}
                            {...microInteractions.cardHover}
                            className={cn(
                              glassCard.base,
                              'cursor-pointer p-4',
                              'hover:border-primary/30'
                            )}
                            onClick={() => addSection(section)}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="text-foreground font-medium">{section.title}</h4>
                                <p className="text-text-secondary text-xs">{section.type}</p>
                              </div>
                              <Plus className="text-primary h-4 w-4" />
                            </div>
                          </motion.div>
                        ))}
                    </div>
                  </div>

                  {/* Report Sections */}
                  <div>
                    <h3 className={cn(typographyPresets.labelText, 'text-foreground mb-4')}>
                      Report Sections
                    </h3>
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={reportSections.map((s) => s.sortId)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-2">
                          {reportSections.map((section) => (
                            <SortableSection key={section.sortId} section={section} />
                          ))}
                        </div>
                      </SortableContext>

                      <DragOverlay>
                        {activeId ? (
                          <div className={cn(glassCard.premium, 'p-4')}>
                            {reportSections.find((s) => s.sortId === activeId)?.title}
                          </div>
                        ) : null}
                      </DragOverlay>
                    </DndContext>

                    {reportSections.length === 0 && (
                      <div className={cn(glassCard.base, 'border-dashed p-8 text-center')}>
                        <p className="text-text-secondary text-sm">
                          Add sections to build your report
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {currentStep === 'config' && (
                <motion.div
                  key="config"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="max-w-2xl space-y-6"
                >
                  <div>
                    <label className={cn(typographyPresets.labelText, 'mb-2 block')}>
                      Report Name
                    </label>
                    <input
                      type="text"
                      value={reportConfig.name}
                      onChange={(e) => setReportConfig({ ...reportConfig, name: e.target.value })}
                      placeholder="e.g., Executive Summary"
                      className={cn(
                        componentStyles.input.base,
                        componentStyles.input.variants.glass,
                        componentStyles.input.sizes.md
                      )}
                    />
                  </div>

                  <div>
                    <label className={cn(typographyPresets.labelText, 'mb-2 block')}>
                      Description
                    </label>
                    <textarea
                      value={reportConfig.description}
                      onChange={(e) =>
                        setReportConfig({ ...reportConfig, description: e.target.value })
                      }
                      placeholder="Brief description of your report..."
                      rows={3}
                      className={cn(
                        componentStyles.input.base,
                        componentStyles.input.variants.glass,
                        componentStyles.input.sizes.md,
                        'resize-none'
                      )}
                    />
                  </div>

                  <div>
                    <label className={cn(typographyPresets.labelText, 'mb-2 block')}>
                      Layout Style
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { id: 'dashboard', label: 'Dashboard', icon: Layout },
                        { id: 'document', label: 'Document', icon: FileText },
                        { id: 'presentation', label: 'Presentation', icon: Presentation },
                      ].map((layout) => {
                        const Icon = layout.icon;
                        const isSelected = reportConfig.layout === layout.id;

                        return (
                          <button
                            key={layout.id}
                            onClick={() =>
                              setReportConfig({ ...reportConfig, layout: layout.id as any })
                            }
                            className={cn(
                              glassCard.base,
                              'flex flex-col items-center gap-2 p-4',
                              isSelected
                                ? 'border-primary/50 bg-primary/10'
                                : 'hover:border-white/20'
                            )}
                          >
                            <Icon
                              className={cn(
                                'h-8 w-8',
                                isSelected ? 'text-primary' : 'text-text-secondary'
                              )}
                            />
                            <span
                              className={cn(
                                'text-sm font-medium',
                                isSelected ? 'text-primary' : 'text-text-secondary'
                              )}
                            >
                              {layout.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 'theme' && (
                <motion.div
                  key="theme"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="max-w-2xl space-y-6"
                >
                  <div>
                    <label className={cn(typographyPresets.labelText, 'mb-2 block')}>
                      Primary Color
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="color"
                        value={reportConfig.theme.primaryColor}
                        onChange={(e) =>
                          setReportConfig({
                            ...reportConfig,
                            theme: { ...reportConfig.theme, primaryColor: e.target.value },
                          })
                        }
                        className="h-12 w-12 cursor-pointer rounded-lg border border-white/20"
                      />
                      <input
                        type="text"
                        value={reportConfig.theme.primaryColor}
                        onChange={(e) =>
                          setReportConfig({
                            ...reportConfig,
                            theme: { ...reportConfig.theme, primaryColor: e.target.value },
                          })
                        }
                        className={cn(
                          componentStyles.input.base,
                          componentStyles.input.variants.glass,
                          componentStyles.input.sizes.sm,
                          'w-32'
                        )}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={cn(typographyPresets.labelText, 'mb-2 block')}>
                      Font Family
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {['Inter', 'Lora', 'JetBrains Mono'].map((font) => (
                        <button
                          key={font}
                          onClick={() =>
                            setReportConfig({
                              ...reportConfig,
                              theme: { ...reportConfig.theme, fontFamily: font },
                            })
                          }
                          className={cn(
                            'rounded-lg px-4 py-2 text-sm',
                            reportConfig.theme.fontFamily === font
                              ? 'bg-primary/20 text-primary'
                              : 'text-text-secondary hover:text-foreground bg-white/5'
                          )}
                          style={{ fontFamily: font }}
                        >
                          {font}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className={cn(typographyPresets.labelText, 'mb-2 block')}>Spacing</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['tight', 'normal', 'relaxed'] as const).map((spacing) => (
                        <button
                          key={spacing}
                          onClick={() =>
                            setReportConfig({
                              ...reportConfig,
                              theme: { ...reportConfig.theme, spacing },
                            })
                          }
                          className={cn(
                            'rounded-lg px-4 py-2 text-sm capitalize',
                            reportConfig.theme.spacing === spacing
                              ? 'bg-primary/20 text-primary'
                              : 'text-text-secondary hover:text-foreground bg-white/5'
                          )}
                        >
                          {spacing}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Preview Panel */}
          <AnimatePresence>
            {showPreview && (
              <motion.aside
                initial={{ x: 400, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 400, opacity: 0 }}
                className={cn(glassPanel.sidebar, 'w-96 border-l border-white/10 p-6')}
              >
                <h3 className={cn(typographyPresets.labelText, 'text-foreground mb-4')}>Preview</h3>
                <div className={cn(glassCard.base, 'p-4')}>
                  <h4 className="text-foreground mb-2 font-medium">
                    {reportConfig.name || 'Untitled Report'}
                  </h4>
                  <p className="text-text-secondary mb-4 text-sm">
                    {reportConfig.description || 'No description'}
                  </p>
                  <div className="space-y-2">
                    <p className="text-text-secondary text-xs">
                      {reportSections.length} sections • {reportConfig.layout} layout
                    </p>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-4 w-4 rounded"
                        style={{ backgroundColor: reportConfig.theme.primaryColor }}
                      />
                      <span className="text-text-secondary text-xs">
                        {reportConfig.theme.fontFamily} • {reportConfig.theme.spacing} spacing
                      </span>
                    </div>
                  </div>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 p-6">
          <div className="flex items-center justify-between">
            <div className="text-text-secondary text-sm">
              {reportSections.length} sections selected
            </div>

            <div className="flex items-center gap-4">
              {currentStep !== 'sections' && (
                <button
                  onClick={() => {
                    const currentIndex = steps.findIndex((s) => s.id === currentStep);
                    if (currentIndex > 0) {
                      setCurrentStep(steps[currentIndex - 1].id as typeof currentStep);
                    }
                  }}
                  className={cn(
                    componentStyles.button.base,
                    componentStyles.button.variants.ghost,
                    componentStyles.button.sizes.md
                  )}
                >
                  Back
                </button>
              )}

              {currentStep !== 'theme' ? (
                <button
                  onClick={() => {
                    const currentIndex = steps.findIndex((s) => s.id === currentStep);
                    if (currentIndex < steps.length - 1) {
                      setCurrentStep(steps[currentIndex + 1].id as typeof currentStep);
                    }
                  }}
                  className={cn(
                    componentStyles.button.base,
                    componentStyles.button.variants.primary,
                    componentStyles.button.sizes.md
                  )}
                  disabled={currentStep === 'sections' && reportSections.length === 0}
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSave}
                  className={cn(
                    componentStyles.button.base,
                    componentStyles.button.variants.primary,
                    componentStyles.button.sizes.md
                  )}
                  disabled={!reportConfig.name || reportSections.length === 0}
                >
                  <Save className="h-4 w-4" />
                  <span>Create Report</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
