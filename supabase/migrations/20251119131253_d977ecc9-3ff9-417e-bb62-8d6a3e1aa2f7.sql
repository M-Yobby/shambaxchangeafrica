-- Update award_points to show progress to next level
CREATE OR REPLACE FUNCTION public.award_points(p_user_id uuid, p_points integer, p_action text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_new_points int;
  v_new_level int;
  v_points_to_next_level int;
  v_previous_level int;
BEGIN
  -- Get current level before update
  SELECT level INTO v_previous_level
  FROM public.user_stats
  WHERE user_id = p_user_id;
  
  -- Insert stats row if doesn't exist
  INSERT INTO public.user_stats (user_id, total_points)
  VALUES (p_user_id, p_points)
  ON CONFLICT (user_id)
  DO UPDATE SET
    total_points = user_stats.total_points + p_points,
    updated_at = now();
  
  -- Calculate new level (every 100 points = 1 level)
  SELECT total_points INTO v_new_points
  FROM public.user_stats
  WHERE user_id = p_user_id;
  
  v_new_level := FLOOR(v_new_points / 100) + 1;
  
  UPDATE public.user_stats
  SET level = v_new_level
  WHERE user_id = p_user_id;
  
  -- Calculate points needed for next level
  v_points_to_next_level := (v_new_level * 100) - v_new_points;
  
  -- Check if level increased
  IF v_new_level > COALESCE(v_previous_level, 1) THEN
    -- Level up notification
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      p_user_id,
      'system',
      '🎉 Level Up!',
      format('Congratulations! You reached Level %s! %s points until Level %s', 
        v_new_level, v_points_to_next_level, v_new_level + 1),
      jsonb_build_object(
        'points', p_points, 
        'action', p_action,
        'new_level', v_new_level,
        'points_to_next_level', v_points_to_next_level
      )
    );
  ELSE
    -- Regular points notification with progress
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      p_user_id,
      'system',
      'Points Earned!',
      format('You earned %s points for %s. %s more points until Level %s', 
        p_points, p_action, v_points_to_next_level, v_new_level + 1),
      jsonb_build_object(
        'points', p_points, 
        'action', p_action,
        'current_level', v_new_level,
        'points_to_next_level', v_points_to_next_level
      )
    );
  END IF;
END;
$function$;

-- Update update_streak to show progress to next milestone
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
  v_days_to_next_milestone int;
  v_next_milestone int;
BEGIN
  SELECT last_login, streak_days, streak_milestones 
  INTO v_last_login, v_current_streak, v_milestones
  FROM public.user_stats
  WHERE user_id = p_user_id;
  
  -- If no stats record, create one
  IF NOT FOUND THEN
    INSERT INTO public.user_stats (user_id, last_login, streak_days, streak_milestones)
    VALUES (p_user_id, CURRENT_DATE, 1, '[]'::jsonb);
    
    -- Send welcome streak notification
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      p_user_id,
      'system',
      '🔥 Streak Started!',
      'Day 1 of your streak! Log in daily to reach milestones. 6 more days until your first milestone!',
      jsonb_build_object('days_to_next_milestone', 6, 'next_milestone', 7)
    );
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
    
    -- Calculate next milestone
    IF v_current_streak < 7 THEN
      v_next_milestone := 7;
    ELSIF v_current_streak < 30 THEN
      v_next_milestone := 30;
    ELSIF v_current_streak < 90 THEN
      v_next_milestone := 90;
    ELSE
      v_next_milestone := 365; -- Next year milestone
    END IF;
    
    v_days_to_next_milestone := v_next_milestone - v_current_streak;
    
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
      
      -- Notify user with progress to next milestone
      INSERT INTO public.notifications (user_id, type, title, message, data)
      VALUES (
        p_user_id,
        'system',
        '🔥 7-Day Streak!',
        format('Amazing! You earned the "Week Warrior" badge! Keep going - %s more days until the 30-day "Month Master" milestone!', 
          v_days_to_next_milestone),
        jsonb_build_object(
          'milestone', '7_day', 
          'badge', 'Week Warrior',
          'days_to_next_milestone', v_days_to_next_milestone,
          'next_milestone', 30
        )
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
      
      -- Notify user with progress to next milestone
      INSERT INTO public.notifications (user_id, type, title, message, data)
      VALUES (
        p_user_id,
        'system',
        '🌟 30-Day Streak!',
        format('Incredible! You earned the "Month Master" badge and your profile will be featured for a week! %s more days until the ultimate "Dedicated Farmer" milestone!', 
          v_days_to_next_milestone),
        jsonb_build_object(
          'milestone', '30_day', 
          'badge', 'Month Master', 
          'featured_days', 7,
          'days_to_next_milestone', v_days_to_next_milestone,
          'next_milestone', 90
        )
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
        'Outstanding! You earned the "Dedicated Farmer" status! You are among the most committed farmers on shambaXchange! Keep your streak going strong!',
        jsonb_build_object(
          'milestone', '90_day', 
          'badge', 'Dedicated Farmer',
          'days_to_next_milestone', v_days_to_next_milestone,
          'next_milestone', 365
        )
      );
    END IF;
    
    -- If no milestone reached, send regular streak notification
    IF v_new_milestone IS NULL AND v_current_streak > 1 THEN
      INSERT INTO public.notifications (user_id, type, title, message, data)
      VALUES (
        p_user_id,
        'system',
        format('🔥 %s-Day Streak!', v_current_streak),
        format('You''re on fire! %s more day%s until your next milestone at %s days!',
          v_days_to_next_milestone,
          CASE WHEN v_days_to_next_milestone = 1 THEN '' ELSE 's' END,
          v_next_milestone),
        jsonb_build_object(
          'current_streak', v_current_streak,
          'days_to_next_milestone', v_days_to_next_milestone,
          'next_milestone', v_next_milestone
        )
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
    
    -- Notify about streak reset
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      p_user_id,
      'system',
      '⚠️ Streak Reset',
      format('Your %s-day streak was reset. Starting fresh at Day 1! Log in daily to reach the 7-day milestone.', 
        v_current_streak),
      jsonb_build_object(
        'previous_streak', v_current_streak,
        'days_to_next_milestone', 6,
        'next_milestone', 7
      )
    );
  END IF;
END;
$function$;