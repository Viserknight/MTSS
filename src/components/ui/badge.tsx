import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 shadow-[0_2px_4px_hsl(var(--secondary)/0.1),inset_0_1px_0_hsl(0_0%_100%/0.1)]",
  {
    variants: {
      variant: {
        default: "border-transparent bg-gradient-to-b from-primary to-primary/90 text-primary-foreground hover:from-primary/90 hover:to-primary/80",
        secondary: "border-transparent bg-gradient-to-b from-secondary to-secondary/90 text-secondary-foreground hover:from-secondary/90 hover:to-secondary/80",
        destructive: "border-transparent bg-gradient-to-b from-destructive to-destructive/90 text-destructive-foreground hover:from-destructive/90 hover:to-destructive/80",
        outline: "text-foreground bg-background/50 backdrop-blur-sm",
        success: "border-transparent bg-gradient-to-b from-success to-success/90 text-success-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
