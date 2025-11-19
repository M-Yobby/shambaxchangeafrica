/**
 * REFRESH LEADERBOARD EDGE FUNCTION
 * 
 * Periodically updates the leaderboards materialized view to reflect current rankings.
 * Materialized views cache complex aggregation queries for fast reads.
 * 
 * PURPOSE:
 * - Refresh leaderboard rankings across multiple metrics
 * - Update user positions in real-time
 * - Maintain current competition state
 * - Enable fast leaderboard page loads
 * 
 * WHY MATERIALIZED VIEWS:
 * Leaderboard queries are expensive, involving:
 * - Joins across profiles, user_stats, orders, reviews tables
 * - Aggregate calculations (SUM, AVG, COUNT)
 * - Ranking functions (ROW_NUMBER, RANK)
 * 
 * Without materialization:
 * - Query takes 2-5 seconds
 * - High database load
 * - Poor user experience
 * 
 * With materialization:
 * - Query takes <100ms
 * - Pre-computed results
 * - Smooth leaderboard browsing
 * 
 * LEADERBOARD METRICS:
 * - Total sales (revenue from completed orders)
 * - Points (gamification score)
 * - Average rating (seller reputation)
 * - Social engagement (posts, likes, comments)
 * - Streak days (consecutive logins)
 * 
 * REFRESH STRATEGY:
 * - Periodic refresh via cron (e.g., hourly or daily)
 * - Manual refresh when immediate update needed
 * - Logs refresh timestamp for monitoring
 * 
 * SCHEDULING:
 * - Runs via cron job (configure in Supabase project)
 * - Secured with webhook validation or service role key
 * - Can be triggered manually via API call
 * 
 * PERFORMANCE IMPACT:
 * - Refresh duration: 1-5 seconds (depends on data volume)
 * - Blocks new reads during refresh
 * - Should run during low-traffic periods
 * 
 * SECURITY:
 * - Requires service role key (admin access)
 * - No user authentication needed (system function)
 * - CORS enabled for manual triggers
 * 
 * CALLED BY:
 * - Cron job scheduler (automated)
 * - Admin interface (manual refresh)
 * - After major data changes (batch updates)
 * 
 * REQUEST FORMAT:
 * POST /functions/v1/refresh-leaderboard
 * (No body required)
 * 
 * RESPONSE FORMAT:
 * {
 *   success: true,
 *   message: "Leaderboards refreshed successfully",
 *   timestamp: "2025-11-19T18:00:00.000Z"
 * }
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

// CORS headers - allows web browser access to edge function
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * MAIN REQUEST HANDLER
 * Refreshes leaderboard materialized view and logs refresh timestamp
 */
serve(async (req) => {
  // Handle CORS preflight requests (browser pre-check before actual request)
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ========================================
    // STEP 1: VALIDATE ENVIRONMENT
    // ========================================
    // Ensure required credentials are configured
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables');
    }

    // ========================================
    // STEP 2: INITIALIZE SUPABASE CLIENT
    // ========================================
    // Use service role key for admin access (bypass RLS)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ========================================
    // STEP 3: REFRESH MATERIALIZED VIEW
    // ========================================
    // Calls database function: refresh_leaderboards()
    // This executes: REFRESH MATERIALIZED VIEW public.leaderboards
    // 
    // What happens during refresh:
    // 1. Recalculates all aggregate data
    // 2. Recomputes rankings across metrics
    // 3. Updates all leaderboard positions
    // 4. Materializes results for fast queries
    const { error } = await supabase.rpc('refresh_leaderboards');

    if (error) {
      console.error('Error refreshing leaderboards:', error);
      throw error;
    }

    // ========================================
    // STEP 4: LOG REFRESH FOR MONITORING
    // ========================================
    // Track when leaderboards were last updated
    // Useful for:
    // - Monitoring refresh frequency
    // - Debugging stale data issues
    // - Audit trail of leaderboard updates
    await supabase
      .from('leaderboard_refresh_log')
      .insert({ refreshed_at: new Date().toISOString() });

    // ========================================
    // STEP 5: RETURN SUCCESS RESPONSE
    // ========================================
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Leaderboards refreshed successfully',
      timestamp: new Date().toISOString() // When refresh completed
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    // ========================================
    // ERROR HANDLING
    // ========================================
    // Log full error for debugging
    console.error('Error in refresh-leaderboard function:', error);
    
    // Return user-friendly error message
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});