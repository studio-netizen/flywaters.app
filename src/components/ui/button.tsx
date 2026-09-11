import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium ring-offset-background transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:opacity-85 shadow-none",
  {
    variants: {
      variant: {
        default: "bg-[#242242] text-white",
        destructive: "bg-destructive text-destructive-foreground",
        outline: "bg-transparent border-[1.5px] border-[#242242] text-[#242242]",
        secondary: "bg-transparent border-[1.5px] border-[#242242] text-[#242242]",
        ghost: "bg-transparent hover:underline hover:opacity-100",
        link: "bg-transparent underline-offset-4 hover:underline hover:opacity-100 text-foreground",
      },
      size: {
        default: "h-auto px-8 py-3.5",
        sm: "h-auto px-5 py-2.5",
        lg: "h-auto px-10 py-4",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
