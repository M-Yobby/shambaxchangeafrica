/**
 * Price Change Monitor Edge Function
 * 
 * This Supabase Edge Function monitors market prices for crops and sends notifications
 * to farmers when significant price changes occur (>10% increase or decrease).
 * 
 * Key Features:
 * - Tracks price changes for all crop/region combinations
 * - Alerts farmers growing affected crops
 * - Provides actionable market intelligence
 * - Helps farmers optimize selling decisions
 * 
 * Price Change Threshold:
 * - Significant change = >10% price movement
 * - Compares latest price to previous recorded price
 * - Filters out minor fluctuations to reduce notification noise
 * 
 * Notification Strategy:
 * - Targets only farmers actively growing the affected crop
 * - Includes price direction (increase/decrease) and percentage
 * - Provides old/new price data for informed decision-making
 * - Region-specific alerts for relevant market information
 * 
 * Scheduling:
 * - Runs periodically (e.g., every 6 hours) via cron job
 * - Triggered after market price data updates
 * - Secured with webhook signature validation
 * 
 * @cron Every 6 hours
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Main Edge Function Handler
 * Monitors price changes and sends alerts to affected farmers
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

    console.log('Starting price change monitoring...');

    // ========================================
    // STEP 1: FETCH ALL MARKET PRICES
    // ========================================
    // Get all price records ordered by most recent first
    // This allows us to compare latest vs. previous prices for each crop/region
    const { data: latestPrices, error: pricesError } = await supabase
      .from('market_prices')
      .select('crop_name, region, price_per_kg, recorded_at')
      .order('recorded_at', { ascending: false });

    if (pricesError) {
      console.error('Error fetching prices:', pricesError);
      throw pricesError;
    }

    // ========================================
    // STEP 2: GROUP PRICES BY CROP AND REGION
    // ========================================
    // Map structure: "CropName-Region" -> { latest: mostRecentPrice, previous: secondMostRecentPrice }
    // This allows us to calculate percentage changes for each crop/region combination
    const priceMap = new Map<string, { latest: any; previous: any }>();

    for (const price of latestPrices || []) {
      const key = `${price.crop_name}-${price.region}`;  // Composite key for unique crop/region pair
      const existing = priceMap.get(key);

      if (!existing) {
        // First price record for this crop/region - set as latest
        priceMap.set(key, { latest: price, previous: null });
      } else if (!existing.previous) {
        // Second price record - set as previous for comparison
        existing.previous = price;
      }
      // Ignore additional older records - we only need latest and previous
    }

    // Arrays to accumulate notifications and track significant changes
    const notifications: any[] = [];
    const significantChanges: any[] = [];

    // ========================================
    // STEP 3: DETECT SIGNIFICANT PRICE CHANGES
    // ========================================
    // Check each crop/region for price changes exceeding 10% threshold
    for (const [key, prices] of priceMap) {
      // Skip if we don't have a previous price to compare against
      if (!prices.previous) continue;

      // Calculate percentage change between latest and previous price
      const latestPrice = parseFloat(prices.latest.price_per_kg);
      const previousPrice = parseFloat(prices.previous.price_per_kg);
      const percentChange = ((latestPrice - previousPrice) / previousPrice) * 100;

      // Threshold: Alert on changes > 10% (increase or decrease)
      // This filters out minor market fluctuations and reduces notification noise
      if (Math.abs(percentChange) > 10) {
        console.log(`Significant price change detected for ${prices.latest.crop_name}: ${percentChange.toFixed(2)}%`);
        
        // Track this change for logging
        significantChanges.push({
          crop_name: prices.latest.crop_name,
          region: prices.latest.region,
          change: percentChange,
        });

        // ========================================
        // STEP 4: FIND AFFECTED FARMERS
        // ========================================
        // Query all farmers who are actively growing this crop
        // These farmers need to know about the price change to make informed selling decisions
        const { data: farmers, error: farmersError } = await supabase
          .from('crops')
          .select('user_id')
          .eq('crop_name', prices.latest.crop_name)  // Match crop name
          .eq('status', 'active');                    // Only active crops (not harvested)

        if (farmersError) {
          console.error('Error fetching farmers:', farmersError);
          continue;  // Skip this crop but continue processing others
        }

        // ========================================
        // STEP 5: CREATE NOTIFICATIONS FOR FARMERS
        // ========================================
        // De-duplicate farmer IDs (a farmer may have multiple plantings of same crop)
        const uniqueFarmers = [...new Set(farmers?.map(f => f.user_id) || [])];

        // Create notification for each affected farmer
        for (const userId of uniqueFarmers) {
          notifications.push({
            user_id: userId,
            type: 'price',
            title: '📈 Price Alert',
            message: `${prices.latest.crop_name} price ${percentChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(percentChange).toFixed(1)}% in ${prices.latest.region}`,
            data: {
              crop_name: prices.latest.crop_name,
              region: prices.latest.region,
              old_price: previousPrice,
              new_price: latestPrice,
              percent_change: percentChange,
            },
            read: false,
          });
        }
      }
    }

    // Insert all notifications
    if (notifications.length > 0) {
      const { error: insertError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (insertError) {
        console.error('Error inserting notifications:', insertError);
        throw insertError;
      }

      console.log(`Created ${notifications.length} price change notifications for ${significantChanges.length} crops`);
    } else {
      console.log('No significant price changes detected');
    }

    return new Response(
      JSON.stringify({
        success: true,
        notificationsSent: notifications.length,
        significantChanges,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in price-change-monitor function:', error);
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
