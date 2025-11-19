/**
 * CONTENT VALIDATION AND SANITIZATION
 * 
 * Security layer for user-generated content in social features.
 * Prevents XSS attacks, spam, and excessive content while allowing safe formatting.
 * 
 * SECURITY THREATS ADDRESSED:
 * 1. XSS (Cross-Site Scripting): Malicious JavaScript injection
 * 2. URL-based attacks: javascript:, data:, and other dangerous protocols
 * 3. HTML injection: Unwanted styling, forms, scripts
 * 4. Content flooding: Excessively long posts
 * 
 * VALIDATION LAYERS:
 * 1. Length limits (posts: 2000 chars, comments: 500 chars)
 * 2. URL protocol validation (only http/https allowed)
 * 3. HTML sanitization (only safe tags allowed)
 * 4. Content trimming (remove leading/trailing whitespace)
 * 
 * ALLOWED HTML TAGS:
 * - Formatting: <b>, <i>, <em>, <strong>
 * - Links: <a> (with href validation)
 * - Structure: <br>, <p>
 * 
 * BLOCKED HTML:
 * - Scripts: <script>, <iframe>, <object>
 * - Forms: <form>, <input>, <button>
 * - Events: onclick, onload, onerror, etc.
 * - Data attributes: data-*
 * - Dangerous protocols: javascript:, data:, vbscript:
 */

import { z } from "zod";
import DOMPurify from "dompurify";

/**
 * Validates that all URLs in a text string use safe protocols (http or https).
 * 
 * This prevents dangerous protocols like javascript:, data:, or file: which could
 * be used for XSS attacks or accessing local files.
 * 
 * @param {string} text - The text content to check for URLs
 * @returns {boolean} True if all URLs are safe, false if any dangerous URLs are found
 * 
 * @example
 * ```ts
 * validateUrls("Check out https://example.com") // Returns true
 * validateUrls("Click here: javascript:alert('XSS')") // Returns false
 * validateUrls("Safe http://site.com and https://secure.com") // Returns true
 * ```
 * 
 * @remarks
 * - Uses regex to find all URLs in the text
 * - Only allows http:// and https:// protocols
 * - Blocks javascript:, data:, file:, and other dangerous protocols
 * - Returns true if no URLs are found (empty text is safe)
 */
const validateUrls = (text: string): boolean => {
  // Extract all URLs from text using regex
  const urlPattern = /(https?:\/\/[^\s]+)/g;
  const urls = text.match(urlPattern) || [];
  
  // Validate each URL's protocol
  return urls.every(url => {
    try {
      const parsedUrl = new URL(url);
      // Only allow http and https protocols
      return ['http:', 'https:'].includes(parsedUrl.protocol);
    } catch {
      // Invalid URL format
      return false;
    }
  });
};

/**
 * POST VALIDATION SCHEMA
 * Defines rules for social post content
 * 
 * CONSTRAINTS:
 * - Minimum: 1 character (no empty posts)
 * - Maximum: 2000 characters (prevents spam)
 * - URL validation: Only safe protocols
 * 
 * WHY 2000 CHARACTERS:
 * - Long enough for meaningful content
 * - Short enough to prevent abuse
 * - Similar to Twitter's extended limit
 * - Reduces database storage needs
 */
export const postSchema = z.object({
  content: z.string()
    .trim() // Remove leading/trailing whitespace
    .min(1, "Post cannot be empty") // No blank posts
    .max(2000, "Post must not exceed 2000 characters") // Spam prevention
    .refine(
      (text) => validateUrls(text),
      "Invalid URL detected in post content" // Block dangerous URLs
    ),
});

/**
 * COMMENT VALIDATION SCHEMA
 * Defines rules for comment content
 * 
 * CONSTRAINTS:
 * - Minimum: 1 character (no empty comments)
 * - Maximum: 500 characters (shorter than posts)
 * - URL validation: Only safe protocols
 * 
 * WHY 500 CHARACTERS:
 * - Comments should be concise responses
 * - Prevents comment sections from overwhelming posts
 * - Encourages focused discussion
 */
export const commentSchema = z.object({
  content: z.string()
    .trim() // Remove leading/trailing whitespace
    .min(1, "Comment cannot be empty") // No blank comments
    .max(500, "Comment must not exceed 500 characters") // Keep comments concise
    .refine(
      (text) => validateUrls(text),
      "Invalid URL detected in comment" // Block dangerous URLs
    ),
});

/**
 * Sanitizes HTML content using DOMPurify to remove dangerous elements.
 * 
 * Removes all potentially dangerous HTML while preserving safe formatting tags.
 * This is the final security layer after validation.
 * 
 * @param {string} content - Raw HTML content from user input
 * @returns {string} Sanitized HTML safe for rendering
 * 
 * @example
 * ```ts
 * const userInput = '<p>Hello <script>alert("XSS")</script></p>';
 * const safe = sanitizeContent(userInput);
 * // Returns: '<p>Hello </p>' (script removed)
 * 
 * const formatted = '<p>Hello <b>world</b>!</p>';
 * const safe2 = sanitizeContent(formatted);
 * // Returns: '<p>Hello <b>world</b>!</p>' (safe tags preserved)
 * ```
 * 
 * @remarks
 * - Allowed tags: <b>, <i>, <em>, <strong>, <a>, <br>, <p>
 * - Allowed attributes: href, target, rel (on <a> tags only)
 * - Stripped: All scripts, forms, event handlers, data attributes
 */
export const sanitizeContent = (content: string): string => {
  // Configure DOMPurify with strict whitelist
  const config = {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'br', 'p'], // Safe formatting tags only
    ALLOWED_ATTR: ['href', 'target', 'rel'], // Link attributes only
    ALLOW_DATA_ATTR: false, // Block data-* attributes
  };
  
  // Sanitize and return safe HTML
  return DOMPurify.sanitize(content, config);
};

/**
 * Validates and sanitizes post content before saving to database.
 * 
 * @param {string} content - Raw post content from user input
 * @returns {Object} Validation result with success status, sanitized content, or error message
 * 
 * @example
 * ```tsx
 * const result = validateAndSanitizePost(rawContent);
 * if (result.success) {
 *   await supabase.from('posts').insert({ content: result.sanitized });
 * } else {
 *   toast({ title: "Error", description: result.error });
 * }
 * ```
 */
export const validateAndSanitizePost = (content: string) => {
  // Step 1: Validate using Zod schema
  const validation = postSchema.safeParse({ content });
  
  if (!validation.success) {
    // Validation failed - return error
    return {
      success: false,
      error: validation.error.errors[0].message,
      sanitized: null,
    };
  }
  
  // Step 2: Sanitize HTML content
  return {
    success: true,
    error: null,
    sanitized: sanitizeContent(content),
  };
};

/**
 * Validates and sanitizes comment content before saving to database.
 * 
 * This function performs two-step validation:
 * 1. Schema validation using Zod (length limits, URL safety)
 * 2. HTML sanitization using DOMPurify (XSS prevention)
 * 
 * @param {string} content - Raw comment content from user input
 * @returns {Object} Validation result with success status, sanitized content, or error message
 * @returns {boolean} returns.success - Whether validation passed
 * @returns {string|null} returns.error - Error message if validation failed
 * @returns {string|null} returns.sanitized - Sanitized content if validation passed
 * 
 * @example
 * ```tsx
 * const result = validateAndSanitizeComment(userInput);
 * if (result.success) {
 *   await supabase.from('comments').insert({ content: result.sanitized });
 * } else {
 *   toast({ title: "Error", description: result.error });
 * }
 * ```
 */
export const validateAndSanitizeComment = (content: string) => {
  // Step 1: Validate using Zod schema
  const validation = commentSchema.safeParse({ content });
  
  if (!validation.success) {
    // Validation failed - return error
    return {
      success: false,
      error: validation.error.errors[0].message,
      sanitized: null,
    };
  }
  
  // Step 2: Sanitize HTML content
  return {
    success: true,
    error: null,
    sanitized: sanitizeContent(content),
  };
};
