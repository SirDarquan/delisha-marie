CREATE OR REPLACE FUNCTION get_top_rated_recipe_ids(min_rating NUMERIC)
RETURNS TABLE (recipe_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT c.recipe_id
  FROM comments c
  WHERE c.parent_id IS NULL AND c.status = 'approved' AND c.rating IS NOT NULL
  GROUP BY c.recipe_id
  HAVING ROUND(AVG(c.rating), 2) >= min_rating;
END;
$$ LANGUAGE plpgsql;
