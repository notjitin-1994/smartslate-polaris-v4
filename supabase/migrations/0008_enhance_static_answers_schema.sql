-- Migration: Enhance static_answers schema for new questionnaire structure
-- Created: 2025-01-02
-- Description: Adds validation and indexes for new static questionnaire fields

-- Add comment documenting the new schema structure
COMMENT ON COLUMN public.blueprint_generator.static_answers IS 
'Static questionnaire responses. Schema v2 structure:
{
  "version": 2,
  "role": "string",
  "organization": {
    "name": "string",
    "industry": "string",
    "size": "string",
    "regions": ["string"]
  },
  "learnerProfile": {
    "audienceSize": "string",
    "priorKnowledge": number,
    "motivation": ["string"],
    "environment": ["string"],
    "devices": ["string"],
    "timeAvailable": number,
    "accessibility": ["string"]
  },
  "learningGap": {
    "description": "string",
    "gapType": "string",
    "urgency": number,
    "impact": number,
    "impactAreas": ["string"],
    "bloomsLevel": "string",
    "objectives": "string"
  },
  "resources": {
    "budget": {
      "amount": number,
      "flexibility": "string"
    },
    "timeline": {
      "targetDate": "string",
      "flexibility": "string",
      "duration": number
    },
    "team": {
      "instructionalDesigners": number,
      "contentDevelopers": number,
      "multimediaSpecialists": number,
      "smeAvailability": number,
      "experienceLevel": "string"
    },
    "technology": {
      "lms": "string",
      "authoringTools": ["string"],
      "otherTools": ["string"]
    },
    "contentStrategy": {
      "source": "string",
      "existingMaterials": ["string"]
    }
  },
  "deliveryStrategy": {
    "modality": "string",
    "duration": number,
    "sessionStructure": "string",
    "interactivityLevel": number,
    "practiceOpportunities": ["string"],
    "socialLearning": ["string"],
    "reinforcement": "string"
  },
  "constraints": ["string"],
  "evaluation": {
    "level1": {
      "methods": ["string"],
      "satisfactionTarget": number
    },
    "level2": {
      "assessmentMethods": ["string"],
      "passingRequired": boolean,
      "passingScore": number,
      "attemptsAllowed": number
    },
    "level3": {
      "measureBehavior": boolean,
      "methods": ["string"],
      "followUpTiming": "string",
      "behaviors": "string"
    },
    "level4": {
      "measureROI": boolean,
      "metrics": ["string"],
      "owner": "string",
      "timing": "string"
    },
    "certification": "string"
  }
}';

-- Add GIN indexes for frequently queried fields
CREATE INDEX IF NOT EXISTS idx_static_answers_version 
  ON public.blueprint_generator ((static_answers->>'version'));

CREATE INDEX IF NOT EXISTS idx_static_answers_role 
  ON public.blueprint_generator ((static_answers->>'role'));

CREATE INDEX IF NOT EXISTS idx_static_answers_modality 
  ON public.blueprint_generator ((static_answers->'deliveryStrategy'->>'modality'));

CREATE INDEX IF NOT EXISTS idx_static_answers_blooms_level 
  ON public.blueprint_generator ((static_answers->'learningGap'->>'bloomsLevel'));

-- Add validation function for static_answers structure
CREATE OR REPLACE FUNCTION validate_static_answers()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure version exists
  IF NEW.static_answers IS NOT NULL AND NOT (NEW.static_answers ? 'version') THEN
    NEW.static_answers := jsonb_set(
      COALESCE(NEW.static_answers, '{}'::jsonb),
      '{version}',
      '1'::jsonb
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate on insert/update
DROP TRIGGER IF EXISTS trigger_validate_static_answers ON public.blueprint_generator;
CREATE TRIGGER trigger_validate_static_answers
  BEFORE INSERT OR UPDATE ON public.blueprint_generator
  FOR EACH ROW
  EXECUTE FUNCTION validate_static_answers();

-- Add helper function to migrate v1 to v2 schema
CREATE OR REPLACE FUNCTION migrate_static_answers_v1_to_v2(v1_data jsonb)
RETURNS jsonb AS $$
DECLARE
  v2_data jsonb;
BEGIN
  -- Check if already v2
  IF (v1_data->>'version') = '2' THEN
    RETURN v1_data;
  END IF;
  
  -- Build v2 structure from v1 data
  v2_data := jsonb_build_object(
    'version', 2,
    'role', v1_data->>'role',
    'organization', jsonb_build_object(
      'name', v1_data->>'organization',
      'industry', null,
      'size', null,
      'regions', '[]'::jsonb
    ),
    'learnerProfile', jsonb_build_object(
      'audienceSize', null,
      'priorKnowledge', null,
      'motivation', '[]'::jsonb,
      'environment', '[]'::jsonb,
      'devices', '[]'::jsonb,
      'timeAvailable', null,
      'accessibility', '[]'::jsonb
    ),
    'learningGap', jsonb_build_object(
      'description', v1_data->>'learningGap',
      'gapType', null,
      'urgency', null,
      'impact', null,
      'impactAreas', '[]'::jsonb,
      'bloomsLevel', null,
      'objectives', null
    ),
    'resources', jsonb_build_object(
      'budget', jsonb_build_object('amount', null, 'flexibility', null),
      'timeline', jsonb_build_object('targetDate', null, 'flexibility', null, 'duration', null),
      'team', jsonb_build_object(
        'instructionalDesigners', 0,
        'contentDevelopers', 0,
        'multimediaSpecialists', 0,
        'smeAvailability', null,
        'experienceLevel', null
      ),
      'technology', jsonb_build_object('lms', null, 'authoringTools', '[]'::jsonb, 'otherTools', '[]'::jsonb),
      'contentStrategy', jsonb_build_object('source', null, 'existingMaterials', '[]'::jsonb),
      'rawText', v1_data->>'resources'
    ),
    'deliveryStrategy', jsonb_build_object(
      'modality', null,
      'duration', null,
      'sessionStructure', null,
      'interactivityLevel', null,
      'practiceOpportunities', '[]'::jsonb,
      'socialLearning', '[]'::jsonb,
      'reinforcement', null
    ),
    'constraints', COALESCE(v1_data->'constraints', '[]'::jsonb),
    'evaluation', jsonb_build_object(
      'level1', jsonb_build_object('methods', '[]'::jsonb, 'satisfactionTarget', null),
      'level2', jsonb_build_object(
        'assessmentMethods', '[]'::jsonb,
        'passingRequired', null,
        'passingScore', null,
        'attemptsAllowed', null
      ),
      'level3', jsonb_build_object(
        'measureBehavior', false,
        'methods', '[]'::jsonb,
        'followUpTiming', null,
        'behaviors', null
      ),
      'level4', jsonb_build_object(
        'measureROI', false,
        'metrics', '[]'::jsonb,
        'owner', null,
        'timing', null
      ),
      'certification', null
    )
  );
  
  RETURN v2_data;
END;
$$ LANGUAGE plpgsql;

-- Optional: Migrate existing data (run manually)
-- UPDATE public.blueprint_generator 
-- SET static_answers = migrate_static_answers_v1_to_v2(static_answers)
-- WHERE (static_answers->>'version') IS NULL OR (static_answers->>'version') = '1';
