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

    // Build context for AI
    const context = {
      location: profile?.location || 'Kenya',
      crops: crops?.map(c => ({
        name: c.crop_name,
        acreage: c.acreage,
        plantingDate: c.planting_date,
        expectedYield: c.expected_yield
      })) || [],
      recentTransactions: ledger || []
    };

    const systemPrompt = `You are an AI farming advisor for shambaXchange, an app for East African farmers. 
Generate 3 personalized, actionable insights based on the farmer's data.
Be specific, practical, and culturally relevant.

Farmer Profile:
- Location: ${context.location}
- Active Crops: ${context.crops.length ? context.crops.map(c => `${c.name} (${c.acreage} acres, planted ${c.plantingDate})`).join(', ') : 'None yet'}
- Recent Financial Activity: ${context.recentTransactions.length} transactions

Generate insights in the format:
1. [Title] - [2-3 sentence actionable advice]
2. [Title] - [2-3 sentence actionable advice]
3. [Title] - [2-3 sentence actionable advice]

Focus on: crop care timing, market opportunities, financial optimization, weather preparedness, yield improvement.`;

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