// Note: Consumers should provide an initialized Supabase client.
import type { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import { Blueprint } from '@/lib/ollama/schema';
import { AggregatedAnswer } from '@/lib/services/answerAggregation';

export type BlueprintInsert = Database['public']['Tables']['blueprint_generator']['Insert'];
export type BlueprintRow = Database['public']['Tables']['blueprint_generator']['Row'];
export type BlueprintUpdate = Database['public']['Tables']['blueprint_generator']['Update'];

export class BlueprintService {
  private supabase: SupabaseClient<Database>;

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase;
  }

  /**
   * Saves a new blueprint or updates an existing one, incrementing the version.
   * @param userId The ID of the user.
   * @param blueprintJson The generated blueprint in JSON format.
   * @param blueprintMarkdown The generated blueprint in Markdown format.
   * @param aggregatedAnswers The aggregated static and dynamic answers.
   * @param existingBlueprintId Optional. The ID of an existing blueprint to update.
   * @returns The saved or updated blueprint row.
   */
  public async saveBlueprint(
    userId: string,
    blueprintJson: Blueprint,
    blueprintMarkdown: string,
    aggregatedAnswers: AggregatedAnswer,
    existingBlueprintId?: string
  ): Promise<BlueprintRow> {
    const staticResponses = aggregatedAnswers.staticResponses;
    const dynamicResponses = aggregatedAnswers.dynamicResponses;
    // Note: dynamic_questions is not directly available here; assuming it was used to generate dynamic_answers
    // and might be stored separately if needed for historical context.

    // Convert response arrays into key-value maps expected by DB (jsonb objects)
    const toObject = (
      arr: Array<{ questionId: string; answer: unknown }>
    ): Record<string, unknown> => {
      try {
        return Object.fromEntries(arr.map(({ questionId, answer }) => [questionId, answer]));
      } catch {
        return {};
      }
    };

    const staticAnswersObj = Array.isArray(staticResponses) ? toObject(staticResponses) : {};
    const dynamicAnswersObj = Array.isArray(dynamicResponses) ? toObject(dynamicResponses) : {};

    // Determine questionnaire version from static answers object
    const versionValue = (staticAnswersObj as Record<string, unknown>)?.version as
      | number
      | string
      | undefined;
    const questionnaireVersion = versionValue === 2 || versionValue === '2' ? 2 : 1;

    if (existingBlueprintId) {
      // Update existing blueprint and increment version
      const { data, error } = await this.supabase.rpc('increment_blueprint_version', {
        blueprint_id_input: existingBlueprintId,
        new_blueprint_json: blueprintJson,
        new_blueprint_markdown: blueprintMarkdown,
        new_static_answers: staticAnswersObj,
        new_dynamic_answers: dynamicAnswersObj,
        new_status: 'completed', // Assuming update means completion
      });

      if (error) {
        console.error('Error incrementing blueprint version:', {
          blueprintId: existingBlueprintId,
          error: error.message || error,
          errorCode: error.code,
          errorDetails: error.details,
          errorHint: error.hint,
        });
        throw new Error(error.message || 'Failed to increment blueprint version');
      }
      // The RPC returns a single blueprint row if successful
      return data as BlueprintRow;
    } else {
      // Insert a new blueprint
      const { data, error } = await this.supabase
        .from('blueprint_generator')
        .insert({
          user_id: userId,
          blueprint_json: blueprintJson,
          blueprint_markdown: blueprintMarkdown,
          static_answers: staticAnswersObj,
          dynamic_answers: dynamicAnswersObj,
          status: 'completed',
          version: 1, // Initial version
          questionnaire_version: questionnaireVersion,
          completed_steps: [],
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving new blueprint:', {
          userId,
          error: error.message || error,
          errorCode: error.code,
          errorDetails: error.details,
          errorHint: error.hint,
        });
        throw new Error(error.message || 'Failed to save new blueprint');
      }
      return data;
    }
  }

  /**
   * Fetches a specific version of a blueprint.
   * @param blueprintId The ID of the blueprint.
   * @param version Optional. The specific version number to fetch. If not provided, fetches the latest.
   * @returns The blueprint row for the specified version.
   */
  public async getBlueprint(blueprintId: string, version?: number): Promise<BlueprintRow | null> {
    let query = this.supabase.from('blueprint_generator').select('*').eq('id', blueprintId);

    if (version !== undefined) {
      query = query.eq('version', version);
    } else {
      // Order by version descending and take the first one to get the latest
      query = query.order('version', { ascending: false }).limit(1);
    }

    const { data, error } = await query.single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is 'No rows found'
      console.error('Error fetching blueprint:', {
        blueprintId,
        version,
        error: error.message || error,
        errorCode: error.code,
        errorDetails: error.details,
        errorHint: error.hint,
      });
      throw new Error(error.message || 'Failed to fetch blueprint');
    }
    return data;
  }

  /**
   * Fetches all versions of a blueprint.
   * @param blueprintId The ID of the blueprint.
   * @returns An array of blueprint rows, ordered by version.
   */
  public async getBlueprintVersions(blueprintId: string): Promise<BlueprintRow[]> {
    const { data, error } = await this.supabase
      .from('blueprint_generator')
      .select('*')
      .eq('id', blueprintId)
      .order('version', { ascending: true });

    if (error) {
      console.error('Error fetching blueprint versions:', {
        blueprintId,
        error: error.message || error,
        errorCode: error.code,
        errorDetails: error.details,
        errorHint: error.hint,
      });
      throw new Error(error.message || 'Failed to fetch blueprint versions');
    }
    return data || [];
  }

  /**
   * Fetches all blueprints for a specific user.
   * @param userId The ID of the user.
   * @returns An array of blueprint rows, ordered by creation date descending.
   */
  public async getBlueprintsByUser(userId: string): Promise<BlueprintRow[]> {
    const { data, error } = await this.supabase
      .from('blueprint_generator')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching blueprints by user:', {
        userId,
        error: error.message || error,
        errorCode: error.code,
        errorDetails: error.details,
        errorHint: error.hint,
      });
      throw new Error(error.message || 'Failed to fetch blueprints by user');
    }
    return data || [];
  }

  /**
   * Creates a new blueprint draft with static answers.
   * @param userId The ID of the user.
   * @param staticAnswers The static answers from the wizard.
   * @returns The created blueprint row.
   */
  public async createBlueprintDraft(
    userId: string,
    staticAnswers: Record<string, unknown>
  ): Promise<BlueprintRow> {
    const { data, error } = await this.supabase
      .from('blueprint_generator')
      .insert({
        user_id: userId,
        static_answers: staticAnswers,
        dynamic_questions: [],
        dynamic_answers: {},
        blueprint_json: {},
        blueprint_markdown: null,
        status: 'draft',
        version: 1,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating blueprint draft:', {
        userId,
        error: error.message || error,
        errorCode: error.code,
        errorDetails: error.details,
        errorHint: error.hint,
      });
      throw new Error(error.message || 'Failed to create blueprint draft');
    }
    return data;
  }

  /**
   * Checks if a blueprint already has a completed generation.
   * @param blueprintId The ID of the blueprint to check.
   * @returns True if the blueprint has a completed generation, false otherwise.
   */
  public async hasCompletedGeneration(blueprintId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('blueprint_generator')
      .select('status')
      .eq('id', blueprintId)
      .eq('status', 'completed')
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "not found"
      console.error('Error checking blueprint completion status:', {
        blueprintId,
        error: error.message || error,
        errorCode: error.code,
        errorDetails: error.details,
        errorHint: error.hint,
      });
      throw new Error(error.message || 'Failed to check blueprint completion status');
    }

    return !!data;
  }

  /**
   * Checks if a blueprint's static questionnaire is complete.
   * @param blueprintId The ID of the blueprint to check.
   * @returns True if the static questionnaire is complete, false otherwise.
   */
  public async isStaticQuestionnaireComplete(blueprintId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('blueprint_generator')
      .select('static_answers')
      .eq('id', blueprintId)
      .single();

    if (error) {
      console.error('Error checking static questionnaire completion:', error);
      return false;
    }

    if (!data?.static_answers) {
      return false;
    }

    const answers = data.static_answers as Record<string, unknown>;

    const isNonEmpty = (v: unknown) => v !== null && v !== undefined && String(v).trim() !== '';

    // Canonical fields in the new schema
    const canonicalComplete = [
      'role',
      'organization',
      'learningGap',
      'resources',
      'constraints',
    ].every((k) => isNonEmpty(answers[k]));

    if (canonicalComplete) return true;

    // Legacy fields used in previous versions (fallback)
    const legacyComplete = [
      'learningObjective',
      'targetAudience',
      'deliveryMethod',
      'duration',
      'assessmentType',
    ].every((k) => isNonEmpty(answers[k]));

    return legacyComplete;
  }

  /**
   * Removes duplicate generations for a blueprint, keeping only the latest completed version.
   * @param blueprintId The ID of the blueprint to clean up.
   * @returns The number of duplicate records removed.
   */
  public async removeDuplicateGenerations(blueprintId: string): Promise<number> {
    // Get all versions of the blueprint
    const { data: allVersions, error: fetchError } = await this.supabase
      .from('blueprint_generator')
      .select('id, version, status, created_at')
      .eq('id', blueprintId)
      .order('version', { ascending: false });

    if (fetchError) {
      console.error('Error fetching blueprint versions:', {
        blueprintId,
        error: fetchError.message || fetchError,
        errorCode: fetchError.code,
        errorDetails: fetchError.details,
        errorHint: fetchError.hint,
      });
      throw new Error(fetchError.message || 'Failed to fetch blueprint versions');
    }

    if (!allVersions || allVersions.length <= 1) {
      return 0; // No duplicates to remove
    }

    // Find the latest completed version
    const latestCompleted = allVersions.find((v) => v.status === 'completed');
    if (!latestCompleted) {
      return 0; // No completed versions to keep
    }

    // Delete all other versions (keep only the latest completed)
    const versionsToDelete = allVersions
      .filter((v) => v.id !== latestCompleted.id)
      .map((v) => v.id);

    if (versionsToDelete.length === 0) {
      return 0;
    }

    const { error: deleteError } = await this.supabase
      .from('blueprint_generator')
      .delete()
      .in('id', versionsToDelete);

    if (deleteError) {
      console.error('Error deleting duplicate generations:', {
        blueprintId,
        versionsToDelete,
        error: deleteError.message || deleteError,
        errorCode: deleteError.code,
        errorDetails: deleteError.details,
        errorHint: deleteError.hint,
      });
      throw new Error(deleteError.message || 'Failed to delete duplicate generations');
    }

    return versionsToDelete.length;
  }

  /**
   * Updates a blueprint with generated dynamic questions.
   * @param blueprintId The ID of the blueprint to update.
   * @param dynamicQuestions The generated dynamic questions.
   * @returns The updated blueprint row.
   */
  public async updateDynamicQuestions(
    blueprintId: string,
    dynamicQuestions: unknown[]
  ): Promise<BlueprintRow> {
    const { data, error } = await this.supabase
      .from('blueprint_generator')
      .update({
        dynamic_questions: dynamicQuestions,
        status: 'draft', // Keep as draft until dynamic questions are answered
      })
      .eq('id', blueprintId)
      .select()
      .single();

    if (error) {
      console.error('Error updating dynamic questions:', {
        blueprintId,
        error: error.message || error,
        errorCode: error.code,
        errorDetails: error.details,
        errorHint: error.hint,
      });
      throw new Error(error.message || 'Failed to update dynamic questions');
    }
    return data;
  }

  /**
   * Updates a blueprint with dynamic answers.
   * @param blueprintId The ID of the blueprint to update.
   * @param dynamicAnswers The dynamic answers from the form.
   * @returns The updated blueprint row.
   */
  public async updateDynamicAnswers(
    blueprintId: string,
    dynamicAnswers: Record<string, unknown>,
    userId?: string
  ): Promise<BlueprintRow> {
    // Get current user if not provided (for backward compatibility)
    if (!userId) {
      try {
        const {
          data: { user },
        } = await this.supabase.auth.getUser();
        if (user) {
          userId = user.id;
        }
      } catch (error) {
        // If we can't get the user, continue without user filter (less secure but maintains compatibility)
        console.warn('Could not get authenticated user for updateDynamicAnswers');
      }
    }

    let query = this.supabase
      .from('blueprint_generator')
      .update({
        dynamic_answers: dynamicAnswers,
        status: 'draft', // Keep as draft until blueprint is generated
      })
      .eq('id', blueprintId);

    // Only add user_id filter if we have a userId (for security)
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.select().single();

    if (error) {
      console.error('Error updating dynamic answers:', {
        blueprintId,
        error: error.message || error,
        errorCode: error.code,
        errorDetails: error.details,
        errorHint: error.hint,
      });
      throw new Error(error.message || 'Failed to update dynamic answers');
    }
    return data;
  }

  /**
   * Updates a blueprint's title.
   * @param blueprintId The ID of the blueprint to update.
   * @param title The new title for the blueprint.
   * @param userId The ID of the user (for security).
   * @returns The updated blueprint row.
   */
  public async updateBlueprintTitle(
    blueprintId: string,
    title: string,
    userId: string
  ): Promise<BlueprintRow> {
    console.log('Attempting to update blueprint title:', { blueprintId, title, userId });

    try {
      // First, check if we can get the current blueprint to see if title column exists
      const { data: currentBlueprint, error: fetchError } = await this.supabase
        .from('blueprint_generator')
        .select('*')
        .eq('id', blueprintId)
        .eq('user_id', userId)
        .single();

      if (fetchError) {
        console.error('Error fetching current blueprint:', fetchError);
        throw new Error(fetchError.message || 'Failed to fetch blueprint');
      }

      console.log('Current blueprint fetched:', currentBlueprint);

      // Check if the title column exists by trying to access it
      const hasTitleColumn = 'title' in currentBlueprint;

      if (!hasTitleColumn) {
        console.warn('Title column not found in blueprint, updating local state only');
        // Return the blueprint with the new title added locally
        return { ...currentBlueprint, title: title.trim() };
      }

      // Try to update the title
      const { data, error } = await this.supabase
        .from('blueprint_generator')
        .update({
          title: title.trim(),
        })
        .eq('id', blueprintId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating blueprint title:', {
          blueprintId,
          userId,
          title: title.trim(),
          error: error.message || error,
          errorCode: error.code,
          errorDetails: error.details,
          errorHint: error.hint,
        });

        // If the error is about the title column not existing, return with local title
        if (error.message?.includes('title') && error.message?.includes('column')) {
          console.warn('Title column not found in database, using local title');
          return { ...currentBlueprint, title: title.trim() };
        }

        throw new Error(error.message || 'Failed to update blueprint title');
      }

      console.log('Blueprint title updated successfully:', data);
      return data;
    } catch (error) {
      console.error('Exception in updateBlueprintTitle:', error);

      // If it's a schema-related error, try to continue with local title
      if (
        error instanceof Error &&
        error.message?.includes('title') &&
        error.message?.includes('column')
      ) {
        console.warn('Schema error detected, using local title update');
        // Return the blueprint with the new title added locally
        const { data } = await this.supabase
          .from('blueprint_generator')
          .select('*')
          .eq('id', blueprintId)
          .eq('user_id', userId)
          .single();

        return { ...data, title: title.trim() };
      }
      throw error;
    }
  }

  /**
   * World-class blueprint resume routing logic.
   * Intelligently determines the next page based on blueprint state.
   *
   * Flow decision order:
   * - If error status → check if recoverable, route to appropriate step
   * - If generating → check if stuck, route to generating or retry
   * - If completed → view page (with validation)
   * - If static answers incomplete → static wizard
   * - If no dynamic questions yet → loading page (generates them)
   * - If dynamic answers incomplete → dynamic wizard
   * - Else → generating page (finalize blueprint)
   */
  public async getNextRouteForBlueprint(blueprintId: string): Promise<string> {
    try {
      const { data, error } = await this.supabase
        .from('blueprint_generator')
        .select(
          'id, status, static_answers, dynamic_questions, dynamic_questions_raw, dynamic_answers, blueprint_json, blueprint_markdown, updated_at, questionnaire_version'
        )
        .eq('id', blueprintId)
        .single();

      if (error) {
        console.error('[BlueprintService] Error fetching blueprint for resume:', error);
        // Default to static wizard as safest starting point
        return `/static-wizard?bid=${blueprintId}`;
      }

      if (!data) {
        console.warn('[BlueprintService] Blueprint not found:', blueprintId);
        return `/static-wizard?bid=${blueprintId}`;
      }

      console.log('[BlueprintService] Resume routing analysis:', {
        blueprintId,
        status: data.status,
        hasStaticAnswers:
          !!data.static_answers && Object.keys(data.static_answers as any).length > 0,
        hasDynamicQuestions:
          Array.isArray(data.dynamic_questions) && data.dynamic_questions.length > 0,
        hasDynamicAnswers:
          !!data.dynamic_answers && Object.keys(data.dynamic_answers as any).length > 0,
        hasBlueprintJson:
          !!data.blueprint_json && Object.keys(data.blueprint_json as any).length > 0,
        hasBlueprintMarkdown: !!data.blueprint_markdown,
        questionnaireVersion: data.questionnaire_version,
      });

      // 1) Handle ERROR status - try to recover gracefully
      if (data.status === 'error') {
        console.warn('[BlueprintService] Blueprint in error state, attempting recovery');

        // If we have dynamic answers, user was likely at generation stage
        const hasDynamicAnswers =
          data.dynamic_answers && Object.keys(data.dynamic_answers as any).length > 0;

        if (hasDynamicAnswers) {
          // User completed dynamic questionnaire, retry generation
          return `/generating/${blueprintId}`;
        }

        // Otherwise, restart from where they left off
        const staticComplete = this.isStaticComplete(
          data.static_answers as Record<string, unknown> | null | undefined
        );

        if (!staticComplete) {
          return `/static-wizard?bid=${blueprintId}`;
        }

        // Static complete but no dynamic answers - regenerate questions
        return `/loading/${blueprintId}`;
      }

      // 2) Handle GENERATING status - check if stuck or in progress
      if (data.status === 'generating') {
        const updatedAt = new Date(data.updated_at as string);
        const minutesSinceUpdate = (Date.now() - updatedAt.getTime()) / 1000 / 60;

        // If generating for more than 10 minutes, likely stuck
        if (minutesSinceUpdate > 10) {
          console.warn('[BlueprintService] Blueprint stuck in generating state, will retry');
          // Stay on generating page which will retry
        } else {
          console.log(
            '[BlueprintService] Blueprint actively generating, routing to generating page'
          );
        }

        return `/generating/${blueprintId}`;
      }

      // 3) Handle COMPLETED status - validate and route to viewer
      if (data.status === 'completed') {
        // Validate completion - must have either markdown or JSON
        const hasContent =
          data.blueprint_markdown ||
          (data.blueprint_json && Object.keys(data.blueprint_json as any).length > 0);

        if (hasContent) {
          console.log('[BlueprintService] Blueprint completed, routing to viewer');
          return `/blueprint/${blueprintId}`;
        } else {
          // Status is completed but no content - data integrity issue
          console.error(
            '[BlueprintService] Blueprint marked complete but has no content, regenerating'
          );

          // Check if we have answers to regenerate from
          const hasDynamicAnswers =
            data.dynamic_answers && Object.keys(data.dynamic_answers as any).length > 0;

          if (hasDynamicAnswers) {
            return `/generating/${blueprintId}`;
          }

          // Fall back to dynamic questionnaire
          return `/dynamic-wizard/${blueprintId}`;
        }
      }

      // 4) DRAFT status - normal workflow progression
      // Check static answers completeness (support both V1 and V2 schemas)
      const staticComplete = this.isStaticComplete(
        data.static_answers as Record<string, unknown> | null | undefined
      );

      if (!staticComplete) {
        console.log('[BlueprintService] Static answers incomplete, routing to static wizard');
        return `/static-wizard?bid=${blueprintId}`;
      }

      // 5) Check dynamic questions presence
      const hasDynamicQuestions =
        Array.isArray(data.dynamic_questions) && (data.dynamic_questions as unknown[]).length > 0;

      if (!hasDynamicQuestions) {
        console.log(
          '[BlueprintService] No dynamic questions, routing to loading page to generate them'
        );
        return `/loading/${blueprintId}`;
      }

      // 6) Check dynamic answers completeness
      const dynamicComplete = this.areDynamicAnswersComplete(
        data.dynamic_questions as unknown,
        (data.dynamic_answers as Record<string, unknown> | null | undefined) || {}
      );

      if (!dynamicComplete) {
        console.log('[BlueprintService] Dynamic answers incomplete, routing to dynamic wizard');
        return `/dynamic-wizard/${blueprintId}`;
      }

      // 7) All questionnaires complete → generate blueprint
      console.log('[BlueprintService] All questionnaires complete, routing to generation');
      return `/generating/${blueprintId}`;
    } catch (err) {
      console.error('[BlueprintService] Exception in getNextRouteForBlueprint:', err);
      // Safe fallback - start from beginning
      return `/static-wizard?bid=${blueprintId}`;
    }
  }

  private isStaticComplete(staticAnswers: Record<string, unknown> | null | undefined): boolean {
    if (!staticAnswers) return false;
    const isNonEmpty = (v: unknown) => v !== null && v !== undefined && String(v).trim() !== '';
    const canonical = ['role', 'organization', 'learningGap', 'resources', 'constraints'];
    const legacy = [
      'learningObjective',
      'targetAudience',
      'deliveryMethod',
      'duration',
      'assessmentType',
    ];
    const canonicalComplete = canonical.every((k) => isNonEmpty(staticAnswers[k]));
    if (canonicalComplete) return true;
    return legacy.every((k) => isNonEmpty(staticAnswers[k]));
  }

  private areDynamicAnswersComplete(
    dynamicQuestions: unknown,
    dynamicAnswers: Record<string, unknown>
  ): boolean {
    try {
      const sections = Array.isArray(dynamicQuestions) ? (dynamicQuestions as any[]) : [];
      const requiredIds: string[] = [];
      for (const section of sections) {
        const qs = Array.isArray(section?.questions) ? section.questions : [];
        for (const q of qs) {
          if (q?.required && q?.id) requiredIds.push(String(q.id));
        }
      }
      // If schema doesn't expose requirements, consider any saved answers as progress
      if (requiredIds.length === 0) return Object.keys(dynamicAnswers || {}).length > 0;

      const isNonEmpty = (v: unknown) => {
        if (Array.isArray(v)) return v.length > 0;
        return v !== null && v !== undefined && String(v).trim() !== '';
      };
      return requiredIds.every((id) => isNonEmpty((dynamicAnswers as any)[id]));
    } catch {
      return Object.keys(dynamicAnswers || {}).length > 0;
    }
  }
}

// Factory helpers were removed to avoid importing client/server in this shared module.
// Create instances in client or server modules by passing a pre-configured Supabase client.
