CREATE OR REPLACE FUNCTION get_top_rated_recipes(min_rating NUMERIC)
RETURNS SETOF recipes AS $$
BEGIN
  RETURN QUERY
  SELECT r.*
  FROM recipes r
  JOIN (
    SELECT recipe_id
    FROM comments
    WHERE parent_id IS NULL AND status = 'approved' AND rating IS NOT NULL
    GROUP BY recipe_id
    HAVING ROUND(AVG(rating), 2) >= min_rating
  ) top_rated ON r.id = top_rated.recipe_id;
END;
$$ LANGUAGE plpgsql;
