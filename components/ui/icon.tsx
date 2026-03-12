/**
 * Icon Component - Standardized Icon Wrapper
 *
 * This component provides a consistent interface for using Lucide icons
 * across the application with standardized sizes and styling.
 *
 * Usage:
 * import { Icon } from '@/components/ui/icon';
 * import { Home, Settings } from 'lucide-react';
 *
 * <Icon icon={Home} size="sm" />
 * <Icon icon={Settings} size="lg" className="text-primary" />
 */

import { cn } from "@/lib/utils";
import { LucideIcon, LucideProps } from "lucide-react";

/**
 * Standard icon sizes
 * - xs: 12px (w-3 h-3) - Inline small icons, badge icons
 * - sm: 16px (w-4 h-4) - Button icons, menu item icons
 * - md: 20px (w-5 h-5) - Card title icons, list icons (default)
 * - lg: 24px (w-6 h-6) - Page title icons, primary actions
 * - xl: 32px (w-8 h-8) - Large decorative icons
 */
export type IconSize = "xs" | "sm" | "md" | "lg" | "xl";

const sizeMap: Record<IconSize, string> = {
  xs: "w-3 h-3",
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
  xl: "w-8 h-8",
};

export interface IconProps extends Omit<LucideProps, "size"> {
  /** The Lucide icon component to render */
  icon: LucideIcon;
  /** Standard size preset (defaults to 'md') */
  size?: IconSize;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Icon component for consistent icon usage across the application.
 *
 * @example
 * // Basic usage
 * <Icon icon={Home} />
 *
 * @example
 * // With size and color
 * <Icon icon={Settings} size="lg" className="text-primary" />
 *
 * @example
 * // In a button
 * <button>
 *   <Icon icon={Plus} size="sm" className="mr-2" />
 *   Add Item
 * </button>
 */
export function Icon({ icon: IconComponent, size = "md", className, ...props }: IconProps) {
  return (
    <IconComponent
      className={cn(sizeMap[size], className)}
      aria-hidden="true"
      {...props}
    />
  );
}

/**
 * Icon button component for icon-only buttons with proper accessibility.
 *
 * @example
 * <IconButton icon={Settings} label="Settings" onClick={handleClick} />
 */
export interface IconButtonProps extends IconProps {
  /** Accessible label for the button */
  label: string;
  /** Click handler */
  onClick?: () => void;
  /** Button variant style */
  variant?: "default" | "ghost" | "outline";
  /** Disabled state */
  disabled?: boolean;
}

export function IconButton({
  icon,
  label,
  onClick,
  variant = "ghost",
  disabled = false,
  className,
  size = "md",
  ...props
}: IconButtonProps) {
  const variantStyles = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    outline: "border border-input hover:bg-accent hover:text-accent-foreground",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        "inline-flex items-center justify-center rounded-md p-2",
        "transition-colors focus-visible:outline-none focus-visible:ring-2",
        "focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        variantStyles[variant],
        className
      )}
    >
      <Icon icon={icon} size={size} {...props} />
    </button>
  );
}

/**
 * Helper function to get the Tailwind class for a given icon size.
 * Useful when you need the size class directly without the Icon component.
 */
export function getIconSizeClass(size: IconSize): string {
  return sizeMap[size];
}

// Export size map for external use
export { sizeMap as iconSizeMap };