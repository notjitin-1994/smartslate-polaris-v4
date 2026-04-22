/**
 * New Report Dialog
 * Modal for creating a new custom report
 */

'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ReportBuilder } from './ReportBuilder';
import type { CustomReport } from '@/store/blueprintStore';

interface Section {
  id: string;
  title: string;
  type: string;
  content: any;
}

interface NewReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sections: Section[];
  pinnedSections: string[];
  onCreateReport: (report: Omit<CustomReport, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export function NewReportDialog({
  isOpen,
  onClose,
  sections,
  pinnedSections,
  onCreateReport,
}: NewReportDialogProps): React.JSX.Element {
  const handleSave = (report: Omit<CustomReport, 'id' | 'createdAt' | 'updatedAt'>) => {
    onCreateReport(report);
    onClose();
  };

  if (!isOpen) return <></>;

  return (
    <AnimatePresence>
      <ReportBuilder
        sections={sections}
        pinnedSections={pinnedSections}
        onSave={handleSave}
        onCancel={onClose}
      />
    </AnimatePresence>
  );
}
