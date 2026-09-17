CREATE OR REPLACE FUNCTION get_recipe_stats_agg(recipe_uuid UUID)
RETURNS TABLE (review_count INT, rating_count INT, average_rating NUMERIC) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(id)::INT AS review_count,
    COUNT(rating)::INT AS rating_count,
    COALESCE(ROUND(AVG(rating), 2), 0) AS average_rating
  FROM comments
  WHERE recipe_id = recipe_uuid
    AND parent_id IS NULL
    AND status = 'approved';
END;
$$ LANGUAGE plpgsql;
