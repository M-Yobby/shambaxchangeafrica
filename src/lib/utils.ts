import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines multiple class names and merges Tailwind CSS classes intelligently.
 * 
 * This utility combines clsx for conditional class names with tailwind-merge to
 * handle conflicting Tailwind classes (e.g., if you pass both "p-4" and "p-2",
 * only the last one will be applied).
 * 
 * @param inputs - Any number of class values (strings, objects, arrays, etc.)
 * @returns A merged string of class names with conflicts resolved
 * 
 * @example
 * ```tsx
 * cn("px-2 py-1", "px-4") // Returns "py-1 px-4" (px-2 is overridden)
 * cn("text-red-500", condition && "text-blue-500") // Conditional classes
 * cn({ "bg-primary": isPrimary, "bg-secondary": !isPrimary }) // Object syntax
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
