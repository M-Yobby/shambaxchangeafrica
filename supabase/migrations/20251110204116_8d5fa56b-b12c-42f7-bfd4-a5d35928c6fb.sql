-- Add referral_code to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate 8-character alphanumeric code
    new_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE referral_code = new_code) INTO code_exists;
    
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$$;

-- Function to assign referral code to user (called on signup)
CREATE OR REPLACE FUNCTION public.assign_referral_code(p_user_id uuid)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code TEXT;
BEGIN
  -- Generate unique code
  v_code := public.generate_referral_code();
  
  -- Update user profile
  UPDATE public.profiles
  SET referral_code = v_code
  WHERE id = p_user_id;
  
  RETURN v_code;
END;
$$;

-- Function to process referral on signup
CREATE OR REPLACE FUNCTION public.process_referral(
  p_new_user_id uuid,
  p_referral_code TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_id uuid;
BEGIN
  -- Find referrer by code
  SELECT id INTO v_referrer_id
  FROM public.profiles
  WHERE referral_code = p_referral_code;
  
  IF v_referrer_id IS NOT NULL THEN
    -- Create referral record
    INSERT INTO public.referrals (referrer_id, referred_id, status)
    VALUES (v_referrer_id, p_new_user_id, 'pending');
    
    -- Notify referrer
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      v_referrer_id,
      'system',
      'New Referral!',
      'Someone just signed up using your referral code!',
      jsonb_build_object('referred_id', p_new_user_id)
    );
  END IF;
END;
$$;

-- Function to complete referral and award rewards
CREATE OR REPLACE FUNCTION public.complete_referral(p_referred_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_id uuid;
  v_total_completed int;
BEGIN
  -- Find and update referral
  UPDATE public.referrals
  SET status = 'completed'
  WHERE referred_id = p_referred_id AND status = 'pending'
  RETURNING referrer_id INTO v_referrer_id;
  
  IF v_referrer_id IS NOT NULL THEN
    -- Award points to referrer
    PERFORM public.award_points(v_referrer_id, 100, 'successful referral');
    
    -- Award points to referred user
    PERFORM public.award_points(p_referred_id, 50, 'joining via referral');
    
    -- Count total completed referrals
    SELECT COUNT(*) INTO v_total_completed
    FROM public.referrals
    WHERE referrer_id = v_referrer_id AND status = 'completed';
    
    -- Award badges at milestones
    IF v_total_completed = 3 THEN
      -- Update badges in user_stats
      UPDATE public.user_stats
      SET badges = badges || '["Recruiter"]'::jsonb
      WHERE user_id = v_referrer_id;
      
      INSERT INTO public.notifications (user_id, type, title, message)
      VALUES (
        v_referrer_id,
        'system',
        '🎉 Badge Earned!',
        'You earned the "Recruiter" badge for 3 successful referrals!'
      );
    END IF;
    
    IF v_total_completed = 10 THEN
      UPDATE public.user_stats
      SET badges = badges || '["Community Builder"]'::jsonb
      WHERE user_id = v_referrer_id;
      
      INSERT INTO public.notifications (user_id, type, title, message)
      VALUES (
        v_referrer_id,
        'system',
        '🎉 Badge Earned!',
        'You earned the "Community Builder" badge for 10 successful referrals!'
      );
    END IF;
    
    -- Notify referrer of completion
    INSERT INTO public.notifications (user_id, type, title, message)
    VALUES (
      v_referrer_id,
      'system',
      'Referral Completed!',
      format('Your referral is now active. You earned 100 points! Total referrals: %s', v_total_completed)
    );
  END IF;
END;
$$;

-- Trigger to assign referral code on profile creation
CREATE OR REPLACE FUNCTION public.handle_new_profile_referral()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := public.generate_referral_code();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_created_assign_code ON public.profiles;
CREATE TRIGGER on_profile_created_assign_code
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_profile_referral();