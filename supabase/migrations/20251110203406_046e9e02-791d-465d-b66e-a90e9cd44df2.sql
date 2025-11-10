-- Create materialized view for leaderboards
CREATE MATERIALIZED VIEW public.leaderboards AS
SELECT 
  p.id as user_id,
  p.full_name,
  p.location,
  COALESCE(SUM(CASE WHEN o.status = 'completed' THEN o.amount ELSE 0 END), 0) as total_sales,
  COUNT(DISTINCT CASE WHEN o.status = 'completed' THEN o.id END) as completed_orders,
  COALESCE(AVG(r.rating), 0) as avg_rating,
  COUNT(DISTINCT r.id) as total_reviews,
  COALESCE(us.total_points, 0) as points,
  COALESCE(us.level, 1) as level,
  COALESCE(us.streak_days, 0) as streak_days,
  COUNT(DISTINCT posts.id) as total_posts,
  COALESCE(SUM(posts.likes_count), 0) as total_likes_received,
  COUNT(DISTINCT likes.id) as total_likes_given,
  COUNT(DISTINCT comments.id) as total_comments
FROM public.profiles p
LEFT JOIN public.orders o ON p.id = o.seller_id
LEFT JOIN public.reviews r ON p.id = r.reviewee_id
LEFT JOIN public.user_stats us ON p.id = us.user_id
LEFT JOIN public.posts ON p.id = posts.user_id
LEFT JOIN public.likes ON p.id = likes.user_id
LEFT JOIN public.comments ON p.id = comments.user_id
GROUP BY p.id, p.full_name, p.location, us.total_points, us.level, us.streak_days;

-- Create index for faster queries
CREATE INDEX idx_leaderboards_total_sales ON public.leaderboards(total_sales DESC);
CREATE INDEX idx_leaderboards_points ON public.leaderboards(points DESC);
CREATE INDEX idx_leaderboards_engagement ON public.leaderboards((total_likes_received + total_comments) DESC);
CREATE INDEX idx_leaderboards_location ON public.leaderboards(location);

-- Enable RLS on materialized view (it's a view so everyone can read)
ALTER MATERIALIZED VIEW public.leaderboards OWNER TO postgres;

-- Function to refresh leaderboard
CREATE OR REPLACE FUNCTION public.refresh_leaderboards()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW public.leaderboards;
END;
$$;

-- Create a table to track last refresh time
CREATE TABLE public.leaderboard_refresh_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  refreshed_at timestamptz DEFAULT now()
);

ALTER TABLE public.leaderboard_refresh_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view refresh log"
  ON public.leaderboard_refresh_log FOR SELECT
  USING (true);