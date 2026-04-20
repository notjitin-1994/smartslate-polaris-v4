import { useCallback, useEffect, useMemo, useRef } from 'react';
import debounce from 'lodash.debounce';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useWizardStore } from '@/store/wizardStore';
import type { StaticQuestionsFormValues } from '@/components/wizard/static-questions/types';

export function useAutoSave(userId: string | null) {
  const supabase = getSupabaseBrowserClient();
  const { values, setSaveState } = useWizardStore();

  const latestValues = useRef<StaticQuestionsFormValues>(values);
  useEffect(() => {
    latestValues.current = values;
  }, [values]);

  const save = useCallback(async () => {
    if (!userId) {
      console.log('[AutoSave] No userId, skipping save');
      return;
    }

    // Check if we have any data to save
    if (!latestValues.current || Object.keys(latestValues.current).length === 0) {
      console.log('[AutoSave] No data to save yet');
      return;
    }

    setSaveState('saving');
    console.log('[AutoSave] Starting save for userId:', userId);
    console.log('[AutoSave] Current values keys:', Object.keys(latestValues.current));

    try {
      // Verify user is authenticated with Supabase
      const {
        data: { user: supabaseUser },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !supabaseUser) {
        console.error('[AutoSave] User not authenticated in Supabase:', authError);
        throw new Error('User not authenticated');
      }
      console.log('[AutoSave] Supabase user confirmed:', supabaseUser.id);

      // Always read the latest store state to avoid stale closures
      const { blueprintId: currentBlueprintId, setBlueprintId } = useWizardStore.getState();
      let workingBlueprintId = currentBlueprintId;

      // If we don't have a blueprint ID yet, try to find an existing draft for this user first
      if (!workingBlueprintId) {
        console.log('[AutoSave] No blueprint ID, searching for existing draft');
        const { data: existingDraftRows, error: findError } = await supabase
          .from('blueprint_generator')
          .select('id')
          .eq('user_id', userId)
          .eq('status', 'draft')
          .order('created_at', { ascending: false })
          .limit(1);

        if (findError) {
          console.error('[AutoSave] Error finding existing draft:', findError);
          throw findError;
        }

        const existingDraft = existingDraftRows?.[0] ?? null;
        if (existingDraft) {
          workingBlueprintId = existingDraft.id as string;
          setBlueprintId(workingBlueprintId);
          console.log('[AutoSave] Found existing draft:', workingBlueprintId);
        }
      }

      // Ensure version is always set when saving and data is properly structured
      const dataToSave = {
        ...latestValues.current,
        version: 2,
      };

      console.log('[AutoSave] Data to save:', JSON.stringify(dataToSave, null, 2));

      if (!workingBlueprintId) {
        // No draft found; create a new row
        console.log('[AutoSave] Creating new draft blueprint');
        console.log('[AutoSave] Insert payload:', {
          user_id: userId,
          status: 'draft',
          questionnaire_version: 2,
          static_answers_keys: Object.keys(dataToSave),
        });

        const { data, error } = await supabase
          .from('blueprint_generator')
          .insert({
            user_id: userId,
            status: 'draft',
            static_answers: dataToSave,
            questionnaire_version: 2,
            completed_steps: [],
          })
          .select()
          .single();

        if (error) {
          console.error('[AutoSave] Error creating new draft:', {
            error,
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint,
          });
          throw error;
        }

        if (!data) {
          console.error('[AutoSave] No data returned from insert');
          throw new Error('No data returned from insert');
        }

        workingBlueprintId = data.id as string;
        setBlueprintId(workingBlueprintId);
        console.log('[AutoSave] Created new draft with ID:', workingBlueprintId);
        console.log('[AutoSave] Insert response:', {
          id: data.id,
          status: data.status,
          questionnaire_version: data.questionnaire_version,
          has_static_answers: !!data.static_answers,
        });
      } else {
        // First verify the blueprint exists and belongs to this user
        const { data: existingBlueprint, error: checkError } = await supabase
          .from('blueprint_generator')
          .select('id, user_id, status')
          .eq('id', workingBlueprintId)
          .single();

        if (checkError || !existingBlueprint) {
          console.warn('[AutoSave] Stale blueprint ID detected - auto-recovering:', {
            blueprintId: workingBlueprintId,
            reason: checkError?.code || 'Blueprint not found',
          });
          // Blueprint doesn't exist, clear the stale ID and create new one
          setBlueprintId('');
          console.log('[AutoSave] ✓ Cleared stale ID, creating new blueprint...');
          // Trigger immediate retry by calling save again
          setTimeout(() => void save(), 100);
          return;
        }

        if (existingBlueprint.user_id !== userId) {
          console.warn('[AutoSave] Blueprint ownership mismatch - auto-recovering:', {
            blueprintId: workingBlueprintId,
          });
          // Clear the wrong ID and create a new blueprint
          setBlueprintId('');
          console.log('[AutoSave] ✓ Creating new blueprint for current user...');
          setTimeout(() => void save(), 100);
          return;
        }

        // Update the existing draft row
        console.log('[AutoSave] Updating existing draft:', workingBlueprintId);
        console.log('[AutoSave] Update payload:', {
          questionnaire_version: 2,
          static_answers_keys: Object.keys(dataToSave),
        });

        const { data, error } = await supabase
          .from('blueprint_generator')
          .update({
            static_answers: dataToSave,
            questionnaire_version: 2,
            updated_at: new Date().toISOString(),
          })
          .eq('id', workingBlueprintId)
          .eq('user_id', userId)
          .select();

        if (error) {
          console.error('[AutoSave] Error updating draft:', {
            error,
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint,
            blueprintId: workingBlueprintId,
            userId,
          });
          throw error;
        }

        if (!data || data.length === 0) {
          console.error('[AutoSave] Update matched 0 rows - blueprint may have been deleted');
          // Clear the stale ID and retry
          setBlueprintId('');
          setTimeout(() => void save(), 100);
          return;
        }

        const updatedBlueprint = data[0];
        console.log('[AutoSave] Successfully updated draft');
        console.log('[AutoSave] Update response:', {
          id: updatedBlueprint.id,
          status: updatedBlueprint.status,
          questionnaire_version: updatedBlueprint.questionnaire_version,
          has_static_answers: !!updatedBlueprint.static_answers,
          updated_at: updatedBlueprint.updated_at,
        });
      }

      // Verify the save by reading it back (optional - for debugging)
      const { data: verifyData, error: verifyError } = await supabase
        .from('blueprint_generator')
        .select('id, static_answers, questionnaire_version, updated_at')
        .eq('id', workingBlueprintId)
        .eq('user_id', userId)
        .maybeSingle();

      if (verifyError) {
        console.warn('[AutoSave] Could not verify save (non-fatal):', verifyError.message);
      } else if (!verifyData) {
        console.warn('[AutoSave] Verification returned no data (blueprint may have been deleted)');
      } else {
        console.log('[AutoSave] ✓ Verified saved data:', {
          id: verifyData.id,
          hasStaticAnswers: !!verifyData.static_answers,
          questionnaireVersion: verifyData.questionnaire_version,
          updatedAt: verifyData.updated_at,
        });
        console.log(
          '[AutoSave] ✓ Full static_answers:',
          JSON.stringify(verifyData.static_answers, null, 2)
        );
      }

      setSaveState('saved');
      console.log('[AutoSave] Save completed successfully');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[AutoSave] Save failed:', message, error);
      setSaveState('error', message);
    }
  }, [setSaveState, supabase, userId]);

  // Debounce and always call the latest save implementation
  const debouncedSave = useMemo(
    () =>
      debounce(() => {
        void save();
      }, 2000),
    [save]
  );

  useEffect(() => {
    debouncedSave();
  }, [values, debouncedSave]);

  // When user signs in or becomes available, perform an immediate save to
  // ensure a draft row is created/linked promptly for subsequent updates.
  useEffect(() => {
    if (userId) {
      void save();
    }
  }, [userId, save]);

  useEffect(() => {
    return () => {
      debouncedSave.cancel();
    };
  }, [debouncedSave]);
}
