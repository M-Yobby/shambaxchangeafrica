/**
 * RATE LIMITER UTILITY
 * 
 * Shared rate limiting implementation for all edge functions.
 * Prevents abuse, manages API costs, and protects against brute force attacks.
 * 
 * RATE LIMITING STRATEGY:
 * - Sliding window algorithm
 * - In-memory storage (per edge function instance)
 * - Automatic cleanup of expired entries
 * - Configurable limits per endpoint type
 * 
 * KEY FEATURES:
 * 1. Multiple limit tiers (AUTH, AI, API, EXPENSIVE)
 * 2. Client identification (IP or user ID)
 * 3. Automatic window reset
 * 4. Memory leak prevention
 * 5. Standard HTTP 429 responses
 * 
 * LIMIT TIERS:
 * - AUTH: 5 req/15min (strict, prevents brute force)
 * - AI: 20 req/min (moderate, manages AI API costs)
 * - API: 60 req/min (generous, normal operations)
 * - EXPENSIVE: 10 req/min (strict, resource-intensive ops)
 * 
 * SLIDING WINDOW ALGORITHM:
 * 1. Check if identifier has record
 * 2. If no record → allow and create record
 * 3. If window expired → reset and allow
 * 4. If within window → increment counter
 * 5. If over limit → reject with 429
 * 
 * MEMORY MANAGEMENT:
 * - Cleanup runs every 5 minutes
 * - Removes expired entries
 * - Prevents memory growth over time
 * 
 * PRODUCTION CONSIDERATIONS:
 * - Current: In-memory (per instance, ephemeral)
 * - Recommended: Redis (distributed, persistent)
 * - Edge functions can scale horizontally → shared state needed
 * - In-memory works for moderate traffic
 */

/**
 * Rate Limit Configuration Interface
 * Defines request limits and time window
 */
interface RateLimitConfig {
  maxRequests: number;  // Max requests allowed in window
  windowMs: number;     // Time window in milliseconds
}

/**
 * Request Record Interface
 * Tracks request count and reset time for each client
 */
interface RequestRecord {
  count: number;      // Number of requests in current window
  resetTime: number;  // Unix timestamp when window resets
}

/**
 * IN-MEMORY REQUEST STORE
 * Maps client identifiers to their request records
 * 
 * STRUCTURE:
 * - Key: "user:123" or "ip:192.168.1.1"
 * - Value: { count: 15, resetTime: 1732042800000 }
 * 
 * LIMITATIONS:
 * - Per edge function instance (not shared across instances)
 * - Lost on function restart
 * - Not suitable for strict distributed rate limiting
 * 
 * For production at scale, use Redis:
 * - Shared across all instances
 * - Persistent across restarts
 * - Distributed rate limiting
 */
const requestStore = new Map<string, RequestRecord>();

/**
 * AUTOMATIC CLEANUP
 * Removes expired entries every 5 minutes to prevent memory leaks
 * 
 * WHY NEEDED:
 * - Map grows as new clients make requests
 * - Old entries never accessed again after window expires
 * - Without cleanup, memory usage increases indefinitely
 * 
 * CLEANUP LOGIC:
 * - Runs every 5 minutes (300,000ms)
 * - Iterates through all stored records
 * - Deletes records where resetTime < current time
 * - Keeps memory footprint minimal
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of requestStore.entries()) {
    if (record.resetTime < now) {
      requestStore.delete(key);
    }
  }
}, 5 * 60 * 1000); // 5 minutes

/**
 * CHECK RATE LIMIT
 * Core rate limiting logic using sliding window algorithm
 * 
 * ALGORITHM:
 * 1. Check if client has existing record
 * 2. If no record → First request, allow and create record
 * 3. If window expired → Reset counter and allow
 * 4. If within window → Increment counter
 * 5. If over limit → Reject request
 * 
 * SLIDING WINDOW:
 * - Time-based windows (e.g., 1 minute, 15 minutes)
 * - Each client tracked independently
 * - Window resets after expiration
 * - Counter increments on each request
 * 
 * EXAMPLE FLOW:
 * ```
 * Config: 20 requests per minute
 * Client makes request at T=0s → count: 1/20, allowed
 * Client makes 19 more requests → count: 20/20, allowed
 * Client makes 21st request → count: 21/20, REJECTED
 * At T=60s → window expires, count resets to 0
 * Client makes request at T=61s → count: 1/20, allowed
 * ```
 * 
 * @param identifier - Unique client ID (user:123 or ip:192.168.1.1)
 * @param config - Rate limit rules (maxRequests, windowMs)
 * @returns Rate limit status with remaining requests and reset time
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): { isLimited: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const record = requestStore.get(identifier);

  // CASE 1: No record exists (first request from this client)
  if (!record) {
    // Create new record with count=1 and set window expiration
    requestStore.set(identifier, {
      count: 1,
      resetTime: now + config.windowMs, // Window expires in future
    });
    return {
      isLimited: false,                    // Allow request
      remaining: config.maxRequests - 1,   // Remaining requests in window
      resetTime: now + config.windowMs,    // When window resets
    };
  }

  // CASE 2: Window has expired (reset counter)
  if (record.resetTime < now) {
    // Reset counter and start new window
    requestStore.set(identifier, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return {
      isLimited: false,                    // Allow request
      remaining: config.maxRequests - 1,   // Fresh window
      resetTime: now + config.windowMs,
    };
  }

  // CASE 3: Within active window (increment counter)
  record.count++;

  // Check if limit exceeded
  if (record.count > config.maxRequests) {
    // Over limit → reject request
    return {
      isLimited: true,           // REJECT
      remaining: 0,              // No requests left
      resetTime: record.resetTime, // When client can try again
    };
  }

  // Under limit → allow request
  return {
    isLimited: false,                         // Allow request
    remaining: config.maxRequests - record.count, // Requests left in window
    resetTime: record.resetTime,              // When window resets
  };
}

/**
 * GET CLIENT IDENTIFIER
 * Extracts unique identifier from request for rate limiting
 * 
 * IDENTIFICATION STRATEGY:
 * 1. Authenticated requests → Use user ID (most accurate)
 * 2. Unauthenticated requests → Use IP address (fallback)
 * 
 * WHY USER ID PREFERRED:
 * - Survives IP changes (mobile networks, VPNs)
 * - More accurate user tracking
 * - Prevents shared IP issues (offices, schools)
 * 
 * IP ADDRESS FALLBACK:
 * - Used when user not authenticated
 * - Extracted from headers (proxy-aware)
 * - Checks multiple headers for accuracy
 * 
 * HEADER PRIORITY:
 * 1. x-forwarded-for (if behind proxy/CDN)
 * 2. x-real-ip (alternative proxy header)
 * 3. "unknown" (if no IP available)
 * 
 * @param req - HTTP request object
 * @param userId - Optional authenticated user ID
 * @returns Identifier string (e.g., "user:abc123" or "ip:192.168.1.1")
 */
export function getClientIdentifier(req: Request, userId?: string): string {
  // PREFERRED: Use user ID if available (authenticated request)
  if (userId) {
    return `user:${userId}`;
  }

  // FALLBACK: Extract IP address from request headers
  // x-forwarded-for contains client IP when behind proxy/load balancer
  // May contain multiple IPs if multiple proxies, take first (original client)
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 
             req.headers.get('x-real-ip') ||                      // Alternative proxy header
             'unknown';                                           // Last resort
  
  return `ip:${ip}`;
}

/**
 * CREATE RATE LIMIT RESPONSE
 * Generates standardized HTTP 429 response when rate limit exceeded
 * 
 * RESPONSE COMPONENTS:
 * 1. Status 429 (Too Many Requests)
 * 2. Error message for user
 * 3. Retry-After header (seconds until reset)
 * 4. Rate limit headers (standard pattern)
 * 
 * HEADERS EXPLAINED:
 * - X-RateLimit-Remaining: Requests left in window (0 when limited)
 * - X-RateLimit-Reset: ISO timestamp when limit resets
 * - Retry-After: Seconds to wait (used by HTTP clients)
 * 
 * CLIENT BEHAVIOR:
 * - Should display error message to user
 * - Should wait Retry-After seconds before retrying
 * - Should show countdown if implementing retry logic
 * 
 * @param remaining - Requests remaining (always 0 when limited)
 * @param resetTime - Unix timestamp when limit resets
 * @returns HTTP 429 Response with rate limit information
 */
export function createRateLimitResponse(
  remaining: number,
  resetTime: number
): Response {
  const resetDate = new Date(resetTime);
  
  return new Response(
    JSON.stringify({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: Math.ceil((resetTime - Date.now()) / 1000), // Seconds until reset
    }),
    {
      status: 429, // Standard rate limit status code
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Remaining': remaining.toString(),           // 0 when limited
        'X-RateLimit-Reset': resetDate.toISOString(),           // When limit resets
        'Retry-After': Math.ceil((resetTime - Date.now()) / 1000).toString(), // Seconds to wait
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    }
  );
}

/**
 * PREDEFINED RATE LIMIT CONFIGURATIONS
 * 
 * Different endpoint types have different rate limits based on:
 * - Cost (AI endpoints are expensive)
 * - Abuse risk (auth endpoints vulnerable to brute force)
 * - Resource intensity (some operations are heavy)
 * - Expected usage patterns (APIs need higher limits)
 * 
 * CONFIGURATION DETAILS:
 * 
 * AUTH (5 req/15min):
 * - Protects login, signup, password reset
 * - Prevents brute force attacks
 * - Very strict to protect accounts
 * - 15-minute window allows legitimate retries
 * 
 * AI (20 req/min):
 * - Protects AI chat and insights endpoints
 * - Balances user experience with API costs
 * - Moderate limit for conversational usage
 * - Prevents excessive API spending
 * 
 * API (60 req/min):
 * - General data fetching endpoints
 * - Weather, listings, posts, etc.
 * - Generous for normal app usage
 * - 1 request per second average
 * 
 * EXPENSIVE (10 req/min):
 * - Resource-intensive operations
 * - Complex queries, data exports
 * - Image processing, bulk operations
 * - Protects server resources
 */
export const RATE_LIMITS = {
  // STRICT: Auth endpoints (brute force protection)
  AUTH: { maxRequests: 5, windowMs: 15 * 60 * 1000 }, // 5 requests per 15 minutes
  
  // MODERATE: AI endpoints (cost management)
  AI: { maxRequests: 20, windowMs: 60 * 1000 }, // 20 requests per minute
  
  // GENEROUS: General API endpoints (normal usage)
  API: { maxRequests: 60, windowMs: 60 * 1000 }, // 60 requests per minute
  
  // STRICT: Expensive operations (resource protection)
  EXPENSIVE: { maxRequests: 10, windowMs: 60 * 1000 }, // 10 requests per minute
};
