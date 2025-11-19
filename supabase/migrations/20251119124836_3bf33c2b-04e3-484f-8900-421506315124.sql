-- Create a function to get popular crops (appearing more than 5 times across the platform)
CREATE OR REPLACE FUNCTION get_popular_crops()
RETURNS TABLE (crop_name TEXT, usage_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  WITH all_crops AS (
    -- Get crops from dashboard
    SELECT LOWER(TRIM(crops.crop_name)) as name
    FROM crops
    WHERE status = 'active'
    
    UNION ALL
    
    -- Get crops from marketplace listings
    SELECT LOWER(TRIM(marketplace_listings.crop_name)) as name
    FROM marketplace_listings
    WHERE status = 'active'
  )
  SELECT 
    name::TEXT as crop_name,
    COUNT(*)::BIGINT as usage_count
  FROM all_crops
  GROUP BY name
  HAVING COUNT(*) > 5
  ORDER BY usage_count DESC, name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;