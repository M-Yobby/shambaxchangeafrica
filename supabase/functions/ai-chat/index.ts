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
    // Rate limiting check - stricter for AI endpoints
    const identifier = getClientIdentifier(req);
    const rateLimit = checkRateLimit(identifier, RATE_LIMITS.AI);
    
    if (rateLimit.isLimited) {
      console.log(`AI chat rate limit exceeded for ${identifier}`);
      return createRateLimitResponse(rateLimit.remaining, rateLimit.resetTime);
    }

    const { message } = await req.json();
    const HUGGING_FACE_ACCESS_TOKEN = Deno.env.get('HUGGING_FACE_ACCESS_TOKEN');

    if (!HUGGING_FACE_ACCESS_TOKEN) {
      throw new Error('HUGGING_FACE_ACCESS_TOKEN not configured');
    }

    const systemPrompt = `You are shambaXchange AI, a helpful farming assistant for African farmers. 
    You provide advice on:
    - Crop management and planting schedules
    - Weather-appropriate farming practices
    - Market timing and pricing strategies
    - Sustainable and climate-smart farming
    - Pest and disease management
    - Financial planning for farms
    
    Keep responses practical, concise, and relevant to small to medium-scale farmers in East Africa, particularly Kenya.`;

    const response = await fetch(
      "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${HUGGING_FACE_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: `${systemPrompt}\n\nUser: ${message}\n\nAssistant:`,
          parameters: {
            max_new_tokens: 300,
            temperature: 0.7,
            top_p: 0.9,
            return_full_text: false,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Hugging Face API error:', errorText);
      throw new Error('Failed to get AI response');
    }

    const data = await response.json();
    const aiResponse = data[0]?.generated_text || "I apologize, I couldn't generate a response.";

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        } 
      }
    );
  } catch (error) {
    console.error('AI chat error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
