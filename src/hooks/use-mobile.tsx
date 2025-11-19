import * as React from "react";

const MOBILE_BREAKPOINT = 768;

/**
 * Custom hook to detect if the current viewport is mobile-sized.
 * 
 * Uses a media query to check if the viewport width is less than 768px.
 * The hook updates reactively when the window is resized, ensuring the
 * component re-renders when crossing the mobile breakpoint.
 * 
 * @returns {boolean} True if viewport width is less than 768px, false otherwise
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const isMobile = useIsMobile();
 *   
 *   return (
 *     <div>
 *       {isMobile ? <MobileMenu /> : <DesktopMenu />}
 *     </div>
 *   );
 * }
 * ```
 * 
 * @remarks
 * - Initial value is `undefined` until first render to avoid hydration mismatches
 * - Automatically cleans up event listeners on unmount
 * - Breakpoint is set at 768px (standard tablet/mobile boundary)
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}
