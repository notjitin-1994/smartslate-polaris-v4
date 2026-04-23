/**
 * Dynamic Answers Submit API Endpoint
 * POST /api/dynamic-answers/submit
 * Final submission endpoint with validation and blueprint generation trigger
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createServiceLogger } from '@/lib/logging';
import { validateCompleteAnswers, type Section } from '@/lib/validation/dynamicQuestionSchemas';

const logger = createServiceLogger('api');
const dbLogger = createServiceLogger('database');

export const dynamic = 'force-dynamic';

// Request schema for final submission (validation required)
const submitRequestSchema = z.object({
  blueprintId: z.string().uuid('Invalid blueprint ID'),
  answers: z.record(z.string(), z.unknown()),
  validate: z.boolean().optional().default(true), // Allow bypassing validation for testing
});

/**
 * POST /api/dynamic-answers/submit
 * Submit complete dynamic questionnaire answers and trigger blueprint generation
 */
export async function POST(request: NextRequest): Promise<Response> {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();

  logger.info('api.request', 'Received dynamic answers final submission', {
    requestId,
    method: 'POST',
    path: '/api/dynamic-answers/submit',
  });

  try {
    // Authenticate user
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.warn('api.auth.failure', 'Unauthorized submission attempt', {
        requestId,
        error: authError?.message,
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request
    const body = await request.json();
    const parseResult = submitRequestSchema.safeParse(body);

    if (!parseResult.success) {
      logger.warn('api.error', 'Invalid submission request body', {
        requestId,
        userId: user.id,
        errors: parseResult.error.flatten(),
      });
      return NextResponse.json(
        { error: 'Invalid request', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { blueprintId, answers } = parseResult.data;

    // Verify blueprint ownership and fetch dynamic questions for validation
    dbLogger.info('database.query.start', 'Fetching blueprint for submission', {
      blueprintId,
      userId: user.id,
      requestId,
    });

    const { data: blueprint, error: blueprintError } = await supabase
      .from('blueprint_generator')
      .select('id, user_id, dynamic_questions, dynamic_answers, status')
      .eq('id', blueprintId)
      .eq('user_id', user.id)
      .single();

    if (blueprintError || !blueprint) {
      dbLogger.error('database.query.failure', 'Blueprint not found or access denied', {
        blueprintId,
        userId: user.id,
        error: blueprintError?.message,
        requestId,
      });
      return NextResponse.json({ error: 'Blueprint not found or access denied' }, { status: 404 });
    }

    // Validate that dynamic questions exist
    const sections = Array.isArray(blueprint.dynamic_questions)
      ? blueprint.dynamic_questions
      : blueprint.dynamic_questions?.sections || [];

    dbLogger.info('database.query.sections', 'Extracted sections from blueprint', {
      blueprintId,
      sectionsCount: sections.length,
      sectionsIsArray: Array.isArray(sections),
      sectionsType: typeof sections,
      hasSections: !!sections,
      requestId,
    });

    if (sections.length === 0) {
      logger.warn('api.error', 'No dynamic questions found for blueprint', {
        blueprintId,
        userId: user.id,
        dynamicQuestionsType: typeof blueprint.dynamic_questions,
        dynamicQuestionsKeys: blueprint.dynamic_questions
          ? Object.keys(blueprint.dynamic_questions)
          : [],
        requestId,
      });
      return NextResponse.json(
        { error: 'No dynamic questions found. Please generate questions first.' },
        { status: 400 }
      );
    }

    // Validate structure of sections before validation
    const validSections = sections.filter(
      (section: any) =>
        section &&
        section.questions &&
        Array.isArray(section.questions) &&
        section.questions.length > 0
    );

    if (validSections.length === 0) {
      logger.warn('api.error', 'Sections exist but have invalid structure', {
        blueprintId,
        userId: user.id,
        sectionsCount: sections.length,
        validSectionsCount: validSections.length,
        requestId,
      });
      return NextResponse.json(
        { error: 'Invalid dynamic questions structure. Please regenerate questions.' },
        { status: 400 }
      );
    }

    // Validate complete answers using comprehensive schema validation
    dbLogger.info('validation.start', 'Starting answer validation', {
      blueprintId,
      answersCount: Object.keys(answers).length,
      sectionsCount: validSections.length,
      sampleAnswers: Object.entries(answers)
        .slice(0, 3)
        .map(([id, val]) => ({
          id,
          type: typeof val,
          isArray: Array.isArray(val),
          value: Array.isArray(val)
            ? `Array(${(val as any[]).length}): [${(val as any[]).slice(0, 5).join(', ')}]`
            : String(val).substring(0, 50),
        })),
      requestId,
    });

    // Log sample question options for debugging mismatches
    const sampleQuestions = validSections.slice(0, 2).flatMap((section: any) =>
      section.questions.slice(0, 2).map((q: any) => ({
        id: q.id,
        type: q.type,
        hasOptions: !!q.options,
        optionCount: q.options?.length || 0,
        sampleOptions: q.options?.slice(0, 3).map((opt: any) => ({
          value: opt.value,
          label: opt.label,
        })),
      }))
    );
    dbLogger.info('validation.question_options', 'Sample question options', {
      blueprintId,
      sampleQuestions,
      requestId,
    });

    let validation: {
      valid: boolean;
      errors: Record<string, string>;
      missingRequired: string[];
      sanitizedAnswers?: Record<string, unknown>;
    };
    try {
      // Validate with sanitization enabled (filters out invalid option values)
      validation = validateCompleteAnswers(answers, validSections as Section[], true);

      // Log if any answers were sanitized
      if (validation.sanitizedAnswers) {
        const originalKeys = Object.keys(answers);
        const sanitizedKeys = Object.keys(validation.sanitizedAnswers);
        const changedAnswers = originalKeys.filter((key) => {
          const original = answers[key];
          const sanitized = validation.sanitizedAnswers?.[key];
          return JSON.stringify(original) !== JSON.stringify(sanitized);
        });

        if (changedAnswers.length > 0) {
          dbLogger.info('validation.sanitized', 'Some answers were automatically corrected', {
            blueprintId,
            changedCount: changedAnswers.length,
            changedQuestions: changedAnswers.slice(0, 5),
            requestId,
          });
        }
      }

      dbLogger.info('validation.complete', 'Validation completed', {
        blueprintId,
        valid: validation.valid,
        errorCount: Object.keys(validation.errors).length,
        missingRequiredCount: validation.missingRequired.length,
        hasSanitized: !!validation.sanitizedAnswers,
        requestId,
      });
    } catch (validationError) {
      logger.error('validation.error', 'Validation threw an error', {
        blueprintId,
        userId: user.id,
        error: validationError instanceof Error ? validationError.message : String(validationError),
        errorStack: validationError instanceof Error ? validationError.stack : undefined,
        requestId,
      });
      return NextResponse.json({ error: 'Internal validation error occurred' }, { status: 500 });
    }

    if (!validation.valid) {
      // Log detailed error information for debugging
      const errorDetails = Object.entries(validation.errors)
        .slice(0, 5)
        .map(([qId, error]) => {
          // Find the question to get context
          let questionInfo = {
            type: 'unknown',
            label: 'unknown',
            options: [] as any[],
            validValues: [] as string[],
          };
          for (const section of validSections) {
            const q = section.questions.find((quest: any) => quest.id === qId);
            if (q) {
              questionInfo = {
                type: q.type,
                label: q.label,
                validValues: q.options ? q.options.map((opt: any) => opt.value) : [],
                options: q.options || [],
              };
              break;
            }
          }

          return {
            questionId: qId,
            questionType: questionInfo.type,
            questionLabel: questionInfo.label?.substring(0, 100),
            error,
            submittedValue: answers[qId]
              ? Array.isArray(answers[qId])
                ? `Array: [${(answers[qId] as any[]).join(', ')}]`
                : String(answers[qId]).substring(0, 100)
              : 'undefined',
            validOptions:
              questionInfo.options.length > 0
                ? questionInfo.options.map((opt: any) => opt.value).slice(0, 10)
                : undefined,
          };
        });

      logger.warn('api.error', 'Answer validation failed', {
        blueprintId,
        userId: user.id,
        errorCount: Object.keys(validation.errors).length,
        missingRequiredCount: validation.missingRequired.length,
        errorDetails,
        requestId,
      });

      // Separate different types of errors for clearer user guidance
      const requiredFieldErrors = validation.missingRequired.filter(
        (id) => !validation.errors[id] || validation.errors[id] === 'This field is required'
      );
      const invalidValueErrors = Object.keys(validation.errors).filter(
        (id) => !requiredFieldErrors.includes(id)
      );

      return NextResponse.json(
        {
          error: 'Answer validation failed',
          message:
            validation.missingRequired.length > 0
              ? `Please complete ${validation.missingRequired.length} required field${validation.missingRequired.length > 1 ? 's' : ''} before submitting.`
              : 'Some answers need to be corrected. Please review the errors below.',
          validationErrors: validation.errors,
          missingRequired: validation.missingRequired,
          errorSummary: {
            totalErrors: Object.keys(validation.errors).length,
            requiredFieldsMissing: requiredFieldErrors.length,
            invalidAnswers: invalidValueErrors.length,
          },
          errorDetails: errorDetails.slice(0, 10).map((d) => {
            const error = typeof d.error === 'string' ? d.error : 'Invalid value';

            // Provide more specific hints based on the error type
            let hint = '';
            if (error.includes('required')) {
              hint = 'This question must be answered before submitting';
            } else if (d.questionType === 'toggle_switch') {
              hint = 'Click the toggle to select Yes or No';
            } else if (d.questionType.includes('checkbox') || d.questionType === 'multiselect') {
              hint = 'Select one or more options from the list provided';
            } else if (d.questionType.includes('radio') || d.questionType === 'select') {
              hint = 'Select exactly one option from the list';
            } else if (d.questionType.includes('scale')) {
              hint = 'Click on the scale to select a value';
            } else if (d.questionType === 'currency' || d.questionType.includes('number')) {
              hint = 'Enter a valid number';
            } else if (d.questionType === 'email') {
              hint = 'Enter a valid email address';
            } else if (d.questionType === 'url') {
              hint = 'Enter a valid URL starting with http:// or https://';
            } else if (d.questionType === 'date') {
              hint = 'Select a valid date';
            } else {
              hint = 'Please provide a valid answer for this question';
            }

            return {
              questionId: d.questionId,
              question: d.questionLabel?.substring(0, 150) || 'Unknown question',
              error: error,
              hint: hint,
              questionType: d.questionType,
              currentValue: d.submittedValue,
              validOptions: d.validOptions, // Only for selection-based questions
            };
          }),
          suggestions: [
            invalidValueErrors.length > 0 &&
              "Double-check that you're selecting from the provided options, not typing custom text.",
            requiredFieldErrors.length > 0 &&
              'Look for questions marked with a red asterisk (*) - these are required.',
            validation.missingRequired.length > 3 &&
              'Consider saving your progress and continuing later if you need more time.',
          ].filter(Boolean),
        },
        { status: 400 }
      );
    }

    // Use sanitized answers if available (filters out invalid option values)
    const answersToSave = validation.sanitizedAnswers || answers;

    // Log if any answers were corrected during sanitization
    const originalKeys = new Set(Object.keys(answers));
    const sanitizedKeys = new Set(Object.keys(answersToSave));
    const correctedCount = Array.from(originalKeys).filter((key) => {
      return JSON.stringify(answers[key]) !== JSON.stringify(answersToSave[key]);
    }).length;

    if (correctedCount > 0) {
      dbLogger.info(
        'validation.answers_corrected',
        'Some answers were auto-corrected during sanitization',
        {
          blueprintId,
          correctedCount,
          requestId,
        }
      );
    }

    // Merge with existing answers (in case of partial saves)
    const existingAnswers = blueprint.dynamic_answers || {};
    const finalAnswers = {
      ...existingAnswers,
      ...answersToSave,
    };

    // Save final answers - do NOT update status yet
    // Status will be updated by /api/starmaps/generate after successful generation
    dbLogger.info('database.save.start', 'Saving final dynamic answers', {
      blueprintId,
      userId: user.id,
      answerCount: Object.keys(finalAnswers).length,
      requestId,
    });

    const { error: saveError } = await supabase
      .from('blueprint_generator')
      .update({
        dynamic_answers: finalAnswers,
        // Note: Do NOT set status='completed' here - blueprint hasn't been generated yet!
        // The /api/starmaps/generate endpoint will set status='completed' after generation
        updated_at: new Date().toISOString(),
      })
      .eq('id', blueprintId)
      .eq('user_id', user.id);

    if (saveError) {
      dbLogger.error('database.save.failure', 'Failed to save final answers', {
        blueprintId,
        userId: user.id,
        error: saveError.message,
        requestId,
      });
      return NextResponse.json({ error: 'Failed to save answers to database' }, { status: 500 });
    }

    const duration = Date.now() - startTime;

    dbLogger.info('database.save.success', 'Final answers saved successfully', {
      blueprintId,
      userId: user.id,
      answerCount: Object.keys(finalAnswers).length,
      requestId,
      duration,
    });

    logger.info('api.response', 'Successfully submitted dynamic answers', {
      blueprintId,
      userId: user.id,
      answerCount: Object.keys(finalAnswers).length,
      duration,
      requestId,
      statusCode: 200,
    });

    // Blueprint generation is triggered by the /generating/:blueprintId page
    // which calls /api/starmaps/generate after user is redirected
    logger.info(
      'blueprint.generation.ready',
      'Dynamic answers saved, ready for blueprint generation',
      {
        blueprintId,
        userId: user.id,
        requestId,
        nextStep: '/generating/:blueprintId will trigger generation',
        currentStatus: 'Answers saved, not yet generated',
      }
    );

    return NextResponse.json({
      success: true,
      blueprintId,
      message: 'Answers submitted successfully. Ready for blueprint generation.',
      blueprintGenerationStarted: false, // Will be started by /generating page
      estimatedCompletionTime: 90, // seconds (per PRD)
    });
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error('api.error', 'Unexpected error during submission', {
      error: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      requestId,
      duration,
    });

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
