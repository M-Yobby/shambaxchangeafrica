/**
 * FETCH WEATHER EDGE FUNCTION
 * 
 * Retrieves real-time weather data from OpenWeatherMap API based on user location.
 * Powers the weather display in Dashboard and provides data for AI insights.
 * 
 * PURPOSE:
 * - Fetches current weather conditions for farmer's location
 * - Provides temperature, humidity, wind, and conditions
 * - Enables weather-aware farming recommendations
 * - Powers AI insights for crop management
 * 
 * WEATHER DATA INCLUDED:
 * - Temperature (°C)
 * - Humidity (%)
 * - Weather condition (Clear, Clouds, Rain, etc.)
 * - Description (detailed condition text)
 * - Wind speed (m/s)
 * 
 * API INTEGRATION:
 * - Provider: OpenWeatherMap API
 * - Endpoint: /data/2.5/weather
 * - Units: Metric (Celsius, m/s)
 * - Authentication: API key via OPENWEATHER_API_KEY secret
 * 
 * RATE LIMITING:
 * - 60 requests per minute per client (RATE_LIMITS.API)
 * - Prevents API quota exhaustion
 * - Returns 429 status when exceeded
 * 
 * SECURITY:
 * - API key stored as Supabase secret
 * - CORS enabled for web access
 * - Rate limiting by client identifier
 * - API key redacted from logs
 * 
 * ERROR HANDLING:
 * - API key validation
 * - OpenWeatherMap API error logging
 * - Invalid location handling
 * - Network error recovery
 * 
 * CALLED BY:
 * - Dashboard component on mount
 * - ai-insights function for personalized recommendations
 * - Any component needing weather data
 * 
 * REQUEST FORMAT:
 * POST /functions/v1/fetch-weather
 * Body: { location: "Nairobi" }
 * 
 * RESPONSE FORMAT:
 * {
 *   temp: 24,              // Temperature in Celsius
 *   humidity: 65,          // Humidity percentage
 *   condition: "Clouds",   // Main weather condition
 *   description: "scattered clouds", // Detailed description
 *   windSpeed: 3.5         // Wind speed in m/s
 * }
 */

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { checkRateLimit, getClientIdentifier, createRateLimitResponse, RATE_LIMITS } from "../_shared/rateLimiter.ts";

// CORS headers - allows web browser access to edge function
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * MAIN REQUEST HANDLER
 * Fetches weather data with rate limiting and error handling
 */
serve(async (req) => {
  // Handle CORS preflight requests (browser pre-check before actual request)
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ========================================
    // STEP 1: RATE LIMITING
    // ========================================
    // Protect against abuse and manage OpenWeatherMap API quota
    // General API limit: 60 requests per minute
    const identifier = getClientIdentifier(req);
    const rateLimit = checkRateLimit(identifier, RATE_LIMITS.API);
    
    if (rateLimit.isLimited) {
      console.log(`Rate limit exceeded for ${identifier}`);
      return createRateLimitResponse(rateLimit.remaining, rateLimit.resetTime);
    }

    // ========================================
    // STEP 2: EXTRACT REQUEST DATA
    // ========================================
    const { location } = await req.json();
    
    // Get OpenWeatherMap API key from secrets
    const OPENWEATHER_API_KEY = Deno.env.get('OPENWEATHER_API_KEY');

    if (!OPENWEATHER_API_KEY) {
      throw new Error('OPENWEATHER_API_KEY not configured');
    }

    // ========================================
    // STEP 3: BUILD OPENWEATHERMAP API URL
    // ========================================
    // Parameters:
    // - q: Location query (city name)
    // - units: metric (Celsius instead of Fahrenheit)
    // - appid: API key for authentication
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&units=metric&appid=${OPENWEATHER_API_KEY}`;
    
    // Log request with redacted API key for security
    console.log('Fetching weather from:', url.replace(OPENWEATHER_API_KEY, '[API_KEY]'));
    
    // ========================================
    // STEP 4: CALL OPENWEATHERMAP API
    // ========================================
    const response = await fetch(url);

    console.log('Weather API response status:', response.status);
    
    // ========================================
    // STEP 5: HANDLE API ERRORS
    // ========================================
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Weather API error:', errorText);
      
      // Common errors:
      // - 404: City not found (invalid location)
      // - 401: Invalid API key
      // - 429: Rate limit exceeded on OpenWeatherMap side
      throw new Error(`Failed to fetch weather data: ${response.status} - ${errorText}`);
    }

    // ========================================
    // STEP 6: PARSE AND TRANSFORM RESPONSE
    // ========================================
    const data = await response.json();

    // Extract relevant weather data from API response
    // OpenWeatherMap returns extensive data, we only need key metrics
    const weatherData = {
      temp: Math.round(data.main.temp),           // Round for display (24.7 → 25)
      humidity: data.main.humidity,               // Percentage
      condition: data.weather[0].main,            // "Clear", "Clouds", "Rain"
      description: data.weather[0].description,    // "scattered clouds", "light rain"
      windSpeed: data.wind.speed,                 // Meters per second
    };

    // ========================================
    // STEP 7: RETURN WEATHER DATA
    // ========================================
    // Include rate limit info in headers for client tracking
    return new Response(
      JSON.stringify(weatherData),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': rateLimit.remaining.toString(), // Remaining requests
        } 
      }
    );
  } catch (error) {
    // ========================================
    // ERROR HANDLING
    // ========================================
    // Log full error for debugging
    console.error('Weather fetch error:', error);
    
    // Return user-friendly error message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
