# Edge Functions Documentation

Comprehensive documentation for all shambaXchange backend serverless functions.

---

## Overview

Edge Functions are serverless TypeScript/JavaScript functions that run on Deno runtime. They handle:
- AI integrations (chat, personalized insights)
- External API calls (weather, market data)
- Scheduled jobs (notifications, leaderboard refresh, price monitoring)
- Backend business logic

All functions automatically deploy when code changes are pushed.

---

## Function Inventory

| Function | Trigger | Purpose | Rate Limit |
|----------|---------|---------|------------|
| ai-chat | On-demand (user request) | Real-time farming Q&A chatbot | 20 req/min |
| ai-insights | On-demand (user request) | Personalized farm recommendations | 20 req/min |
| fetch-weather | On-demand (user request) | Real-time weather data | 60 req/min |
| daily-notifications | Cron (daily 6am) | Streak & harvest reminders | N/A |
| price-change-monitor | Cron (every 6hrs) | Market price alerts | N/A |
| refresh-leaderboard | Cron (hourly/daily) | Update rankings | N/A |

---

## ai-insights

**Purpose:** Generates personalized farming recommendations using AI analysis of user's complete data profile.

**AI Context Built From:**
1. Profile (location, farm size)
2. Active crops (planting dates, acreage, yields)
3. Financial ledger (income, expenses, recent transactions)
4. Current weather (temperature, conditions, forecast)
5. Market prices (current rates for user's crops)

**System Prompt Strategy:**
Instructs AI to provide 3 specific insights:
1. Time-sensitive action (harvest, plant, sell NOW)
2. Market opportunity (price trends, selling recommendations)
3. Risk warning OR financial optimization

**Example Output:**
```
🌾 HARVEST ALERT: Your maize planted 90 days ago is ready for harvest. Current market price is KES 45/kg (up 15% this week) - excellent timing!

💰 SELL NOW: Tomato prices in Nairobi jumped to KES 80/kg. List your harvest on the marketplace before prices drop.

⚠️ WEATHER RISK: Heavy rain forecast next 3 days. Protect young seedlings and ensure drainage.
```

**Implementation Notes:**
- Uses Lovable AI Gateway (google/gemini-2.5-flash)
- Requires authentication (JWT token)
- Rate limited per user (20 req/min)
- Handles missing data gracefully (fallback to generic advice)

---

## ai-chat

**Purpose:** Real-time Q&A chatbot for farming questions accessible via "Ask Shamba" button.

**Expertise Areas:**
- Crop management and planting schedules
- Weather-appropriate farming practices
- Market timing and pricing strategies
- Sustainable and climate-smart farming
- Pest and disease management
- Financial planning for farms

**AI Configuration:**
- Model: Mistral-7B-Instruct-v0.2 (Hugging Face)
- Max tokens: 300 (concise responses)
- Temperature: 0.7 (balanced)
- Context: East Africa, small-medium farms

**Example Interactions:**
```
User: "When should I plant beans?"
AI: "In Kenya, plant beans at the start of rainy seasons (March-May or October-November). Ensure soil temp is above 15°C. Choose drought-resistant varieties like Mwitemania for better yields."

User: "How do I manage aphids on my cabbage?"
AI: "Mix neem oil (2 tbsp per liter of water) and spray early morning. Remove heavily infested leaves. Plant marigolds nearby as natural repellent. Check plants daily during outbreak."
```

---

## fetch-weather

**Purpose:** Retrieves real-time weather from OpenWeatherMap API for user's location.

**Data Returned:**
- Temperature (°C)
- Humidity (%)
- Weather condition (Clear, Clouds, Rain, etc.)
- Detailed description
- Wind speed (m/s)

**API Integration:**
- Provider: OpenWeatherMap
- Endpoint: /data/2.5/weather
- Authentication: OPENWEATHER_API_KEY secret

**Usage:**
```typescript
const { data, error } = await supabase.functions.invoke('fetch-weather', {
  body: { location: 'Nairobi' }
});
// Returns: { temp: 24, humidity: 65, condition: "Clouds", ... }
```

---

## daily-notifications

**Purpose:** Sends automated daily notifications for engagement and retention.

**Notification Types:**

1. **Streak Reminders**
   - Sent to users who haven't logged in today
   - Prevents streak loss
   - Shows days remaining until next milestone
   - Example: "🔥 Don't lose your 15-day streak! Log in today to keep it going. 15 more days until Month Master badge!"

2. **Harvest Reminders**
   - Sent when crops approach harvest date
   - Based on typical growing seasons
   - Includes days until expected harvest
   - Example: "🌾 Your maize planted 85 days ago should be ready in ~5 days. Check for maturity signs!"

**Scheduling:**
- Runs daily at 6 AM via cron job
- Secured with webhook signature validation
- Processes all users in single batch

**Growing Season Estimates:**
- Maize: 90-120 days
- Tomatoes: 70-90 days
- Potatoes: 90-120 days
- Beans: 60-90 days
- Default: 90 days

---

## price-change-monitor

**Purpose:** Monitors market prices and alerts farmers of significant changes (>10%).

**Detection Logic:**
1. Fetch all market prices ordered by date
2. Group by crop/region pairs
3. Compare latest vs previous price
4. Calculate percentage change
5. If >10% change, alert affected farmers

**Alert Criteria:**
- Price increase >10%: "📈 Price surge! Tomatoes up 15% to KES 80/kg"
- Price decrease >10%: "📉 Price drop! Maize down 12% to KES 40/kg"

**Targeting:**
Only notifies farmers who:
- Are actively growing the affected crop
- Are in the affected region
- Haven't been notified about this price change yet

**Scheduling:**
- Runs every 6 hours via cron
- After market price data updates

---

## refresh-leaderboard

**Purpose:** Updates materialized view containing pre-computed leaderboard rankings.

**Why Materialized View:**
Leaderboard query is expensive:
- Joins 4+ tables (profiles, user_stats, orders, reviews)
- Aggregates (SUM, AVG, COUNT)
- Ranking calculations
- Real-time query: 2-5 seconds
- Materialized: <100ms

**Refresh Process:**
1. Call `refresh_leaderboards()` database function
2. Executes: `REFRESH MATERIALIZED VIEW public.leaderboards`
3. Recalculates all rankings
4. Log refresh timestamp

**Scheduling:**
- Hourly or daily via cron
- Manual trigger for immediate updates
- Blocks reads during refresh (1-5 seconds)

---

## Rate Limiting System

### Implementation
Located in `supabase/functions/_shared/rateLimiter.ts`

### Algorithm: Sliding Window
1. Track requests per client identifier
2. Reset counter after window expires
3. Reject requests exceeding limit

### Limit Tiers

**AUTH (5 req/15min)**
- Protects: Login, signup, password reset
- Purpose: Brute force prevention
- Strictest tier

**AI (20 req/min)**
- Protects: ai-chat, ai-insights
- Purpose: Cost management
- Moderate tier

**API (60 req/min)**
- Protects: fetch-weather, general endpoints
- Purpose: Normal usage
- Generous tier

**EXPENSIVE (10 req/min)**
- Protects: Resource-intensive operations
- Purpose: Server protection
- Strict tier

### Client Identification
- **Authenticated:** `user:abc123` (preferred)
- **Unauthenticated:** `ip:192.168.1.1` (fallback)

### HTTP 429 Response
```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Please try again later.",
  "retryAfter": 45
}
```

Headers:
- `X-RateLimit-Remaining`: Requests left
- `X-RateLimit-Reset`: When limit resets
- `Retry-After`: Seconds to wait

---

## Security Best Practices

### API Key Management
- All keys stored as Supabase secrets
- Never hardcode in source code
- Redacted from logs
- Accessed via `Deno.env.get()`

### Authentication
- JWT tokens for user-specific functions
- Service role key for system functions
- Token validation on every request
- 401 responses for invalid auth

### CORS Configuration
All functions include CORS headers:
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

### Webhook Security
Cron-triggered functions use signature validation to prevent unauthorized execution.

---

## Error Handling Patterns

### Standard Pattern
```typescript
try {
  // Function logic
} catch (error) {
  console.error('Function error:', error);
  return new Response(
    JSON.stringify({ error: error.message }),
    { status: 500, headers: corsHeaders }
  );
}
```

### Lovable AI Errors
```typescript
if (!response.ok) {
  if (response.status === 429) {
    // Rate limit on AI gateway
    return new Response(JSON.stringify({ 
      error: "Rate limits exceeded, please try again later." 
    }), { status: 429, headers: corsHeaders });
  }
  if (response.status === 402) {
    // Payment required
    return new Response(JSON.stringify({ 
      error: "Payment required, please add funds to your Lovable AI workspace." 
    }), { status: 402, headers: corsHeaders });
  }
}
```

---

## Monitoring & Debugging

### Logging Best Practices
- Log function start: `console.log('Starting X...')`
- Log key operations: `console.log('Fetched Y records')`
- Log errors: `console.error('Error:', error)`
- Redact sensitive data: `url.replace(API_KEY, '[KEY]')`

### Common Issues

**Function timeouts:**
- Edge functions timeout after 150 seconds
- Optimize long-running operations
- Use background tasks for async work

**Missing environment variables:**
- Check secrets configuration
- Verify variable names match code
- Redeploy after adding secrets

**Rate limit exceeded:**
- Check RATE_LIMITS configuration
- Adjust limits for usage patterns
- Consider Redis for distributed limiting

---

## Deployment

**Automatic Deployment:**
- Functions auto-deploy on code push
- No manual deployment needed
- Deployment takes ~30 seconds

**Configuration:**
- `supabase/config.toml` controls function settings
- `verify_jwt` setting controls auth requirement

**Testing:**
Use Supabase client:
```typescript
const { data, error } = await supabase.functions.invoke('function-name', {
  body: { key: 'value' }
});
```

---

This documentation should be updated whenever edge function logic changes.
