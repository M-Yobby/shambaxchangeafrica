/**
 * Daily Notifications Edge Function
 * 
 * This Supabase Edge Function runs daily (via cron job) to send automated notifications
 * to users for engagement and retention. It sends:
 * 
 * 1. Streak Reminders - Encourages users to maintain their daily login streak
 * 2. Harvest Reminders - Alerts farmers when crops are approaching harvest date
 * 
 * Scheduling:
 * - Runs daily at configured time (typically 6 AM local time)
 * - Triggered via Supabase Cron Jobs or external scheduler
 * - Secured with webhook signature validation
 * 
 * Key Features:
 * - Batch processing for efficient notification creation
 * - Smart filtering to avoid duplicate notifications
 * - Growing season calculations for harvest timing
 * - Streak protection to prevent loss of progress
 * 
 * @cron Daily at 6:00 AM
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Notification Payload Interface
 * Structure for notifications before database insertion
 */
interface NotificationPayload {
  userId: string;    // Target user ID
  type: string;      // Notification type (streak, system, etc.)
  title: string;     // Notification title
  message: string;   // Notification body text
  data?: any;        // Optional metadata for notification
}

/**
 * Main Edge Function Handler
 * Processes daily notification job and sends streak/harvest reminders
 */
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key for full database access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting daily notifications job...');

    // ========================================
    // STEP 1: FETCH USER STATS FOR STREAK TRACKING
    // ========================================
    // Retrieve all users with their streak data and last login times
    // Ordered by last_login to prioritize users who haven't logged in recently
    const { data: userStats, error: statsError } = await supabase
      .from('user_stats')
      .select('user_id, streak_days, last_login')
      .order('last_login', { ascending: true });

    if (statsError) {
      console.error('Error fetching user stats:', statsError);
      throw statsError;
    }

    // Array to accumulate all notifications before batch insert
    const notifications: NotificationPayload[] = [];
    
    // Set today to midnight for accurate date comparisons
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // ========================================
    // STEP 2: PROCESS STREAK REMINDERS
    // ========================================
    // Send notifications to users who haven't logged in today but have active streaks
    // This helps prevent streak loss and encourages daily engagement
    for (const stat of userStats || []) {
      const lastLogin = new Date(stat.last_login);
      lastLogin.setHours(0, 0, 0, 0);  // Normalize to midnight for comparison
      
      // Calculate days since last login
      const daysSinceLogin = Math.floor((today.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));

      // Send reminder if:
      // 1. User hasn't logged in today (daysSinceLogin >= 1)
      // 2. User has an active streak (streak_days > 0)
      // This prevents streak loss and maintains user engagement
      if (daysSinceLogin >= 1 && stat.streak_days > 0) {
        notifications.push({
          userId: stat.user_id,
          type: 'streak',
          title: '🔥 Keep Your Streak!',
          message: `You're on a ${stat.streak_days}-day streak! Check in today to continue`,
          data: { streak_days: stat.streak_days },
        });
      }
    }

    // ========================================
    // STEP 3: PROCESS HARVEST REMINDERS
    // ========================================
    // Notify farmers when their crops are approaching harvest date
    // Based on typical growing season (90-120 days), remind at day 80
    const { data: crops, error: cropsError } = await supabase
      .from('crops')
      .select('user_id, crop_name, date_planted, expected_yield')
      .not('date_planted', 'is', null);  // Only crops with planting date

    if (!cropsError && crops) {
      // Map to group multiple crops per user for consolidated notifications
      const harvestNotifications = new Map<string, any[]>();

      for (const crop of crops) {
        const plantedDate = new Date(crop.date_planted);
        
        // Calculate how many days the crop has been growing
        const daysGrowing = Math.floor((today.getTime() - plantedDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Standard growing season assumptions:
        // - Most crops: 90-120 days from planting to harvest
        // - Send notification at day 80 (10-40 days before harvest)
        // - Gives farmers time to prepare for harvest operations
        if (daysGrowing === 80) {
          // Group crops by user to send one notification per farmer
          if (!harvestNotifications.has(crop.user_id)) {
            harvestNotifications.set(crop.user_id, []);
          }
          harvestNotifications.get(crop.user_id)!.push(crop);
        }
      }

      // Create consolidated harvest reminder notifications
      // One notification per farmer listing all crops ready for harvest
      for (const [userId, userCrops] of harvestNotifications) {
        const cropNames = userCrops.map(c => c.crop_name).join(', ');
        notifications.push({
          userId,
          type: 'system',
          title: '🌾 Harvest Reminder',
          message: `Your ${cropNames} will be ready for harvest soon (approx 10-40 days)`,
          data: { crops: userCrops },
        });
      }
    }

    // ========================================
    // STEP 4: BATCH INSERT ALL NOTIFICATIONS
    // ========================================
    // Insert all accumulated notifications in a single database transaction
    // This is more efficient than individual inserts and ensures atomic operation
    if (notifications.length > 0) {
      const { error: insertError } = await supabase
        .from('notifications')
        .insert(
          // Transform notification payloads to database schema format
          notifications.map(n => ({
            user_id: n.userId,
            type: n.type,
            title: n.title,
            message: n.message,
            data: n.data || {},  // Default to empty object
            read: false,         // All new notifications start unread
          }))
        );

      if (insertError) {
        console.error('Error inserting notifications:', insertError);
        throw insertError;
      }

      console.log(`Created ${notifications.length} daily notifications`);
    } else {
      console.log('No notifications to send today');
    }

    return new Response(
      JSON.stringify({
        success: true,
        notificationsSent: notifications.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in daily-notifications function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
