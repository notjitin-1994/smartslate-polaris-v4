'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Download,
  Share2,
  Edit3,
  Eye,
  Settings,
  ChevronRight,
  ChevronDown,
  BookOpen,
  Target,
  Users,
  Calendar,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BlueprintSection {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface BlueprintViewerSidebarProps {
  blueprintTitle?: string;
  createdDate?: string;
  onExportPDF?: () => void;
  onExportWord?: () => void;
  onShare?: () => void;
  onRename?: () => void;
  className?: string;
}

const blueprintSections: BlueprintSection[] = [
  { id: 'overview', title: 'Overview', icon: FileText },
  { id: 'objectives', title: 'Learning Objectives', icon: Target },
  { id: 'audience', title: 'Target Audience', icon: Users },
  { id: 'timeline', title: 'Timeline & Milestones', icon: Calendar },
  { id: 'assessment', title: 'Assessment Strategy', icon: BarChart3 },
  { id: 'resources', title: 'Resources & Materials', icon: BookOpen },
];

export function BlueprintViewerSidebar({
  blueprintTitle,
  createdDate,
  onExportPDF,
  onExportWord,
  onShare,
  onRename,
  className,
}: BlueprintViewerSidebarProps) {
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [expandedSections, setExpandedSections] = useState({
    navigation: true,
    actions: true,
  });

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <aside
      className={cn(
        'hidden w-80 flex-col border-r border-white/10 bg-slate-900/95 backdrop-blur-sm lg:flex',
        className
      )}
    >
      {/* Header */}
      <div className="flex-shrink-0 border-b border-white/10 p-6">
        <h2 className="text-foreground mb-2 text-lg font-semibold">Blueprint Tools</h2>
        {blueprintTitle && <p className="text-text-secondary truncate text-sm">{blueprintTitle}</p>}
        {createdDate && <p className="text-text-disabled mt-1 text-xs">Created {createdDate}</p>}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 space-y-6 overflow-y-auto p-4">
        {/* Navigation Sections */}
        <div>
          <button
            onClick={() =>
              setExpandedSections((prev) => ({ ...prev, navigation: !prev.navigation }))
            }
            className="flex w-full items-center justify-between rounded-lg p-3 text-left transition-colors hover:bg-white/5"
          >
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="text-foreground text-sm font-medium">Navigation</span>
            </div>
            {expandedSections.navigation ? (
              <ChevronDown className="text-text-secondary h-4 w-4" />
            ) : (
              <ChevronRight className="text-text-secondary h-4 w-4" />
            )}
          </button>

          <AnimatePresence>
            {expandedSections.navigation && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 space-y-1"
              >
                {blueprintSections.map((section) => {
                  const Icon = section.icon;
                  const isActive = activeSection === section.id;

                  return (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg p-3 text-left transition-all duration-200',
                        isActive
                          ? 'bg-primary/20 text-primary border-primary border-l-2'
                          : 'text-text-secondary hover:text-foreground hover:bg-white/5'
                      )}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <span className="text-sm">{section.title}</span>
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Actions */}
        <div>
          <button
            onClick={() => setExpandedSections((prev) => ({ ...prev, actions: !prev.actions }))}
            className="flex w-full items-center justify-between rounded-lg p-3 text-left transition-colors hover:bg-white/5"
          >
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="text-foreground text-sm font-medium">Actions</span>
            </div>
            {expandedSections.actions ? (
              <ChevronDown className="text-text-secondary h-4 w-4" />
            ) : (
              <ChevronRight className="text-text-secondary h-4 w-4" />
            )}
          </button>

          <AnimatePresence>
            {expandedSections.actions && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 space-y-2"
              >
                {onRename && (
                  <button
                    onClick={onRename}
                    className="text-text-secondary hover:text-foreground flex w-full items-center gap-3 rounded-lg p-3 text-left transition-all duration-200 hover:bg-white/5"
                  >
                    <Edit3 className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm">Rename Blueprint</span>
                  </button>
                )}

                {onShare && (
                  <button
                    onClick={onShare}
                    className="text-text-secondary hover:text-foreground flex w-full items-center gap-3 rounded-lg p-3 text-left transition-all duration-200 hover:bg-white/5"
                  >
                    <Share2 className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm">Share Blueprint</span>
                  </button>
                )}

                <div className="border-t border-white/10 pt-2">
                  <p className="text-text-disabled mb-2 px-3 text-xs">Export Options</p>

                  {onExportWord && (
                    <button
                      onClick={onExportWord}
                      className="text-text-secondary hover:text-foreground flex w-full items-center gap-3 rounded-lg p-3 text-left transition-all duration-200 hover:bg-white/5"
                    >
                      <Download className="h-4 w-4 flex-shrink-0" />
                      <span className="text-sm">Export as Word</span>
                    </button>
                  )}

                  {onExportPDF && (
                    <button
                      onClick={onExportPDF}
                      className="text-text-secondary hover:text-foreground flex w-full items-center gap-3 rounded-lg p-3 text-left transition-all duration-200 hover:bg-white/5"
                    >
                      <Download className="h-4 w-4 flex-shrink-0" />
                      <span className="text-sm">Export as PDF</span>
                    </button>
                  )}
                </div>

                <div className="border-t border-white/10 pt-2">
                  <button
                    onClick={() => window.print()}
                    className="text-text-secondary hover:text-foreground flex w-full items-center gap-3 rounded-lg p-3 text-left transition-all duration-200 hover:bg-white/5"
                  >
                    <Eye className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm">Print View</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex-shrink-0 border-t border-white/10 p-4">
        <div className="text-center">
          <p className="text-text-disabled mb-2 text-xs">SmartSlate Polaris v3</p>
          <p className="text-text-disabled text-xs">AI-Powered Learning Blueprints</p>
        </div>
      </div>
    </aside>
  );
}
