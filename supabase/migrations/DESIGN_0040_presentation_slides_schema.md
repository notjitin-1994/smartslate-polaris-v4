# Presentation Slides Database Schema Design

**Migration Number**: 0040
**Feature**: Presentation Mode - Slide Type System
**Author**: Claude Code
**Date**: 2025-11-14
**Task**: Task 3 - Implement Slide Type System and Interfaces

## Overview

This migration implements a comprehensive database schema for storing presentation slides generated from learning blueprints. The schema supports 8 different slide layout types with flexible JSONB content storage, proper relationships, and performance optimization.

## Database Tables

### 1. `presentations` Table

Stores presentation metadata linked to blueprints.

```sql
CREATE TABLE IF NOT EXISTS public.presentations (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys
  blueprint_id UUID NOT NULL REFERENCES public.blueprint_generator(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Metadata
  title TEXT NOT NULL,
  description TEXT,
  author TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Presentation Settings (JSONB)
  settings JSONB NOT NULL DEFAULT '{
    "theme": "dark",
    "fontSize": "medium",
    "animations": true,
    "transitions": true,
    "laserPointerColor": "#14b8a6",
    "laserPointerSize": 16,
    "showProgressBar": true,
    "showSlideNumbers": true,
    "showTimer": false,
    "autoHideControls": true,
    "autoHideDelay": 3000
  }'::JSONB,

  -- Presentation Metadata (JSONB)
  metadata JSONB DEFAULT '{}'::JSONB,

  -- Status
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),

  -- Constraints
  CONSTRAINT presentations_blueprint_user_match
    CHECK (
      user_id IN (
        SELECT user_id FROM blueprint_generator WHERE id = blueprint_id
      )
    )
);
```

**Columns**:
- `id`: Unique presentation identifier
- `blueprint_id`: Reference to source blueprint
- `user_id`: Owner of the presentation (must match blueprint owner)
- `title`: Presentation title
- `description`: Optional description
- `author`: Presentation author name
- `settings`: Presentation configuration (theme, controls, etc.)
- `metadata`: Flexible metadata storage (tags, version, thumbnail, etc.)
- `status`: Presentation lifecycle status

**Rationale**:
- One presentation per blueprint (1:1 relationship initially, can be 1:N later)
- JSONB for settings allows flexible configuration without schema changes
- Status field enables draft/publish workflow

### 2. `presentation_slides` Table

Stores individual slides within presentations.

```sql
CREATE TABLE IF NOT EXISTS public.presentation_slides (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys
  presentation_id UUID NOT NULL REFERENCES public.presentations(id) ON DELETE CASCADE,

  -- Slide Identification
  slide_index INTEGER NOT NULL,
  slide_id TEXT NOT NULL, -- Unique within presentation

  -- Slide Type
  slide_type TEXT NOT NULL CHECK (slide_type IN (
    'cover',
    'section',
    'content',
    'metrics',
    'module',
    'timeline',
    'resources',
    'chart'
  )),

  -- Core Content
  title TEXT NOT NULL,
  subtitle TEXT,

  -- Slide Content (JSONB - structure varies by slide_type)
  content JSONB NOT NULL DEFAULT '{}'::JSONB,

  -- Slide Configuration
  transition TEXT DEFAULT 'slide' CHECK (transition IN ('fade', 'slide', 'zoom', 'none')),
  duration INTEGER, -- Auto-advance duration in milliseconds
  speaker_notes TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}'::JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT presentation_slides_unique_index
    UNIQUE (presentation_id, slide_index),
  CONSTRAINT presentation_slides_unique_id
    UNIQUE (presentation_id, slide_id),
  CONSTRAINT presentation_slides_positive_index
    CHECK (slide_index >= 0)
);
```

**Columns**:
- `id`: Unique slide identifier
- `presentation_id`: Parent presentation
- `slide_index`: Ordinal position (0-based, for sorting)
- `slide_id`: Human-readable ID (e.g., "cover-1", "metrics-2")
- `slide_type`: One of 8 layout types
- `title`, `subtitle`: Slide headings
- `content`: Type-specific slide content in JSONB
- `transition`: Animation type between slides
- `duration`: Auto-play timing
- `speaker_notes`: Presenter notes
- `metadata`: Additional slide data

**Content Structure by Type**:

#### Cover Slide (`slide_type = 'cover'`)
```json
{
  "mainTitle": "Presentation Title",
  "subtitle": "Optional subtitle",
  "backgroundImage": "https://...",
  "logo": "https://...",
  "author": "Author Name",
  "date": "2025-11-14"
}
```

#### Section Slide (`slide_type = 'section'`)
```json
{
  "sectionNumber": 1,
  "icon": "📚",
  "accentColor": "#14b8a6"
}
```

#### Content Slide (`slide_type = 'content'`)
```json
{
  "content": "Main text content",
  "bullets": ["Point 1", "Point 2"],
  "image": {
    "src": "https://...",
    "alt": "Image description",
    "position": "right"
  },
  "layout": "two-column"
}
```

#### Metrics Slide (`slide_type = 'metrics'`)
```json
{
  "metrics": [
    {
      "id": "metric-1",
      "label": "Completion Rate",
      "value": 95,
      "unit": "%",
      "trend": "up",
      "trendValue": 5,
      "icon": "📈",
      "color": "#14b8a6"
    }
  ],
  "layout": "grid"
}
```

#### Module Slide (`slide_type = 'module'`)
```json
{
  "moduleNumber": 1,
  "objectives": ["Objective 1", "Objective 2"],
  "estimatedDuration": "45 minutes",
  "topics": [
    {
      "id": "topic-1",
      "title": "Topic Title",
      "completed": false
    }
  ]
}
```

#### Timeline Slide (`slide_type = 'timeline'`)
```json
{
  "items": [
    {
      "id": "event-1",
      "date": "2025-01-01",
      "phase": "Phase 1",
      "title": "Milestone Title",
      "description": "Description",
      "status": "completed"
    }
  ],
  "orientation": "horizontal"
}
```

#### Resources Slide (`slide_type = 'resources'`)
```json
{
  "resources": [
    {
      "id": "resource-1",
      "title": "Resource Title",
      "description": "Description",
      "url": "https://...",
      "type": "link",
      "icon": "🔗"
    }
  ],
  "categories": ["Documentation", "Tools"]
}
```

#### Chart Slide (`slide_type = 'chart'`)
```json
{
  "chartType": "bar",
  "data": [
    {"name": "Category A", "value": 100}
  ],
  "xAxis": "name",
  "yAxis": "value",
  "legend": true,
  "colors": ["#14b8a6", "#3b82f6"],
  "annotations": [
    {
      "x": "Category A",
      "y": 100,
      "label": "Peak"
    }
  ]
}
```

**Rationale**:
- JSONB content allows type-specific data without separate tables
- slide_index ensures proper ordering
- slide_id enables human-readable references
- Unique constraints prevent duplicates

## Indexes

### Performance Indexes

```sql
-- Primary query patterns
CREATE INDEX idx_presentations_blueprint_id
  ON public.presentations(blueprint_id);

CREATE INDEX idx_presentations_user_id
  ON public.presentations(user_id);

CREATE INDEX idx_presentations_status
  ON public.presentations(status);

CREATE INDEX idx_presentations_created_at
  ON public.presentations(created_at DESC);

CREATE INDEX idx_presentation_slides_presentation_id
  ON public.presentation_slides(presentation_id);

CREATE INDEX idx_presentation_slides_slide_type
  ON public.presentation_slides(slide_type);

-- Composite indexes for common queries
CREATE INDEX idx_presentation_slides_presentation_index
  ON public.presentation_slides(presentation_id, slide_index);

-- GIN indexes for JSONB queries
CREATE INDEX idx_presentation_slides_content_gin
  ON public.presentation_slides USING GIN (content);

CREATE INDEX idx_presentations_settings_gin
  ON public.presentations USING GIN (settings);

CREATE INDEX idx_presentations_metadata_gin
  ON public.presentations USING GIN (metadata);
```

**Rationale**:
- B-tree indexes on frequently filtered columns
- Composite index on (presentation_id, slide_index) for ordered queries
- GIN indexes enable fast JSONB property searches

## Row Level Security (RLS)

### Presentations Table Policies

```sql
ALTER TABLE public.presentations ENABLE ROW LEVEL SECURITY;

-- Users can view their own presentations
CREATE POLICY "Users can select own presentations"
  ON public.presentations
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can create presentations for their blueprints
CREATE POLICY "Users can insert own presentations"
  ON public.presentations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    blueprint_id IN (
      SELECT id FROM blueprint_generator WHERE user_id = auth.uid()
    )
  );

-- Users can update their own presentations
CREATE POLICY "Users can update own presentations"
  ON public.presentations
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own presentations
CREATE POLICY "Users can delete own presentations"
  ON public.presentations
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
```

### Presentation Slides Table Policies

```sql
ALTER TABLE public.presentation_slides ENABLE ROW LEVEL SECURITY;

-- Users can view slides from their presentations
CREATE POLICY "Users can select own presentation slides"
  ON public.presentation_slides
  FOR SELECT
  TO authenticated
  USING (
    presentation_id IN (
      SELECT id FROM presentations WHERE user_id = auth.uid()
    )
  );

-- Users can insert slides into their presentations
CREATE POLICY "Users can insert own presentation slides"
  ON public.presentation_slides
  FOR INSERT
  TO authenticated
  WITH CHECK (
    presentation_id IN (
      SELECT id FROM presentations WHERE user_id = auth.uid()
    )
  );

-- Users can update slides in their presentations
CREATE POLICY "Users can update own presentation slides"
  ON public.presentation_slides
  FOR UPDATE
  TO authenticated
  USING (
    presentation_id IN (
      SELECT id FROM presentations WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    presentation_id IN (
      SELECT id FROM presentations WHERE user_id = auth.uid()
    )
  );

-- Users can delete slides from their presentations
CREATE POLICY "Users can delete own presentation slides"
  ON public.presentation_slides
  FOR DELETE
  TO authenticated
  USING (
    presentation_id IN (
      SELECT id FROM presentations WHERE user_id = auth.uid()
    )
  );
```

**Rationale**:
- RLS enforces data isolation at database level
- Policies ensure users only access their own data
- Subqueries validate ownership through presentation relationship

## Triggers

### Automatic Timestamp Updates

```sql
-- Update updated_at on presentations
CREATE OR REPLACE FUNCTION update_presentations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_presentations_updated_at
  BEFORE UPDATE ON public.presentations
  FOR EACH ROW
  EXECUTE FUNCTION update_presentations_updated_at();

-- Update updated_at on presentation_slides
CREATE OR REPLACE FUNCTION update_presentation_slides_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_presentation_slides_updated_at
  BEFORE UPDATE ON public.presentation_slides
  FOR EACH ROW
  EXECUTE FUNCTION update_presentation_slides_updated_at();
```

### Slide Index Validation

```sql
-- Ensure slide_index is sequential
CREATE OR REPLACE FUNCTION validate_slide_index()
RETURNS TRIGGER AS $$
DECLARE
  max_index INTEGER;
BEGIN
  SELECT COALESCE(MAX(slide_index), -1) INTO max_index
  FROM presentation_slides
  WHERE presentation_id = NEW.presentation_id;

  IF NEW.slide_index > max_index + 1 THEN
    RAISE EXCEPTION 'Slide index must be sequential. Expected %, got %',
      max_index + 1, NEW.slide_index;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_slide_index
  BEFORE INSERT ON public.presentation_slides
  FOR EACH ROW
  EXECUTE FUNCTION validate_slide_index();
```

## Schema Validation

### JSONB Content Validation (Future Enhancement)

For strict content validation, we can add check constraints or triggers:

```sql
-- Example: Validate cover slide content structure
CREATE OR REPLACE FUNCTION validate_cover_slide_content(content JSONB)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    content ? 'mainTitle' AND
    jsonb_typeof(content->'mainTitle') = 'string'
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add as constraint (optional, can impact flexibility)
ALTER TABLE presentation_slides
  ADD CONSTRAINT check_cover_slide_content
  CHECK (
    slide_type != 'cover' OR
    validate_cover_slide_content(content)
  );
```

**Note**: JSONB validation constraints are optional and can be added in future iterations if strict validation is required.

## Performance Considerations

1. **JSONB Indexing**: GIN indexes on content fields enable fast queries but increase storage ~30%
2. **Cascade Deletes**: ON DELETE CASCADE ensures referential integrity with minimal overhead
3. **Index Selectivity**: Indexes chosen based on common query patterns (user_id, presentation_id, slide_type)
4. **Partial Indexes**: Can add partial indexes for common filters (e.g., status = 'published')

## Storage Estimates

Assuming average presentation:
- 20 slides per presentation
- 2KB average per slide content
- 500 bytes presentation metadata

**Per Presentation**: ~40KB + indexes (~12KB) = **52KB total**

For 10,000 presentations: ~520MB

## Migration Strategy

1. Create tables in order: presentations → presentation_slides
2. Add indexes after table creation for better initial load performance
3. Enable RLS and create policies
4. Add triggers last
5. Test with sample data
6. Validate constraints and policies
7. Run ANALYZE to update statistics

## Rollback Strategy

```sql
-- Drop in reverse order
DROP TRIGGER IF EXISTS trigger_validate_slide_index ON presentation_slides;
DROP TRIGGER IF EXISTS trigger_update_presentation_slides_updated_at ON presentation_slides;
DROP TRIGGER IF EXISTS trigger_update_presentations_updated_at ON presentations;

DROP FUNCTION IF EXISTS validate_slide_index();
DROP FUNCTION IF EXISTS update_presentation_slides_updated_at();
DROP FUNCTION IF EXISTS update_presentations_updated_at();

DROP TABLE IF EXISTS public.presentation_slides CASCADE;
DROP TABLE IF EXISTS public.presentations CASCADE;
```

## Testing Plan

1. **Constraint Tests**:
   - Verify slide_type enum constraint
   - Test cascade deletes
   - Validate unique constraints

2. **RLS Tests**:
   - Verify user isolation
   - Test cross-user access prevention
   - Validate blueprint ownership checks

3. **Performance Tests**:
   - Query performance with indexes
   - JSONB query speed
   - Bulk insert performance

4. **Integration Tests**:
   - Create presentation from blueprint
   - Add/update/delete slides
   - Query slides by type
   - Full presentation rendering

## Future Enhancements

1. **Versioning**: Add version column to track presentation revisions
2. **Sharing**: Add sharing_token and is_public columns
3. **Analytics**: Track view counts, engagement metrics
4. **Templates**: Add presentation_templates table
5. **Collaboration**: Add collaborators junction table
6. **Export Formats**: Store PDF/PPTX export metadata

## References

- PostgreSQL 15 JSONB Documentation
- Supabase RLS Best Practices
- SmartSlate Polaris Database Conventions
- TypeScript Presentation Types: `frontend/types/presentation.ts`
