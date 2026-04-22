'use client';

import { useState, useEffect } from 'react';
import { useUIStore, uiSelectors } from '@/lib/stores/uiStore';
import { useBlueprintStore } from '@/lib/stores/blueprintStore';
import { ResumeWorkflowManager, resumeUIHelpers } from '@/lib/stores/resumeWorkflow';
import type { ResumeData } from '@/lib/stores/types';

interface ResumeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onResume: (blueprintId: string) => void;
  onStartFresh: (blueprintId: string) => void;
}

export function ResumeDialog({ isOpen, onClose, onResume, onStartFresh }: ResumeDialogProps) {
  const [resumeData, setResumeData] = useState<ResumeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      const incompleteBlueprints = ResumeWorkflowManager.detectIncompleteBlueprints();
      setResumeData(incompleteBlueprints);
      setIsLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const promptData = resumeUIHelpers.getResumePromptData(resumeData);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass-strong max-h-modal mx-4 w-full max-w-2xl overflow-hidden rounded-2xl">
        <div className="border-b border-white/10 p-6">
          <h2 className="text-foreground text-2xl font-bold">Resume Your Work</h2>
          <p className="text-foreground/70 mt-2">
            You have {promptData.count} incomplete blueprint{promptData.count !== 1 ? 's' : ''} that
            you can resume.
          </p>
        </div>

        <div className="max-h-96 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="border-secondary h-8 w-8 animate-spin rounded-full border-b-2"></div>
              <span className="text-foreground/60 ml-2">Loading...</span>
            </div>
          ) : promptData.items.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-foreground/50">No incomplete blueprints found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {promptData.items.map((item) => (
                <ResumeItem
                  key={item.blueprintId}
                  item={item}
                  onResume={() => onResume(item.blueprintId)}
                  onStartFresh={() => onStartFresh(item.blueprintId)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 border-t border-white/10 p-6">
          <button
            onClick={onClose}
            className="text-foreground hover:glass focus-visible:ring-primary/50 rounded-lg px-6 py-2.5 transition-all duration-200 focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

interface ResumeItemProps {
  item: {
    blueprintId: string;
    progress: number;
    lastSaved: Date;
    timeAgo: string;
    canResume: boolean;
  };
  onResume: () => void;
  onStartFresh: () => void;
}

function ResumeItem({ item, onResume, onStartFresh }: ResumeItemProps) {
  const progressColor = resumeUIHelpers.getProgressColor(item.progress);
  const progressDescription = resumeUIHelpers.getProgressDescription(item.progress);

  return (
    <div className="glass hover:glass-strong rounded-2xl p-4 transition-all duration-300 hover:shadow-xl">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-foreground font-semibold">Blueprint {item.blueprintId}</h3>
          <p className="text-foreground/70 mt-1 text-sm">
            {progressDescription} • Last saved {item.timeAgo}
          </p>

          <div className="mt-3">
            <div className="text-foreground/60 mb-1 flex items-center justify-between text-sm">
              <span>Progress</span>
              <span>{item.progress}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-white/10">
              <div
                className={`h-2 rounded-full bg-${progressColor}-500 transition-all duration-300`}
                style={{ width: `${item.progress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="ml-4 flex space-x-2">
          {item.canResume && (
            <button
              onClick={onResume}
              className="bg-secondary hover:bg-secondary-dark focus-visible:ring-secondary/50 rounded-lg px-4 py-1.5 text-sm text-white transition-all duration-200 focus-visible:ring-2 focus-visible:outline-none"
            >
              Resume
            </button>
          )}
          <button
            onClick={onStartFresh}
            className="text-foreground hover:glass focus-visible:ring-primary/50 rounded-lg px-4 py-1.5 transition-all duration-200 focus-visible:ring-2 focus-visible:outline-none"
          >
            Start Fresh
          </button>
        </div>
      </div>
    </div>
  );
}
