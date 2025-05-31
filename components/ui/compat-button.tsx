import * as React from "react"
import { Button as BaseButton } from "./button"
import { cn } from "@/lib/utils"

// Extended ButtonProps that accepts variant as string
export interface CompatButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | string;
  size?: 'default' | 'sm' | 'lg' | 'icon' | string;
  asChild?: boolean;
}

const CompatButton = React.forwardRef<HTMLButtonElement, CompatButtonProps>(
  ({ variant = 'default', size = 'default', className, asChild, ...props }, ref) => {
    // Apply appropriate styling based on variant
    const getVariantClasses = (v?: string) => {
      switch (v) {
        case 'destructive':
          return 'bg-destructive text-destructive-foreground hover:bg-destructive/90';
        case 'outline':
          return 'border border-input bg-background hover:bg-accent hover:text-accent-foreground';
        case 'secondary':
          return 'bg-secondary text-secondary-foreground hover:bg-secondary/80';
        case 'ghost':
          return 'hover:bg-accent hover:text-accent-foreground';
        case 'link':
          return 'text-primary underline-offset-4 hover:underline';
        default:
          return 'bg-primary text-primary-foreground hover:bg-primary/90';
      }
    };

    const getSizeClasses = (s?: string) => {
      switch (s) {
        case 'sm':
          return 'h-9 rounded-md px-3';
        case 'lg':
          return 'h-11 rounded-md px-8';
        case 'icon':
          return 'h-10 w-10';
        default:
          return 'h-10 px-4 py-2';
      }
    };

    const buttonClasses = cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      getVariantClasses(variant),
      getSizeClasses(size),
      className
    );

    // If asChild is true, we would need to use Slot from @radix-ui/react-slot
    // For now, we'll just ignore asChild and render as button
    // In a full implementation, you'd want to handle this properly
    return (
      <button
        ref={ref}
        className={buttonClasses}
        {...props}
      />
    )
  }
)
CompatButton.displayName = "CompatButton"

export { CompatButton }
export default CompatButton 