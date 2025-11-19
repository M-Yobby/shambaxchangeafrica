/**
 * AI CHAT EDGE FUNCTION
 * 
 * Real-time AI farming assistant that answers agricultural and agribusiness questions.
 * Accessible via the "Ask Shamba" chatbot in the Dashboard.
 * 
 * PURPOSE:
 * Provides expert-level farming advice and guidance to farmers including:
 * - Crop management and planting schedules
 * - Weather-appropriate farming practices  
 * - Market timing and pricing strategies
 * - Sustainable and climate-smart farming
 * - Pest and disease management
 * - Financial planning for farms
 * 
 * AI INTEGRATION:
 * - Uses Hugging Face Inference API
 * - Model: Mistral-7B-Instruct-v0.2 (fast, accurate, multilingual)
 * - Max tokens: 300 (concise responses)
 * - Temperature: 0.7 (balanced creativity/accuracy)
 * 
 * RATE LIMITING:
 * - 20 requests per minute per user (RATE_LIMITS.AI)
 * - Prevents abuse and manages API costs
 * - Returns 429 status when exceeded
 * 
 * SECURITY:
 * - HUGGING_FACE_ACCESS_TOKEN stored as Supabase secret
 * - CORS enabled for web access
 * - Rate limiting by client identifier
 * 
 * ERROR HANDLING:
 * - API key validation
 * - Hugging Face API error logging
 * - Graceful fallback responses
 * - Rate limit headers in response
 * 
 * CALLED BY:
 * - AIChatbot component in Dashboard
 * - User clicks "Ask Shamba" and sends questions
 * 
 * REQUEST FORMAT:
 * POST /functions/v1/ai-chat
 * Body: { message: "How do I plant maize?" }
 * 
 * RESPONSE FORMAT:
 * { response: "AI-generated farming advice..." }
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
 * Processes chat requests with rate limiting and AI generation
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
    // Prevent abuse and manage API costs
    // AI endpoints have stricter limits (20 req/min) due to processing cost
    const identifier = getClientIdentifier(req);
    const rateLimit = checkRateLimit(identifier, RATE_LIMITS.AI);
    
    if (rateLimit.isLimited) {
      // Log rate limit hit for monitoring
      console.log(`AI chat rate limit exceeded for ${identifier}`);
      // Return 429 Too Many Requests with retry information
      return createRateLimitResponse(rateLimit.remaining, rateLimit.resetTime);
    }

    // ========================================
    // STEP 2: EXTRACT REQUEST DATA
    // ========================================
    const { message } = await req.json();
    
    // Get Hugging Face API token from secrets
    const HUGGING_FACE_ACCESS_TOKEN = Deno.env.get('HUGGING_FACE_ACCESS_TOKEN');

    if (!HUGGING_FACE_ACCESS_TOKEN) {
      throw new Error('HUGGING_FACE_ACCESS_TOKEN not configured');
    }

    // ========================================
    // STEP 3: CONFIGURE AI SYSTEM PROMPT
    // ========================================
    // Defines AI personality, expertise, and response style
    // Tailored for East African farming context
    const systemPrompt = `You are shambaXchange AI, a helpful farming assistant for African farmers. 
    You provide advice on:
    - Crop management and planting schedules
    - Weather-appropriate farming practices
    - Market timing and pricing strategies
    - Sustainable and climate-smart farming
    - Pest and disease management
    - Financial planning for farms
    
    Keep responses practical, concise, and relevant to small to medium-scale farmers in East Africa, particularly Kenya.`;

    // ========================================
    // STEP 4: CALL HUGGING FACE API
    // ========================================
    // Send request to Mistral-7B-Instruct model for response generation
    const response = await fetch(
      "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${HUGGING_FACE_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // Combine system prompt with user message
          inputs: `${systemPrompt}\n\nUser: ${message}\n\nAssistant:`,
          parameters: {
            max_new_tokens: 300,    // Limit response length for conciseness
            temperature: 0.7,        // Balance between creativity and accuracy
            top_p: 0.9,             // Nucleus sampling for quality
            return_full_text: false, // Only return generated text, not full input
          },
        }),
      }
    );

    // ========================================
    // STEP 5: HANDLE API ERRORS
    // ========================================
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Hugging Face API error:', errorText);
      throw new Error('Failed to get AI response');
    }

    // ========================================
    // STEP 6: EXTRACT AND RETURN AI RESPONSE
    // ========================================
    const data = await response.json();
    // Hugging Face returns array of results, extract generated text
    const aiResponse = data[0]?.generated_text || "I apologize, I couldn't generate a response.";

    // Return AI response with rate limit info in headers
    return new Response(
      JSON.stringify({ response: aiResponse }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': rateLimit.remaining.toString(), // Client can track usage
        } 
      }
    );
  } catch (error) {
    // ========================================
    // ERROR HANDLING
    // ========================================
    // Log error for debugging and return user-friendly message
    console.error('AI chat error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
