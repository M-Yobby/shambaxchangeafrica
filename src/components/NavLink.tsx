/**
 * NAVLINK COMPONENT
 * 
 * Enhanced version of React Router's NavLink with active state styling support.
 * Provides separate className props for active and pending states.
 * 
 * @component
 * @example
 * ```tsx
 * <NavLink 
 *   to="/dashboard"
 *   className="nav-item"
 *   activeClassName="nav-item-active"
 * >
 *   Dashboard
 * </NavLink>
 * ```
 */

import { NavLink as RouterNavLink, NavLinkProps } from "react-router-dom";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Props for the NavLink component
 * @interface NavLinkCompatProps
 * @property {string} [className] - Base CSS classes
 * @property {string} [activeClassName] - CSS classes applied when link is active
 * @property {string} [pendingClassName] - CSS classes applied during navigation
 */
interface NavLinkCompatProps extends Omit<NavLinkProps, "className"> {
  className?: string;
  activeClassName?: string;
  pendingClassName?: string;
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ className, activeClassName, pendingClassName, to, ...props }, ref) => {
    return (
      <RouterNavLink
        ref={ref}
        to={to}
        className={({ isActive, isPending }) =>
          cn(className, isActive && activeClassName, isPending && pendingClassName)
        }
        {...props}
      />
    );
  },
);

NavLink.displayName = "NavLink";

export { NavLink };
