import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-normal transition-all duration-fast disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-95",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground rounded-pill hover:bg-primary/90",
        destructive:
          "bg-destructive text-white rounded-pill hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        outline:
          "border border-border bg-transparent hover:bg-accent hover:text-accent-foreground dark:bg-transparent dark:border-border dark:hover:bg-accent/50",
        secondary:
          "bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
        /* Apple HIG Button Variants */
        "apple-primary-pill":
          "bg-primary text-primary-foreground rounded-pill px-[22px] py-[11px] text-body font-normal hover:bg-primary/90",
        "apple-secondary-pill":
          "bg-transparent text-primary border border-primary rounded-pill px-[22px] py-[11px] text-body font-normal hover:bg-primary/10",
        "apple-dark-utility":
          "bg-foreground text-apple-on-dark-text rounded-apple-sm px-[15px] py-[8px] text-caption font-normal hover:bg-foreground/90",
        "apple-pearl-capsule":
          "bg-secondary text-apple-ink-muted-80 rounded-apple-md px-[14px] py-[8px] text-caption font-normal border-3 border-apple-divider-soft hover:bg-secondary/80",
        "apple-store-hero":
          "bg-primary text-primary-foreground rounded-pill px-[28px] py-[14px] text-[18px] font-light hover:bg-primary/90",
        "apple-icon":
          "size-11 bg-apple-chip/40 text-foreground rounded-full hover:bg-apple-chip/60",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }