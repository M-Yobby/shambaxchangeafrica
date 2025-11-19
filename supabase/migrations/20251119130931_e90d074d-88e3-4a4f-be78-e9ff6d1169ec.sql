-- Add streak milestones tracking to user_stats
ALTER TABLE public.user_stats 
ADD COLUMN IF NOT EXISTS streak_milestones jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS featured_until timestamp with time zone DEFAULT NULL;

-- Update the update_streak function to include milestone rewards
CREATE OR REPLACE FUNCTION public.update_streak(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_last_login date;
  v_current_streak int;
  v_milestones jsonb;
  v_new_milestone text;
BEGIN
  SELECT last_login, streak_days, streak_milestones 
  INTO v_last_login, v_current_streak, v_milestones
  FROM public.user_stats
  WHERE user_id = p_user_id;
  
  -- If no stats record, create one
  IF NOT FOUND THEN
    INSERT INTO public.user_stats (user_id, last_login, streak_days, streak_milestones)
    VALUES (p_user_id, CURRENT_DATE, 1, '[]'::jsonb);
    RETURN;
  END IF;
  
  -- Check if logged in today already
  IF v_last_login = CURRENT_DATE THEN
    RETURN;
  END IF;
  
  -- Check if streak continues (logged in yesterday)
  IF v_last_login = CURRENT_DATE - INTERVAL '1 day' THEN
    v_current_streak := v_current_streak + 1;
    
    UPDATE public.user_stats
    SET 
      streak_days = v_current_streak,
      last_login = CURRENT_DATE,
      updated_at = now()
    WHERE user_id = p_user_id;
    
    -- Award streak bonus points
    PERFORM public.award_points(p_user_id, 5, 'daily login streak');
    
    -- Check for milestone achievements
    v_new_milestone := NULL;
    
    -- 7-day streak milestone
    IF v_current_streak = 7 AND NOT (v_milestones @> '"7_day"'::jsonb) THEN
      v_new_milestone := '7_day';
      
      -- Update badges and milestones
      UPDATE public.user_stats
      SET 
        badges = badges || '["Week Warrior"]'::jsonb,
        streak_milestones = streak_milestones || '"7_day"'::jsonb
      WHERE user_id = p_user_id;
      
      -- Award bonus points
      PERFORM public.award_points(p_user_id, 50, '7-day streak milestone');
      
      -- Notify user
      INSERT INTO public.notifications (user_id, type, title, message, data)
      VALUES (
        p_user_id,
        'system',
        '🔥 7-Day Streak!',
        'Amazing! You earned the "Week Warrior" badge for logging in 7 days in a row!',
        jsonb_build_object('milestone', '7_day', 'badge', 'Week Warrior')
      );
    END IF;
    
    -- 30-day streak milestone
    IF v_current_streak = 30 AND NOT (v_milestones @> '"30_day"'::jsonb) THEN
      v_new_milestone := '30_day';
      
      -- Update badges, milestones, and featured status
      UPDATE public.user_stats
      SET 
        badges = badges || '["Month Master"]'::jsonb,
        streak_milestones = streak_milestones || '"30_day"'::jsonb,
        featured_until = CURRENT_DATE + INTERVAL '7 days'
      WHERE user_id = p_user_id;
      
      -- Award bonus points
      PERFORM public.award_points(p_user_id, 200, '30-day streak milestone');
      
      -- Notify user
      INSERT INTO public.notifications (user_id, type, title, message, data)
      VALUES (
        p_user_id,
        'system',
        '🌟 30-Day Streak!',
        'Incredible! You earned the "Month Master" badge and your profile will be featured for a week!',
        jsonb_build_object('milestone', '30_day', 'badge', 'Month Master', 'featured_days', 7)
      );
    END IF;
    
    -- 90-day streak milestone
    IF v_current_streak = 90 AND NOT (v_milestones @> '"90_day"'::jsonb) THEN
      v_new_milestone := '90_day';
      
      -- Update badges and milestones
      UPDATE public.user_stats
      SET 
        badges = badges || '["Dedicated Farmer"]'::jsonb,
        streak_milestones = streak_milestones || '"90_day"'::jsonb
      WHERE user_id = p_user_id;
      
      -- Award bonus points
      PERFORM public.award_points(p_user_id, 500, '90-day streak milestone');
      
      -- Notify user
      INSERT INTO public.notifications (user_id, type, title, message, data)
      VALUES (
        p_user_id,
        'system',
        '💎 90-Day Streak!',
        'Outstanding! You earned the "Dedicated Farmer" status! You are among the most committed farmers on shambaXchange!',
        jsonb_build_object('milestone', '90_day', 'badge', 'Dedicated Farmer')
      );
    END IF;
    
  ELSE
    -- Streak broken, reset to 1
    UPDATE public.user_stats
    SET 
      streak_days = 1,
      last_login = CURRENT_DATE,
      updated_at = now()
    WHERE user_id = p_user_id;
  END IF;
END;
$function$;