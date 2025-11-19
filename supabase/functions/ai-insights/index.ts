/**
 * AI INSIGHTS EDGE FUNCTION
 * 
 * Generates personalized, actionable farming recommendations using AI.
 * The brain of shambaXchange - transforms raw data into intelligent guidance.
 * 
 * PURPOSE:
 * Creates daily AI-powered insights tailored to each farmer including:
 * - Harvest date predictions based on planting dates and crop cycles
 * - Yield estimates using acreage and expected yields
 * - Optimal selling times based on market price trends
 * - Weather-based action recommendations
 * - Financial advice comparing income vs expenses
 * - Risk alerts for weather threats
 * - Time-sensitive actions ("Plant now", "Harvest this week")
 * 
 * DATA SOURCES:
 * 1. User Profile (location, farm size)
 * 2. Crop Dashboard (plantings, acreage, dates)
 * 3. Financial Ledger (income, expenses, transactions)
 * 4. Weather API (current conditions, forecasts)
 * 5. Market Prices (current rates, trends)
 * 
 * AI INTEGRATION:
 * - Uses Lovable AI Gateway (Google Gemini 2.5 Flash)
 * - Model: google/gemini-2.5-flash (balanced speed/quality)
 * - Max tokens: 800 (comprehensive responses)
 * - Temperature: 0.7 (factual with some creativity)
 * 
 * PERSONALIZATION STRATEGY:
 * Insights are NOT generic templates. AI analyzes:
 * - Specific crops user is growing
 * - Current weather in user's location
 * - User's financial performance
 * - Market conditions for user's crops
 * - Time since planting (crop maturity)
 * 
 * INSIGHT CATEGORIES:
 * 1. Harvest Timing - When to harvest for best yield
 * 2. Market Opportunities - When prices favor selling
 * 3. Weather Actions - Urgent weather-based tasks
 * 4. Financial Optimization - Cost reduction opportunities
 * 5. Risk Warnings - Threats to crops or profits
 * 
 * RATE LIMITING:
 * - 20 requests per minute per user (RATE_LIMITS.AI)
 * - Prevents excessive AI API costs
 * - Balanced for daily insight checks
 * 
 * SECURITY:
 * - Authentication required (JWT token)
 * - User can only get insights for their own data
 * - Service role key for data fetching
 * - Rate limiting by authenticated user ID
 * 
 * ERROR HANDLING:
 * - Authentication validation
 * - API key verification
 * - Lovable AI error capture and logging
 * - Graceful fallbacks for missing data
 * 
 * CALLED BY:
 * - Dashboard component on mount
 * - User clicks refresh button
 * - Daily automated insight generation
 * 
 * REQUEST FORMAT:
 * POST /functions/v1/ai-insights
 * Headers: { Authorization: "Bearer <jwt_token>" }
 * (No body required - uses authenticated user's data)
 * 
 * RESPONSE FORMAT:
 * {
 *   insights: "Personalized AI-generated recommendations..."
 * }
 */

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';
import { checkRateLimit, getClientIdentifier, createRateLimitResponse, RATE_LIMITS } from "../_shared/rateLimiter.ts";

// CORS headers - allows web browser access to edge function
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * MAIN REQUEST HANDLER
 * Generates personalized AI insights by analyzing farmer's complete data profile
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
    // Ensure all required secrets are configured
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables');
    }

    // ========================================
    // STEP 2: INITIALIZE SUPABASE CLIENT
    // ========================================
    // Use service role key for admin access to fetch user data
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ========================================
    // STEP 3: AUTHENTICATE USER
    // ========================================
    // Extract JWT token from Authorization header
    // Validate token and get user information
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      // Invalid or expired token
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ========================================
    // STEP 4: RATE LIMITING
    // ========================================
    // Use authenticated user ID for accurate rate limiting
    // AI endpoints limited to 20 requests per minute per user
    const identifier = getClientIdentifier(req, user.id);
    const rateLimit = checkRateLimit(identifier, RATE_LIMITS.AI);
    
    if (rateLimit.isLimited) {
      console.log(`AI insights rate limit exceeded for user ${user.id}`);
      return createRateLimitResponse(rateLimit.remaining, rateLimit.resetTime);
    }

    // ========================================
    // STEP 5: FETCH USER PROFILE DATA
    // ========================================
    // Get farmer's location, farm size, and other profile details
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // ========================================
    // STEP 6: FETCH ACTIVE CROPS
    // ========================================
    // Get all crops currently being grown
    // Used for: harvest predictions, market matching, yield estimates
    const { data: crops } = await supabase
      .from('crops')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active'); // Only active crops matter for insights

    // ========================================
    // STEP 7: FETCH RECENT FINANCIAL TRANSACTIONS
    // ========================================
    // Get last 10 ledger entries for financial analysis
    // Used for: profit/loss analysis, spending patterns, ROI calculations
    const { data: ledger } = await supabase
      .from('ledger')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false }) // Most recent first
      .limit(10); // Only need recent history

    // ========================================
    // STEP 8: FETCH CURRENT WEATHER
    // ========================================
    // Call weather edge function for user's location
    // Used for: weather-based recommendations, risk alerts
    const { data: weatherData, error: weatherError } = await supabase.functions.invoke('fetch-weather', {
      body: { location: profile?.location || 'Kenya' }
    });

    // ========================================
    // STEP 9: FETCH MARKET PRICES FOR USER'S CROPS
    // ========================================
    // Get current market prices for crops user is growing
    // Used for: optimal selling time recommendations, profit projections
    const cropNames = crops?.map(c => c.crop_name) || [];
    const { data: marketPrices } = cropNames.length > 0 ? await supabase
      .from('market_prices')
      .select('*')
      .in('crop_name', cropNames) // Only prices for user's crops
      .eq('region', profile?.location || 'Kenya') // User's regional market
      .order('recorded_at', { ascending: false }) // Latest prices first
      .limit(10) : { data: [] };

    // ========================================
    // STEP 10: CALCULATE FINANCIAL SUMMARY
    // ========================================
    // Aggregate income and expenses for profit/loss analysis
    const totalIncome = ledger?.filter(l => l.type === 'income')
      .reduce((sum, l) => sum + Number(l.amount), 0) || 0;
    const totalExpense = ledger?.filter(l => l.type === 'expense')
      .reduce((sum, l) => sum + Number(l.amount), 0) || 0;

    // ========================================
    // STEP 11: BUILD AI CONTEXT OBJECT
    // ========================================
    // Aggregate all fetched data into structured context for AI
    // This complete profile enables truly personalized insights
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

    // ========================================
    // STEP 12: CONSTRUCT AI SYSTEM PROMPT
    // ========================================
    // Build comprehensive prompt with ALL context data
    // The prompt design is critical - it includes:
    // 1. Role definition (AI farming advisor for East African farmers)
    // 2. Complete farmer profile (location, farm size, crops with details)
    // 3. Real-time environmental data (current weather conditions)
    // 4. Market intelligence (current prices for their specific crops)
    // 5. Financial performance data (income, expenses, profit margins)
    // 6. Recent transaction history (spending patterns)
    // 7. Output format specification (3 numbered insights)
    // 8. Focus areas (8 specific recommendation types)
    //
    // This rich context enables the AI to generate truly personalized,
    // actionable insights rather than generic farming advice.
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

    // ========================================
    // STEP 13: CALL LOVABLE AI GATEWAY
    // ========================================
    // Lovable AI Gateway provides access to Google Gemini models
    // without requiring users to manage their own API keys.
    // 
    // Model Selection: google/gemini-2.5-flash
    // - Balanced speed and quality
    // - Good at multimodal + reasoning
    // - Cost-efficient for daily insight generation
    // 
    // Message Structure:
    // - System message: Contains complete context and instructions
    // - User message: Simple trigger to generate insights
    // 
    // The API is OpenAI-compatible, using the same format
    // as OpenAI's chat completions endpoint.
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`, // Auto-provisioned secret
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash', // Balanced performance model
        messages: [
          { role: 'system', content: systemPrompt }, // All context and instructions
          { role: 'user', content: 'Generate personalized insights for this farmer.' } // Simple trigger
        ],
        // Optional parameters (using defaults):
        // - temperature: 0.7 (balanced creativity)
        // - max_tokens: 800 (comprehensive responses)
      }),
    });

    // ========================================
    // STEP 14: HANDLE AI API RESPONSE
    // ========================================
    // Check for API errors (429 rate limit, 402 payment required, etc.)
    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    // Parse the JSON response from Lovable AI Gateway
    // Response structure matches OpenAI format:
    // {
    //   choices: [
    //     {
    //       message: {
    //         role: 'assistant',
    //         content: '1. Insight one...\n2. Insight two...\n3. Insight three...'
    //       }
    //     }
    //   ]
    // }
    const data = await response.json();
    const insights = data.choices[0].message.content;

    // ========================================
    // STEP 15: PARSE AI RESPONSE INTO ARRAY
    // ========================================
    // Convert AI's numbered text format into array of strings
    // Input: "1. Harvest Timing - Your maize...\n2. Market Opportunity - Current prices...\n3. Weather Action - Heavy rain..."
    // Output: ["Harvest Timing - Your maize...", "Market Opportunity - Current prices...", "Weather Action - Heavy rain..."]
    //
    // Process:
    // 1. Split response by newlines
    // 2. Filter to only lines starting with "1.", "2.", "3." etc
    // 3. Remove the number prefix and trim whitespace
    const insightsList = insights.split('\n')
      .filter((line: string) => line.match(/^\d+\./)) // Only numbered lines
      .map((line: string) => line.replace(/^\d+\.\s*/, '').trim()); // Remove "1. " prefix

    // ========================================
    // STEP 16: RETURN SUCCESSFUL RESPONSE
    // ========================================
    // Return parsed insights array to client
    // Include rate limit information in headers for transparency
    return new Response(JSON.stringify({ insights: insightsList }), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'X-RateLimit-Remaining': rateLimit.remaining.toString(), // Show remaining requests
      },
    });
  } catch (error) {
    // ========================================
    // STEP 17: GLOBAL ERROR HANDLER
    // ========================================
    // Catch any errors (network failures, API errors, data issues)
    // Log the error for debugging
    console.error('Error in ai-insights function:', error);
    
    // Return graceful fallback response with generic insights
    // This ensures users always get something useful even if AI fails
    // Status 500 indicates server error, but we still provide content
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      insights: [
        // Fallback insights that guide users to build their profile
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