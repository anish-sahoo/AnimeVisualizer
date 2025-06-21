CREATE OR REPLACE VIEW anime_full_json AS
SELECT
  a.id,
  json_build_object(
    'id', a.id,
    'title', a.title,
    'thumbnail', a.thumbnail,
    'start_date', a.start_date,
    'end_date', a.end_date,
    'synopsis', a.synopsis,
    'score', a.score,
    'rank', a."rank",
    'popularity', a.popularity,
    'num_list_users', a.num_list_users,
    'num_scoring_users', a.num_scoring_users,
    'updated_at', a.updated_at,
    'last_scraped_at', a.last_scraped_at,
    'media_type', a.media_type,
    'status', a.status,
    'num_episodes', a.num_episodes,
    'source', a.source,
    'active', a.active,
    'genres', COALESCE(json_agg(DISTINCT g.name) FILTER (WHERE g.name IS NOT NULL), '[]'),
    'studios', COALESCE(json_agg(DISTINCT s.name) FILTER (WHERE s.name IS NOT NULL), '[]'),
    'results', COALESCE(json_agg(DISTINCT jsonb_build_object(
      'context', r.context,
      'times_appeared', r.times_appeared
    )) FILTER (WHERE r.context IS NOT NULL), '[]')
  ) AS anime_json
FROM anime a
LEFT JOIN anime_genres ag ON ag.anime_id = a.id
LEFT JOIN genres g ON g.id = ag.genre_id
LEFT JOIN anime_studios ast ON ast.anime_id = a.id
LEFT JOIN studios s ON s.id = ast.studio_id
LEFT JOIN results r ON r.anime_id = a.id
GROUP BY a.id;

CREATE OR REPLACE VIEW anime_basic_json AS
SELECT
  a.id,
  json_build_object(
    'id', a.id,
    'title', a.title,
    'thumbnail', a.thumbnail,
    'score', a.score,
    'rank', a."rank",
    'popularity', a.popularity,
    'media_type', a.media_type,
    'status', a.status,
    'num_episodes', a.num_episodes,
    'genres', COALESCE(json_agg(DISTINCT g.name) FILTER (WHERE g.name IS NOT NULL), '[]'),
    'studios', COALESCE(json_agg(DISTINCT s.name) FILTER (WHERE s.name IS NOT NULL), '[]')
  ) AS anime_json
FROM anime a
LEFT JOIN anime_genres ag ON ag.anime_id = a.id
LEFT JOIN genres g ON g.id = ag.genre_id
LEFT JOIN anime_studios ast ON ast.anime_id = a.id
LEFT JOIN studios s ON s.id = ast.studio_id
GROUP BY a.id;
