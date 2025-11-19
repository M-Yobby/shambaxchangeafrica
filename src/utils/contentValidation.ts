import { z } from "zod";
import DOMPurify from "dompurify";

// URL validation regex - allows common URL patterns
const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;

// Validate URLs in text content
const validateUrls = (text: string): boolean => {
  const urlPattern = /(https?:\/\/[^\s]+)/g;
  const urls = text.match(urlPattern) || [];
  
  return urls.every(url => {
    try {
      const parsedUrl = new URL(url);
      // Only allow http and https protocols
      return ['http:', 'https:'].includes(parsedUrl.protocol);
    } catch {
      return false;
    }
  });
};

// Post validation schema
export const postSchema = z.object({
  content: z.string()
    .trim()
    .min(1, "Post cannot be empty")
    .max(2000, "Post must not exceed 2000 characters")
    .refine(
      (text) => validateUrls(text),
      "Invalid URL detected in post content"
    ),
});

// Comment validation schema
export const commentSchema = z.object({
  content: z.string()
    .trim()
    .min(1, "Comment cannot be empty")
    .max(500, "Comment must not exceed 500 characters")
    .refine(
      (text) => validateUrls(text),
      "Invalid URL detected in comment"
    ),
});

// Sanitize HTML content to prevent XSS
export const sanitizeContent = (content: string): string => {
  // Configure DOMPurify to allow only safe tags and attributes
  const config = {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'br', 'p'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
  };
  
  return DOMPurify.sanitize(content, config);
};

// Sanitize and validate post content
export const validateAndSanitizePost = (content: string) => {
  const validation = postSchema.safeParse({ content });
  
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0].message,
      sanitized: null,
    };
  }
  
  return {
    success: true,
    error: null,
    sanitized: sanitizeContent(content),
  };
};

// Sanitize and validate comment content
export const validateAndSanitizeComment = (content: string) => {
  const validation = commentSchema.safeParse({ content });
  
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0].message,
      sanitized: null,
    };
  }
  
  return {
    success: true,
    error: null,
    sanitized: sanitizeContent(content),
  };
};
