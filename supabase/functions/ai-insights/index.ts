import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';
import { checkRateLimit, getClientIdentifier, createRateLimitResponse, RATE_LIMITS } from "../_shared/rateLimiter.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Rate limiting check - use user ID for authenticated requests
    const identifier = getClientIdentifier(req, user.id);
    const rateLimit = checkRateLimit(identifier, RATE_LIMITS.AI);
    
    if (rateLimit.isLimited) {
      console.log(`AI insights rate limit exceeded for user ${user.id}`);
      return createRateLimitResponse(rateLimit.remaining, rateLimit.resetTime);
    }

    // Fetch user data
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    const { data: crops } = await supabase
      .from('crops')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active');

    const { data: ledger } = await supabase
      .from('ledger')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(10);

    // Fetch weather data for user's location
    const { data: weatherData, error: weatherError } = await supabase.functions.invoke('fetch-weather', {
      body: { location: profile?.location || 'Kenya' }
    });

    // Fetch market prices for user's crops
    const cropNames = crops?.map(c => c.crop_name) || [];
    const { data: marketPrices } = cropNames.length > 0 ? await supabase
      .from('market_prices')
      .select('*')
      .in('crop_name', cropNames)
      .eq('region', profile?.location || 'Kenya')
      .order('recorded_at', { ascending: false })
      .limit(10) : { data: [] };

    // Calculate financial summary from ledger
    const totalIncome = ledger?.filter(l => l.type === 'income')
      .reduce((sum, l) => sum + Number(l.amount), 0) || 0;
    const totalExpense = ledger?.filter(l => l.type === 'expense')
      .reduce((sum, l) => sum + Number(l.amount), 0) || 0;

    // Build context for AI
    const context = {
      location: profile?.location || 'Kenya',
      farmSize: profile?.farm_size || 0,
      weather: weatherError ? null : {
        temp: weatherData?.temp,
        humidity: weatherData?.humidity,
        condition: weatherData?.condition,
        description: weatherData?.description,
        windSpeed: weatherData?.windSpeed
      },
      crops: crops?.map(c => ({
        name: c.crop_name,
        acreage: c.acreage,
        plantingDate: c.planting_date,
        expectedYield: c.expected_yield,
        status: c.status
      })) || [],
      marketPrices: marketPrices?.map(mp => ({
        crop: mp.crop_name,
        pricePerKg: mp.price_per_kg,
        region: mp.region,
        recordedAt: mp.recorded_at
      })) || [],
      financialSummary: {
        totalIncome,
        totalExpense,
        netProfit: totalIncome - totalExpense,
        transactionCount: ledger?.length || 0
      },
      recentTransactions: ledger?.slice(0, 5) || []
    };

    const systemPrompt = `You are an AI farming advisor for shambaXchange, an app for East African farmers. 
Generate 3 personalized, actionable insights based on the farmer's comprehensive data.
Be specific, practical, and culturally relevant. Use actual market prices, financial data, and weather conditions in your recommendations.

Farmer Profile:
- Location: ${context.location}
- Farm Size: ${context.farmSize} acres
- Active Crops: ${context.crops.length ? context.crops.map(c => `${c.name} (${c.acreage} acres, planted ${c.plantingDate}, expected yield ${c.expectedYield || 'TBD'} kg)`).join(', ') : 'None yet'}

Current Weather in ${context.location}:
${context.weather ? `- Temperature: ${context.weather.temp}°C
- Humidity: ${context.weather.humidity}%
- Conditions: ${context.weather.description}
- Wind Speed: ${context.weather.windSpeed} m/s` : 'Weather data unavailable'}

Current Market Prices in ${context.location}:
${context.marketPrices.length > 0 ? context.marketPrices.map(mp => `- ${mp.crop}: KES ${mp.pricePerKg}/kg (as of ${new Date(mp.recordedAt).toLocaleDateString()})`).join('\n') : 'No market data available for current crops'}

Financial Summary:
- Total Income: KES ${context.financialSummary.totalIncome.toLocaleString()}
- Total Expenses: KES ${context.financialSummary.totalExpense.toLocaleString()}
- Net Profit: KES ${context.financialSummary.netProfit.toLocaleString()}
- Transaction Count: ${context.financialSummary.transactionCount}

Recent Transactions:
${context.recentTransactions.map(t => `- ${t.type === 'income' ? 'Revenue' : 'Expense'}: KES ${t.amount} for ${t.item} (${new Date(t.date).toLocaleDateString()})`).join('\n')}

Generate insights in the format:
1. [Title] - [2-3 sentence actionable advice with specific numbers when relevant]
2. [Title] - [2-3 sentence actionable advice with specific numbers when relevant]
3. [Title] - [2-3 sentence actionable advice with specific numbers when relevant]

Focus on: 
- Weather-based farming advice (planting, irrigation, pest prevention based on current conditions)
- Optimal selling times based on current market prices
- Harvest date predictions and preparation advice
- Financial optimization opportunities comparing income vs expenses
- Cost-saving recommendations based on spending patterns
- Yield improvement strategies specific to their crops, location, and weather
- Market opportunities (when to sell, when to wait for better prices)
- Climate risk warnings and protective measures needed now`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Generate personalized insights for this farmer.' }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const insights = data.choices[0].message.content;

    // Parse insights into array
    const insightsList = insights.split('\n')
      .filter((line: string) => line.match(/^\d+\./))
      .map((line: string) => line.replace(/^\d+\.\s*/, '').trim());

    return new Response(JSON.stringify({ insights: insightsList }), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
      },
    });
  } catch (error) {
    console.error('Error in ai-insights function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      insights: [
        'Welcome to shambaXchange! Start by adding your crops to get personalized insights.',
        'Check the weather forecast to plan your farming activities.',
        'Track your income and expenses to better understand your farm profitability.'
      ]
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});