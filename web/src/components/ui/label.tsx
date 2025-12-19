import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
  {
    variants: {
      tone: {
        default: "",
        muted: "text-muted-foreground",
      },
    },
    defaultVariants: {
      tone: "default",
    },
  },
)

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement>,
    VariantProps<typeof labelVariants> {
  asChild?: boolean
}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, tone, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "label"
    return (
      <Comp
        ref={ref}
        className={cn(labelVariants({ tone, className }))}
        {...props}
      />
    )
  },
)
Label.displayName = "Label"

export { Label }



