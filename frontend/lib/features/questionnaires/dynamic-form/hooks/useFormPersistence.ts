'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { FormState, UseFormPersistenceReturn } from '../types';

interface UseFormPersistenceOptions {
  formId: string;
  autoSaveInterval?: number;
  storageKey?: string;
  onSave?: (data: FormState) => Promise<void>;
  onLoad?: () => Promise<FormState | null>;
  onError?: (error: Error) => void;
}

export const useFormPersistence = ({
  formId,
  autoSaveInterval = 2000,
  storageKey,
  onSave,
  onLoad,
  onError,
}: UseFormPersistenceOptions): UseFormPersistenceReturn => {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();
  const lastSavedDataRef = useRef<string>('');

  const storageKeyToUse = storageKey || `form-persistence-${formId}`;

  // Save form data
  const save = useCallback(
    async (data: FormState) => {
      if (isSaving) return;

      try {
        setIsSaving(true);
        setSaveStatus('saving');

        // Serialize data for comparison
        const serializedData = JSON.stringify(data);

        // Only save if data has changed
        if (serializedData === lastSavedDataRef.current) {
          setSaveStatus('saved');
          return;
        }

        // Save to localStorage as backup
        localStorage.setItem(storageKeyToUse, serializedData);

        // Call custom save function if provided
        if (onSave) {
          await onSave(data);
        }

        lastSavedDataRef.current = serializedData;
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
        setSaveStatus('saved');

        // Reset status after a delay
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (error) {
        console.error('Form save failed:', error);
        setSaveStatus('error');
        onError?.(error as Error);

        // Reset status after a delay
        setTimeout(() => setSaveStatus('idle'), 3000);
      } finally {
        setIsSaving(false);
      }
    },
    [isSaving, storageKeyToUse, onSave, onError]
  );

  // Load form data
  const load = useCallback(async (): Promise<FormState | null> => {
    try {
      // Try custom load function first
      if (onLoad) {
        const customData = await onLoad();
        if (customData) {
          lastSavedDataRef.current = JSON.stringify(customData);
          setLastSaved(new Date());
          return customData;
        }
      }

      // Fallback to localStorage
      const savedData = localStorage.getItem(storageKeyToUse);
      if (savedData) {
        const parsedData = JSON.parse(savedData) as FormState;
        lastSavedDataRef.current = savedData;
        setLastSaved(new Date());
        return parsedData;
      }

      return null;
    } catch (error) {
      console.error('Form load failed:', error);
      onError?.(error as Error);
      return null;
    }
  }, [storageKeyToUse, onLoad, onError]);

  // Clear form data
  const clear = useCallback(() => {
    try {
      localStorage.removeItem(storageKeyToUse);
      lastSavedDataRef.current = '';
      setLastSaved(null);
      setHasUnsavedChanges(false);
      setSaveStatus('idle');
    } catch (error) {
      console.error('Form clear failed:', error);
      onError?.(error as Error);
    }
  }, [storageKeyToUse, onError]);

  // Auto-save effect
  useEffect(() => {
    if (autoSaveInterval > 0 && hasUnsavedChanges) {
      autoSaveTimeoutRef.current = setTimeout(() => {
        // This would be called with current form data
        // The actual implementation would need to be provided by the parent component
      }, autoSaveInterval);

      return () => {
        if (autoSaveTimeoutRef.current) {
          clearTimeout(autoSaveTimeoutRef.current);
        }
      };
    }
  }, [autoSaveInterval, hasUnsavedChanges]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  return {
    isSaving,
    lastSaved,
    hasUnsavedChanges,
    saveStatus,
    save,
    load,
    clear,
  };
};

// Hook for managing form state with persistence
export const useFormState = (formId: string, initialData: Record<string, any> = {}) => {
  const [formData, setFormData] = useState<Record<string, any>>(initialData);
  const [currentSection, setCurrentSection] = useState<string>('');
  const [completedSections, setCompletedSections] = useState<string[]>([]);

  const updateFormData = useCallback((newData: Record<string, any>) => {
    setFormData((prev) => ({ ...prev, ...newData }));
  }, []);

  const setFieldValue = useCallback((fieldId: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
  }, []);

  const markSectionComplete = useCallback((sectionId: string) => {
    setCompletedSections((prev) => (prev.includes(sectionId) ? prev : [...prev, sectionId]));
  }, []);

  const markSectionIncomplete = useCallback((sectionId: string) => {
    setCompletedSections((prev) => prev.filter((id) => id !== sectionId));
  }, []);

  const resetForm = useCallback(() => {
    setFormData(initialData);
    setCurrentSection('');
    setCompletedSections([]);
  }, [initialData]);

  const getFormState = useCallback(
    (): FormState => ({
      formId,
      currentSection,
      answers: formData,
      progress: {
        completedSections,
        overallProgress: completedSections.length,
      },
      lastSaved: new Date().toISOString(),
      version: '1.0.0',
    }),
    [formId, currentSection, formData, completedSections]
  );

  return {
    formData,
    currentSection,
    completedSections,
    updateFormData,
    setFieldValue,
    setCurrentSection,
    markSectionComplete,
    markSectionIncomplete,
    resetForm,
    getFormState,
  };
};
