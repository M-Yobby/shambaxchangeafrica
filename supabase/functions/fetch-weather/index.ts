import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    // Rate limiting check
    const identifier = getClientIdentifier(req);
    const rateLimit = checkRateLimit(identifier, RATE_LIMITS.API);
    
    if (rateLimit.isLimited) {
      console.log(`Rate limit exceeded for ${identifier}`);
      return createRateLimitResponse(rateLimit.remaining, rateLimit.resetTime);
    }

    const { location } = await req.json();
    const OPENWEATHER_API_KEY = Deno.env.get('OPENWEATHER_API_KEY');

    if (!OPENWEATHER_API_KEY) {
      throw new Error('OPENWEATHER_API_KEY not configured');
    }

    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&units=metric&appid=${OPENWEATHER_API_KEY}`;
    console.log('Fetching weather from:', url.replace(OPENWEATHER_API_KEY, '[API_KEY]'));
    
    const response = await fetch(url);

    console.log('Weather API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Weather API error:', errorText);
      throw new Error(`Failed to fetch weather data: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    return new Response(
      JSON.stringify({
        temp: Math.round(data.main.temp),
        humidity: data.main.humidity,
        condition: data.weather[0].main,
        description: data.weather[0].description,
        windSpeed: data.wind.speed,
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        } 
      }
    );
  } catch (error) {
    console.error('Weather fetch error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
