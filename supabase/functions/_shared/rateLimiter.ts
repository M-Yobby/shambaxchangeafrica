// Rate limiter utility for Supabase Edge Functions
// Implements sliding window rate limiting with automatic cleanup

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RequestRecord {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting
// In production, consider using Redis for distributed rate limiting
const requestStore = new Map<string, RequestRecord>();

// Cleanup old entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of requestStore.entries()) {
    if (record.resetTime < now) {
      requestStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (IP address, user ID, etc.)
 * @param config - Rate limit configuration
 * @returns Object with isLimited flag and remaining requests
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): { isLimited: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const record = requestStore.get(identifier);

  // No record exists, create new one
  if (!record) {
    requestStore.set(identifier, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return {
      isLimited: false,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs,
    };
  }

  // Window has expired, reset counter
  if (record.resetTime < now) {
    requestStore.set(identifier, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return {
      isLimited: false,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs,
    };
  }

  // Increment counter
  record.count++;

  // Check if limit exceeded
  if (record.count > config.maxRequests) {
    return {
      isLimited: true,
      remaining: 0,
      resetTime: record.resetTime,
    };
  }

  return {
    isLimited: false,
    remaining: config.maxRequests - record.count,
    resetTime: record.resetTime,
  };
}

/**
 * Get client identifier from request (IP address or user ID)
 */
export function getClientIdentifier(req: Request, userId?: string): string {
  // Prefer user ID if available for authenticated requests
  if (userId) {
    return `user:${userId}`;
  }

  // Fall back to IP address for unauthenticated requests
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 
             req.headers.get('x-real-ip') || 
             'unknown';
  
  return `ip:${ip}`;
}

/**
 * Create a rate limit response with appropriate headers
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
      retryAfter: Math.ceil((resetTime - Date.now()) / 1000),
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': resetDate.toISOString(),
        'Retry-After': Math.ceil((resetTime - Date.now()) / 1000).toString(),
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    }
  );
}

// Predefined rate limit configurations
export const RATE_LIMITS = {
  // Strict limit for auth-related endpoints
  AUTH: { maxRequests: 5, windowMs: 15 * 60 * 1000 }, // 5 requests per 15 minutes
  
  // Moderate limit for AI endpoints
  AI: { maxRequests: 20, windowMs: 60 * 1000 }, // 20 requests per minute
  
  // Generous limit for general API endpoints
  API: { maxRequests: 60, windowMs: 60 * 1000 }, // 60 requests per minute
  
  // Strict limit for expensive operations
  EXPENSIVE: { maxRequests: 10, windowMs: 60 * 1000 }, // 10 requests per minute
};
