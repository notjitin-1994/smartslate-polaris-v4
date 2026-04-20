'use client';

import { useEffect, useState } from 'react';
import { useUIStore } from '@/lib/stores/uiStore';
import { useBlueprintStore } from '@/lib/stores/blueprintStore';
import { resumeWorkflowIntegration } from '@/lib/stores/resumeWorkflow';
import { ResumeDialog } from './ResumeDialog';

interface ResumeWorkflowProviderProps {
  children: React.ReactNode;
}

export function ResumeWorkflowProvider({ children }: ResumeWorkflowProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const uiStore = useUIStore();
  const blueprintStore = useBlueprintStore();

  // Initialize resume workflow on app start
  useEffect(() => {
    if (!isInitialized) {
      resumeWorkflowIntegration.initialize(blueprintStore, uiStore);
      setIsInitialized(true);
    }
  }, [isInitialized, blueprintStore, uiStore]);

  // Handle resume selection
  const handleResume = (blueprintId: string) => {
    resumeWorkflowIntegration.handleResume(blueprintId, blueprintStore, uiStore);
  };

  // Handle start fresh
  const handleStartFresh = (blueprintId: string) => {
    resumeWorkflowIntegration.handleStartFresh(blueprintId, uiStore);
  };

  // Close resume dialog
  const handleCloseResumeDialog = () => {
    uiStore.closeModal('resumeDialog');
  };

  return (
    <>
      {children}
      <ResumeDialog
        isOpen={uiStore.modals.resumeDialog}
        onClose={handleCloseResumeDialog}
        onResume={handleResume}
        onStartFresh={handleStartFresh}
      />
    </>
  );
}
