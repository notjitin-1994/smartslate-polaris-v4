-- Migration: Regenerate Comprehensive Blueprint Markdown
-- Description: Updates blueprint_markdown for all existing blueprints to include all JSON fields
-- This migration creates a PostgreSQL function to convert blueprint JSON to comprehensive markdown

-- Create a function to convert JSON to comprehensive markdown
CREATE OR REPLACE FUNCTION generate_comprehensive_markdown(blueprint_json JSONB)
RETURNS TEXT AS $$
DECLARE
  markdown TEXT := '';
  section RECORD;
  item RECORD;
  metadata JSONB;
  module_count INTEGER := 0;
BEGIN
  -- Extract metadata
  metadata := blueprint_json->'metadata';
  
  -- Title and Metadata
  markdown := markdown || '# ' || COALESCE(metadata->>'title', 'Learning Blueprint') || E'\n\n';
  markdown := markdown || '**Organization:** ' || COALESCE(metadata->>'organization', 'N/A') || E'\n\n';
  markdown := markdown || '**Role:** ' || COALESCE(metadata->>'role', 'N/A') || E'\n\n';
  markdown := markdown || '**Generated:** ' || TO_CHAR(TO_TIMESTAMP(metadata->>'generated_at', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'), 'FMMonth DD, YYYY') || E'\n\n';
  markdown := markdown || '**Version:** ' || COALESCE(metadata->>'version', '1.0') || E'\n\n';
  markdown := markdown || E'---\n\n';

  -- Executive Summary
  IF blueprint_json->'executive_summary' IS NOT NULL THEN
    markdown := markdown || E'## Executive Summary\n\n';
    markdown := markdown || COALESCE(blueprint_json->'executive_summary'->>'content', '') || E'\n\n';
    markdown := markdown || E'---\n\n';
  END IF;

  -- Learning Objectives
  IF blueprint_json->'learning_objectives' IS NOT NULL AND 
     jsonb_array_length(COALESCE(blueprint_json->'learning_objectives'->'objectives', '[]'::jsonb)) > 0 THEN
    markdown := markdown || E'## Learning Objectives\n\n';
    
    FOR item IN SELECT * FROM jsonb_array_elements(blueprint_json->'learning_objectives'->'objectives')
    LOOP
      markdown := markdown || E'### ' || (item.value->>'title') || E'\n\n';
      markdown := markdown || (item.value->>'description') || E'\n\n';
      markdown := markdown || '**Metric:** ' || (item.value->>'metric') || E'\n\n';
      markdown := markdown || '**Baseline:** ' || (item.value->>'baseline') || ' | **Target:** ' || (item.value->>'target') || E'\n\n';
      markdown := markdown || '**Due Date:** ' || (item.value->>'due_date') || E'\n\n';
    END LOOP;
    
    markdown := markdown || E'---\n\n';
  END IF;

  -- Target Audience
  IF blueprint_json->'target_audience' IS NOT NULL THEN
    markdown := markdown || E'## Target Audience\n\n';
    
    IF blueprint_json->'target_audience'->'demographics' IS NOT NULL THEN
      markdown := markdown || E'### Demographics\n\n';
      
      -- Roles
      IF jsonb_array_length(COALESCE(blueprint_json->'target_audience'->'demographics'->'roles', '[]'::jsonb)) > 0 THEN
        markdown := markdown || '**Roles:** ' || 
          (SELECT string_agg(value::text, ', ') FROM jsonb_array_elements_text(blueprint_json->'target_audience'->'demographics'->'roles')) || E'\n\n';
      END IF;
      
      -- Experience Levels
      IF jsonb_array_length(COALESCE(blueprint_json->'target_audience'->'demographics'->'experience_levels', '[]'::jsonb)) > 0 THEN
        markdown := markdown || '**Experience Levels:** ' || 
          (SELECT string_agg(value::text, ', ') FROM jsonb_array_elements_text(blueprint_json->'target_audience'->'demographics'->'experience_levels')) || E'\n\n';
      END IF;
    END IF;
    
    markdown := markdown || E'---\n\n';
  END IF;

  -- Content Outline / Modules
  IF blueprint_json->'content_outline'->'modules' IS NOT NULL THEN
    markdown := markdown || E'## Content Outline\n\n';
    
    module_count := 0;
    FOR item IN SELECT * FROM jsonb_array_elements(blueprint_json->'content_outline'->'modules')
    LOOP
      module_count := module_count + 1;
      markdown := markdown || E'### ' || module_count || '. ' || (item.value->>'title') || E'\n\n';
      
      IF item.value->>'description' IS NOT NULL THEN
        markdown := markdown || (item.value->>'description') || E'\n\n';
      END IF;
      
      markdown := markdown || '**Duration:** ' || (item.value->>'duration') || E'\n\n';
      
      IF item.value->>'delivery_method' IS NOT NULL THEN
        markdown := markdown || '**Delivery Method:** ' || (item.value->>'delivery_method') || E'\n\n';
      END IF;
      
      -- Topics
      IF jsonb_array_length(COALESCE(item.value->'topics', '[]'::jsonb)) > 0 THEN
        markdown := markdown || E'**Topics:**\n\n';
        FOR section IN SELECT * FROM jsonb_array_elements_text(item.value->'topics')
        LOOP
          markdown := markdown || '- ' || section.value || E'\n';
        END LOOP;
        markdown := markdown || E'\n';
      END IF;
      
      -- Learning Activities
      IF jsonb_array_length(COALESCE(item.value->'learning_activities', '[]'::jsonb)) > 0 THEN
        markdown := markdown || E'**Learning Activities:**\n\n';
        FOR section IN SELECT * FROM jsonb_array_elements(item.value->'learning_activities')
        LOOP
          markdown := markdown || '- ' || (section.value->>'type') || ': ' || 
            (section.value->>'activity') || ' (' || (section.value->>'duration') || ')' || E'\n';
        END LOOP;
        markdown := markdown || E'\n';
      END IF;
      
      -- Assessment
      IF item.value->'assessment' IS NOT NULL THEN
        markdown := markdown || E'**Assessment:**\n\n';
        markdown := markdown || '- Type: ' || (item.value->'assessment'->>'type') || E'\n';
        IF item.value->'assessment'->>'description' IS NOT NULL THEN
          markdown := markdown || '- Description: ' || (item.value->'assessment'->>'description') || E'\n';
        END IF;
        markdown := markdown || E'\n';
      END IF;
    END LOOP;
    
    markdown := markdown || E'---\n\n';
  END IF;

  -- Resources
  IF blueprint_json->'resources' IS NOT NULL THEN
    markdown := markdown || E'## Resources\n\n';
    
    -- Human Resources
    IF jsonb_array_length(COALESCE(blueprint_json->'resources'->'human_resources', '[]'::jsonb)) > 0 THEN
      markdown := markdown || E'### Human Resources\n\n';
      markdown := markdown || E'| Role | FTE | Duration |\n';
      markdown := markdown || E'|------|-----|----------|\n';
      FOR item IN SELECT * FROM jsonb_array_elements(blueprint_json->'resources'->'human_resources')
      LOOP
        markdown := markdown || '| ' || (item.value->>'role') || ' | ' || 
          (item.value->>'fte') || ' | ' || (item.value->>'duration') || ' |' || E'\n';
      END LOOP;
      markdown := markdown || E'\n';
    END IF;
    
    -- Tools & Platforms
    IF jsonb_array_length(COALESCE(blueprint_json->'resources'->'tools_and_platforms', '[]'::jsonb)) > 0 THEN
      markdown := markdown || E'### Tools & Platforms\n\n';
      markdown := markdown || E'| Category | Name | Cost Type |\n';
      markdown := markdown || E'|----------|------|----------|\n';
      FOR item IN SELECT * FROM jsonb_array_elements(blueprint_json->'resources'->'tools_and_platforms')
      LOOP
        markdown := markdown || '| ' || (item.value->>'category') || ' | ' || 
          (item.value->>'name') || ' | ' || (item.value->>'cost_type') || ' |' || E'\n';
      END LOOP;
      markdown := markdown || E'\n';
    END IF;
    
    -- Budget
    IF blueprint_json->'resources'->'budget' IS NOT NULL THEN
      markdown := markdown || E'### Budget\n\n';
      IF jsonb_array_length(COALESCE(blueprint_json->'resources'->'budget'->'items', '[]'::jsonb)) > 0 THEN
        markdown := markdown || E'| Item | Amount |\n';
        markdown := markdown || E'|------|--------|\n';
        FOR item IN SELECT * FROM jsonb_array_elements(blueprint_json->'resources'->'budget'->'items')
        LOOP
          markdown := markdown || '| ' || (item.value->>'item') || ' | ' || 
            (blueprint_json->'resources'->'budget'->>'currency') || ' ' || 
            (item.value->>'amount')::INTEGER || ' |' || E'\n';
        END LOOP;
        markdown := markdown || E'\n';
      END IF;
      markdown := markdown || '**Total Budget:** ' || 
        (blueprint_json->'resources'->'budget'->>'currency') || ' ' || 
        (blueprint_json->'resources'->'budget'->>'total')::INTEGER || E'\n\n';
    END IF;
    
    markdown := markdown || E'---\n\n';
  END IF;

  -- Assessment Strategy
  IF blueprint_json->'assessment_strategy' IS NOT NULL THEN
    markdown := markdown || E'## Assessment Strategy\n\n';
    
    IF blueprint_json->'assessment_strategy'->>'overview' IS NOT NULL THEN
      markdown := markdown || blueprint_json->'assessment_strategy'->>'overview' || E'\n\n';
    END IF;
    
    IF jsonb_array_length(COALESCE(blueprint_json->'assessment_strategy'->'kpis', '[]'::jsonb)) > 0 THEN
      markdown := markdown || E'### Key Performance Indicators\n\n';
      markdown := markdown || E'| Metric | Target | Measurement Method | Frequency |\n';
      markdown := markdown || E'|--------|--------|-------------------|----------|\n';
      FOR item IN SELECT * FROM jsonb_array_elements(blueprint_json->'assessment_strategy'->'kpis')
      LOOP
        markdown := markdown || '| ' || (item.value->>'metric') || ' | ' || 
          (item.value->>'target') || ' | ' || (item.value->>'measurement_method') || ' | ' || 
          (item.value->>'frequency') || ' |' || E'\n';
      END LOOP;
      markdown := markdown || E'\n';
    END IF;
    
    markdown := markdown || E'---\n\n';
  END IF;

  -- Implementation Timeline
  IF blueprint_json->'implementation_timeline'->'phases' IS NOT NULL THEN
    markdown := markdown || E'## Implementation Timeline\n\n';
    
    FOR item IN SELECT * FROM jsonb_array_elements(blueprint_json->'implementation_timeline'->'phases')
    LOOP
      markdown := markdown || E'### ' || (item.value->>'phase') || E'\n\n';
      markdown := markdown || '**Period:** ' || (item.value->>'start_date') || ' - ' || (item.value->>'end_date') || E'\n\n';
      
      IF jsonb_array_length(COALESCE(item.value->'milestones', '[]'::jsonb)) > 0 THEN
        markdown := markdown || E'**Milestones:**\n\n';
        FOR section IN SELECT * FROM jsonb_array_elements_text(item.value->'milestones')
        LOOP
          markdown := markdown || '- ' || section.value || E'\n';
        END LOOP;
        markdown := markdown || E'\n';
      END IF;
    END LOOP;
    
    markdown := markdown || E'---\n\n';
  END IF;

  -- Risk Mitigation
  IF blueprint_json->'risk_mitigation'->'risks' IS NOT NULL THEN
    markdown := markdown || E'## Risk Mitigation\n\n';
    markdown := markdown || E'| Risk | Probability | Impact | Mitigation Strategy |\n';
    markdown := markdown || E'|------|-------------|--------|--------------------|\n';
    FOR item IN SELECT * FROM jsonb_array_elements(blueprint_json->'risk_mitigation'->'risks')
    LOOP
      markdown := markdown || '| ' || (item.value->>'risk') || ' | ' || 
        (item.value->>'probability') || ' | ' || (item.value->>'impact') || ' | ' || 
        (item.value->>'mitigation_strategy') || ' |' || E'\n';
    END LOOP;
    markdown := markdown || E'\n';
    
    IF jsonb_array_length(COALESCE(blueprint_json->'risk_mitigation'->'contingency_plans', '[]'::jsonb)) > 0 THEN
      markdown := markdown || E'### Contingency Plans\n\n';
      FOR item IN SELECT * FROM jsonb_array_elements_text(blueprint_json->'risk_mitigation'->'contingency_plans')
      LOOP
        markdown := markdown || '- ' || item.value || E'\n';
      END LOOP;
      markdown := markdown || E'\n';
    END IF;
    
    markdown := markdown || E'---\n\n';
  END IF;

  -- Success Metrics
  IF blueprint_json->'success_metrics'->'metrics' IS NOT NULL THEN
    markdown := markdown || E'## Success Metrics\n\n';
    markdown := markdown || E'| Metric | Current Baseline | Target | Measurement Method | Timeline |\n';
    markdown := markdown || E'|--------|-----------------|--------|-------------------|----------|\n';
    FOR item IN SELECT * FROM jsonb_array_elements(blueprint_json->'success_metrics'->'metrics')
    LOOP
      markdown := markdown || '| ' || (item.value->>'metric') || ' | ' || 
        (item.value->>'current_baseline') || ' | ' || (item.value->>'target') || ' | ' || 
        (item.value->>'measurement_method') || ' | ' || (item.value->>'timeline') || ' |' || E'\n';
    END LOOP;
    markdown := markdown || E'\n';
    
    markdown := markdown || E'---\n\n';
  END IF;

  -- Instructional Strategy
  IF blueprint_json->'instructional_strategy' IS NOT NULL THEN
    markdown := markdown || E'## Instructional Strategy\n\n';
    
    IF blueprint_json->'instructional_strategy'->>'overview' IS NOT NULL THEN
      markdown := markdown || blueprint_json->'instructional_strategy'->>'overview' || E'\n\n';
    END IF;
    
    markdown := markdown || E'---\n\n';
  END IF;

  -- Sustainability Plan
  IF blueprint_json->'sustainability_plan' IS NOT NULL THEN
    markdown := markdown || E'## Sustainability Plan\n\n';
    
    IF blueprint_json->'sustainability_plan'->>'content' IS NOT NULL THEN
      markdown := markdown || blueprint_json->'sustainability_plan'->>'content' || E'\n\n';
    END IF;
    
    markdown := markdown || E'---\n\n';
  END IF;

  RETURN markdown;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update all existing blueprints with comprehensive markdown
DO $$
DECLARE
  blueprint_record RECORD;
  new_markdown TEXT;
  updated_count INTEGER := 0;
BEGIN
  RAISE NOTICE 'Starting comprehensive markdown regeneration...';
  
  FOR blueprint_record IN 
    SELECT id, blueprint_json 
    FROM blueprint_generator 
    WHERE blueprint_json IS NOT NULL
      AND blueprint_json != 'null'::jsonb
  LOOP
    BEGIN
      -- Generate comprehensive markdown
      new_markdown := generate_comprehensive_markdown(blueprint_record.blueprint_json);
      
      -- Update the record
      UPDATE blueprint_generator
      SET 
        blueprint_markdown = new_markdown,
        updated_at = NOW()
      WHERE id = blueprint_record.id;
      
      updated_count := updated_count + 1;
      
      -- Log progress every 10 records
      IF updated_count % 10 = 0 THEN
        RAISE NOTICE 'Updated % blueprints...', updated_count;
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Error processing blueprint %: %', blueprint_record.id, SQLERRM;
      CONTINUE;
    END;
  END LOOP;
  
  RAISE NOTICE 'Completed! Updated % blueprints with comprehensive markdown.', updated_count;
END $$;

-- Add a comment to document this migration
COMMENT ON FUNCTION generate_comprehensive_markdown(JSONB) IS 
'Converts blueprint JSON to comprehensive markdown format, including all sections: executive summary, learning objectives, target audience, content outline, resources, assessment strategy, timeline, risk mitigation, success metrics, instructional strategy, and sustainability plan.';

