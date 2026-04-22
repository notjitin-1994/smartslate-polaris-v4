/**
 * Custom hook for auto-save functionality
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { JsonValue } from './types';

interface UseAutoSaveOptions {
  data: JsonValue;
  sectionTitle: string;
  enabled: boolean;
  interval?: number; // milliseconds
}

interface UseAutoSaveReturn {
  isDraftSaved: boolean;
  saveStatus: string | null;
  triggerAutoSave: () => void;
}

const AUTO_SAVE_INTERVAL = 30000; // 30 seconds
const STORAGE_PREFIX = 'blueprint_draft_';

export function useAutoSave({
  data,
  sectionTitle,
  enabled,
  interval = AUTO_SAVE_INTERVAL,
}: UseAutoSaveOptions): UseAutoSaveReturn {
  const [isDraftSaved, setIsDraftSaved] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedData = useRef<string | null>(null);

  const saveDraft = useCallback(() => {
    if (!data || !enabled) return;

    try {
      const dataStr = JSON.stringify(data);

      // Don't save if data hasn't changed
      if (dataStr === lastSavedData.current) {
        return;
      }

      const draftKey = `${STORAGE_PREFIX}${sectionTitle}`;
      const draftData = {
        data,
        timestamp: Date.now(),
        sectionTitle,
      };

      localStorage.setItem(draftKey, JSON.stringify(draftData));
      lastSavedData.current = dataStr;
      setIsDraftSaved(true);

      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });
      setSaveStatus(`Draft saved at ${timeStr}`);

      // Clear status after 3 seconds
      setTimeout(() => {
        setSaveStatus(null);
      }, 3000);
    } catch (err) {
      console.error('Error saving draft:', err);
      setSaveStatus('Failed to save draft');
    }
  }, [data, enabled, sectionTitle]);

  const triggerAutoSave = useCallback(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      saveDraft();
    }, interval);
  }, [saveDraft, interval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Load draft on mount
  useEffect(() => {
    if (!enabled || !sectionTitle) return;

    try {
      const draftKey = `${STORAGE_PREFIX}${sectionTitle}`;
      const savedDraft = localStorage.getItem(draftKey);

      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        const age = Date.now() - parsed.timestamp;
        const ageMinutes = Math.floor(age / 60000);

        if (ageMinutes < 60) {
          // Draft is less than 1 hour old
          setIsDraftSaved(true);
          setSaveStatus(`Draft from ${ageMinutes} min ago available`);
        }
      }
    } catch (err) {
      console.error('Error loading draft:', err);
    }
  }, [enabled, sectionTitle]);

  return {
    isDraftSaved,
    saveStatus,
    triggerAutoSave,
  };
}

/**
 * Utility to load a draft from localStorage
 */
export function loadDraft(sectionTitle: string): JsonValue | null {
  try {
    const draftKey = `${STORAGE_PREFIX}${sectionTitle}`;
    const savedDraft = localStorage.getItem(draftKey);

    if (savedDraft) {
      const parsed = JSON.parse(savedDraft);
      return parsed.data as JsonValue;
    }
  } catch (err) {
    console.error('Error loading draft:', err);
  }

  return null;
}

/**
 * Utility to clear a draft from localStorage
 */
export function clearDraft(sectionTitle: string): void {
  try {
    const draftKey = `${STORAGE_PREFIX}${sectionTitle}`;
    localStorage.removeItem(draftKey);
  } catch (err) {
    console.error('Error clearing draft:', err);
  }
}
