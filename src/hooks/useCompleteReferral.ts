import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Custom hook to automatically complete pending referrals for authenticated users.
 * 
 * Checks if the current user has any pending referrals and completes them by calling
 * the `complete_referral` database function. This hook runs once on component mount
 * and handles the referral completion process silently without interrupting user experience.
 * 
 * @returns {Object} An object containing the `completeReferral` function for manual invocation
 * 
 * @example
 * ```tsx
 * function Dashboard() {
 *   // Automatically checks and completes referrals on mount
 *   const { completeReferral } = useCompleteReferral();
 *   
 *   // Or manually trigger completion
 *   const handleManualCheck = async () => {
 *     await completeReferral();
 *   };
 *   
 *   return <div>Dashboard content</div>;
 * }
 * ```
 * 
 * @remarks
 * - Runs automatically on component mount
 * - Fails silently to avoid disrupting user experience
 * - Only affects users with pending referrals in the database
 * - Calls the `complete_referral` RPC function to award points and update status
 */
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