-- Fix search path for get_popular_crops function
CREATE OR REPLACE FUNCTION get_popular_crops()
RETURNS TABLE (crop_name TEXT, usage_count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH all_crops AS (
    -- Get crops from dashboard
    SELECT LOWER(TRIM(crops.crop_name)) as name
    FROM public.crops
    WHERE status = 'active'
    
    UNION ALL
    
    -- Get crops from marketplace listings
    SELECT LOWER(TRIM(marketplace_listings.crop_name)) as name
    FROM public.marketplace_listings
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
$$;