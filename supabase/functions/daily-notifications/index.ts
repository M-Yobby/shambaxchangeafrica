import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationPayload {
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: any;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting daily notifications job...');

    // Get all users with their stats
    const { data: userStats, error: statsError } = await supabase
      .from('user_stats')
      .select('user_id, streak_days, last_login')
      .order('last_login', { ascending: true });

    if (statsError) {
      console.error('Error fetching user stats:', statsError);
      throw statsError;
    }

    const notifications: NotificationPayload[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check for streak reminders
    for (const stat of userStats || []) {
      const lastLogin = new Date(stat.last_login);
      lastLogin.setHours(0, 0, 0, 0);
      const daysSinceLogin = Math.floor((today.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));

      // Send reminder if user hasn't logged in today
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

    // Get users with crops near harvest
    const { data: crops, error: cropsError } = await supabase
      .from('crops')
      .select('user_id, crop_name, date_planted, expected_yield')
      .not('date_planted', 'is', null);

    if (!cropsError && crops) {
      const harvestNotifications = new Map<string, any[]>();

      for (const crop of crops) {
        const plantedDate = new Date(crop.date_planted);
        const daysGrowing = Math.floor((today.getTime() - plantedDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Assume average 90-120 day growing season, send notification at 80 days
        if (daysGrowing === 80) {
          if (!harvestNotifications.has(crop.user_id)) {
            harvestNotifications.set(crop.user_id, []);
          }
          harvestNotifications.get(crop.user_id)!.push(crop);
        }
      }

      // Create harvest reminder notifications
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

    // Insert all notifications
    if (notifications.length > 0) {
      const { error: insertError } = await supabase
        .from('notifications')
        .insert(
          notifications.map(n => ({
            user_id: n.userId,
            type: n.type,
            title: n.title,
            message: n.message,
            data: n.data || {},
            read: false,
          }))
        );

      if (insertError) {
        console.error('Error inserting notifications:', insertError);
        throw insertError;
      }

      console.log(`Created ${notifications.length} daily notifications`);
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
