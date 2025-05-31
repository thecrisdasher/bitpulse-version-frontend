import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper function to handle button variants
export function getButtonVariant(variant?: string) {
  switch (variant) {
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
}

// Helper function to handle badge variants
export function getBadgeVariant(variant?: string) {
  switch (variant) {
    case 'secondary':
      return 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80';
    case 'destructive':
      return 'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80';
    case 'outline':
      return 'text-foreground';
    default:
      return 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80';
  }
}
