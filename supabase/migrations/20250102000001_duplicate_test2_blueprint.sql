-- Duplicate the "Test2" blueprint entry with empty blueprint_json and blueprint_markdown
-- Original UUID: 2b638761-9540-4305-a2a8-90899b0955da

INSERT INTO public.blueprint_generator (
  id,
  user_id,
  version,
  static_answers,
  dynamic_questions,
  dynamic_questions_raw,
  dynamic_answers,
  blueprint_json,
  blueprint_markdown,
  status,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid() AS id,                    -- Generate new UUID
  user_id,                                     -- Keep same user
  version,                                     -- Copy version
  static_answers,                              -- Copy static_answers
  dynamic_questions,                           -- Copy dynamic_questions
  dynamic_questions_raw,                       -- Copy dynamic_questions_rawa
  dynamic_answers,                             -- Copy dynamic_answers
  '{}'::jsonb AS blueprint_json,               -- Empty blueprint_json
  NULL AS blueprint_markdown,                  -- Empty blueprint_markdown
  status,                                      -- Copy status
  now() AS created_at,                         -- Set current timestamp
  now() AS updated_at                          -- Set current timestamp
FROM public.blueprint_generator
WHERE id = '2b638761-9540-4305-a2a8-90899b0955da'::uuid;

