# Rate Limiting Implementation

## Overview

shambaXchange implements rate limiting on all edge functions to prevent abuse, brute force attacks, and ensure fair resource usage across all users. Rate limiting is enforced using a sliding window algorithm with in-memory storage.

## Rate Limit Tiers

Different endpoints have different rate limits based on their resource intensity:

### 1. **AUTH** - Authentication Endpoints
- **Limit**: 5 requests per 15 minutes
- **Use Case**: Login attempts, password resets
- **Purpose**: Prevent brute force attacks on authentication

### 2. **AI** - AI-Powered Endpoints
- **Limit**: 20 requests per minute
- **Endpoints**: `ai-chat`, `ai-insights`
- **Purpose**: Prevent abuse of expensive AI API calls

### 3. **API** - General API Endpoints
- **Limit**: 60 requests per minute
- **Endpoints**: `fetch-weather`, general data operations
- **Purpose**: Fair usage for standard operations

### 4. **EXPENSIVE** - Resource-Intensive Operations
- **Limit**: 10 requests per minute
- **Use Case**: Large data exports, batch operations
- **Purpose**: Prevent system overload

## Implementation Details

### Rate Limiting Strategy

The rate limiter uses a **sliding window** approach:

1. **Identifier**: Requests are tracked by IP address for anonymous users or User ID for authenticated users
2. **Window**: Each window tracks requests for a specific time period (e.g., 1 minute, 15 minutes)
3. **Reset**: Counters reset automatically after the window expires
4. **Cleanup**: Old entries are cleaned up every 5 minutes to prevent memory leaks

### Response Headers

When a request is processed, the following headers are included:

- `X-RateLimit-Remaining`: Number of requests remaining in current window
- `X-RateLimit-Reset`: ISO timestamp when the rate limit resets
- `Retry-After`: Seconds until the client can retry (only when rate limited)

### Rate Limit Exceeded Response

When rate limit is exceeded, the API returns:

**Status Code**: `429 Too Many Requests`

**Response Body**:
```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Please try again later.",
  "retryAfter": 45
}
```

## Protected Endpoints

### AI Endpoints (20 req/min)
- `/functions/v1/ai-chat` - AI chatbot conversations
- `/functions/v1/ai-insights` - Personalized farming insights

### API Endpoints (60 req/min)
- `/functions/v1/fetch-weather` - Weather data retrieval

### Cron Endpoints
Cron-triggered functions (`price-change-monitor`, `refresh-leaderboard`, `daily-notifications`) use webhook signature validation instead of rate limiting.

## Client-Side Handling

### Recommended Client Implementation

```typescript
async function callAPI(endpoint: string, data: any) {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    // Check rate limit headers
    const remaining = response.headers.get('X-RateLimit-Remaining');
    const resetTime = response.headers.get('X-RateLimit-Reset');

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      console.warn(`Rate limited. Retry after ${retryAfter} seconds`);
      
      // Implement exponential backoff or show user message
      throw new Error(`Rate limit exceeded. Please wait ${retryAfter} seconds.`);
    }

    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}
```

### Best Practices for Clients

1. **Monitor Headers**: Track remaining requests to warn users before hitting limits
2. **Implement Backoff**: Use exponential backoff when approaching limits
3. **Cache Responses**: Cache API responses client-side to reduce unnecessary calls
4. **Batch Requests**: Combine multiple operations into single requests where possible
5. **Handle 429s Gracefully**: Display user-friendly messages when rate limited

## Scaling Considerations

### Current Implementation (In-Memory)
- ✅ Simple and fast
- ✅ No external dependencies
- ✅ Works well for single-instance deployments
- ❌ Resets on server restart
- ❌ Not shared across multiple instances

### Future Scaling Options

For production at scale, consider:

1. **Redis-Based Rate Limiting**
   - Shared state across multiple edge function instances
   - Persistent rate limit counters
   - More accurate distributed rate limiting

2. **API Gateway Rate Limiting**
   - CloudFlare, Kong, or AWS API Gateway
   - Handles rate limiting at infrastructure level
   - Geographic distribution support

3. **Token Bucket Algorithm**
   - More flexible burst handling
   - Better user experience for occasional spikes

## Monitoring

### Key Metrics to Track

1. **Rate Limit Hit Rate**: Percentage of requests that exceed limits
2. **Top Rate Limited IPs/Users**: Identify potential abuse or legitimate high-usage scenarios
3. **Average Requests per User**: Understand typical usage patterns
4. **Peak Load Times**: Identify when rate limits are most frequently hit

### Logging

All rate limit events are logged with:
- Timestamp
- Client identifier (IP or User ID)
- Endpoint
- Rate limit tier
- Remaining requests

Example log:
```
AI chat rate limit exceeded for user:708c6e56-2d28-4d03-9e48-70262c4c8a23
```

## Adjusting Rate Limits

To modify rate limits, edit `supabase/functions/_shared/rateLimiter.ts`:

```typescript
export const RATE_LIMITS = {
  AUTH: { maxRequests: 5, windowMs: 15 * 60 * 1000 },
  AI: { maxRequests: 20, windowMs: 60 * 1000 },
  API: { maxRequests: 60, windowMs: 60 * 1000 },
  EXPENSIVE: { maxRequests: 10, windowMs: 60 * 1000 },
};
```

Adjust `maxRequests` and `windowMs` (in milliseconds) based on:
- Server capacity
- User feedback
- Abuse patterns
- Cost considerations for external APIs

## Security Benefits

Rate limiting provides several security benefits:

1. **Brute Force Protection**: Prevents automated password guessing attacks
2. **DDoS Mitigation**: Limits impact of distributed denial of service attempts
3. **Cost Control**: Prevents abuse of expensive AI/external API calls
4. **Fair Usage**: Ensures all users get equal access to resources
5. **Bot Prevention**: Makes automated scraping/abuse more difficult

## Testing Rate Limits

To test rate limiting in development:

```bash
# Test AI endpoint rate limit (20 req/min)
for i in {1..25}; do
  curl -X POST https://your-project.supabase.co/functions/v1/ai-chat \
    -H "Content-Type: application/json" \
    -d '{"message": "Test message '$i'"}' \
    && echo "\nRequest $i completed"
done
```

Expected: First 20 requests succeed, remaining 5 return 429.

## Support and Questions

For questions about rate limiting:
- Check response headers to understand current limits
- Review logs for rate limit events
- Contact support if legitimate usage is being blocked
