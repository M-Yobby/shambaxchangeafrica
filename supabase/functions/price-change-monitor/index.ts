import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting price change monitoring...');

    // Get all unique crop/region combinations from market_prices
    const { data: latestPrices, error: pricesError } = await supabase
      .from('market_prices')
      .select('crop_name, region, price_per_kg, recorded_at')
      .order('recorded_at', { ascending: false });

    if (pricesError) {
      console.error('Error fetching prices:', pricesError);
      throw pricesError;
    }

    // Group by crop_name and region to get latest and previous prices
    const priceMap = new Map<string, { latest: any; previous: any }>();

    for (const price of latestPrices || []) {
      const key = `${price.crop_name}-${price.region}`;
      const existing = priceMap.get(key);

      if (!existing) {
        priceMap.set(key, { latest: price, previous: null });
      } else if (!existing.previous) {
        existing.previous = price;
      }
    }

    const notifications: any[] = [];
    const significantChanges: any[] = [];

    // Check for significant price changes (>10%)
    for (const [key, prices] of priceMap) {
      if (!prices.previous) continue;

      const latestPrice = parseFloat(prices.latest.price_per_kg);
      const previousPrice = parseFloat(prices.previous.price_per_kg);
      const percentChange = ((latestPrice - previousPrice) / previousPrice) * 100;

      if (Math.abs(percentChange) > 10) {
        console.log(`Significant price change detected for ${prices.latest.crop_name}: ${percentChange.toFixed(2)}%`);
        
        significantChanges.push({
          crop_name: prices.latest.crop_name,
          region: prices.latest.region,
          change: percentChange,
        });

        // Find all farmers who grow this crop
        const { data: farmers, error: farmersError } = await supabase
          .from('crops')
          .select('user_id')
          .eq('crop_name', prices.latest.crop_name)
          .eq('status', 'active');

        if (farmersError) {
          console.error('Error fetching farmers:', farmersError);
          continue;
        }

        // Create unique user set
        const uniqueFarmers = [...new Set(farmers?.map(f => f.user_id) || [])];

        // Create notifications for each farmer
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
