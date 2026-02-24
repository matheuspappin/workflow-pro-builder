-- Remove default dance modalities from non-dance studios
-- This cleans up data for studios that were created with the bug where dance modalities were inserted by default.

DELETE FROM modalities 
WHERE name IN ('Ballet', 'Jazz', 'Hip Hop') 
AND studio_id IN (
  SELECT studio_id 
  FROM organization_settings 
  WHERE niche NOT IN ('dance')
);
