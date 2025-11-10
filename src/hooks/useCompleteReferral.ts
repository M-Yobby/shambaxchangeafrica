import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useCompleteReferral = () => {
  useEffect(() => {
    checkAndCompleteReferral();
  }, []);

  const checkAndCompleteReferral = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user has a pending referral
      const { data: referral } = await supabase
        .from("referrals")
        .select("*")
        .eq("referred_id", user.id)
        .eq("status", "pending")
        .single();

      if (referral) {
        // Complete the referral
        await supabase.rpc("complete_referral", {
          p_referred_id: user.id,
        });
      }
    } catch (error) {
      // Silent fail - don't interrupt user experience
      console.error("Error completing referral:", error);
    }
  };

  return { completeReferral: checkAndCompleteReferral };
};