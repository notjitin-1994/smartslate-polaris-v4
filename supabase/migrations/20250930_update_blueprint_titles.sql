-- Migration: Update blueprint titles to new naming schema
-- Created: September 30, 2025
-- Description: Updates ALL existing blueprint titles to follow the new naming pattern

-- Backup existing titles (optional - creates a backup column)
-- ALTER TABLE blueprint_generator ADD COLUMN IF NOT EXISTS title_backup TEXT;
-- UPDATE blueprint_generator SET title_backup = title WHERE title_backup IS NULL;

-- Update ALL blueprints to new standard title
-- This will update every blueprint in the database to use the new consistent naming
UPDATE blueprint_generator
SET title = 'Starmap for Professional Development and Career Growth Path'
WHERE title != 'Starmap for Professional Development and Career Growth Path' 
   OR title IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN blueprint_generator.title IS 'Blueprint title following pattern: "Starmap for [Purpose/Focus Area]". Default: "Starmap for Professional Development and Career Growth Path"';

-- Show results
SELECT 
  COUNT(*) as total_updated,
  'All blueprints updated to new title format' as status
FROM blueprint_generator
WHERE title = 'Starmap for Professional Development and Career Growth Path';
