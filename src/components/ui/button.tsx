"use client"

import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/lib/button-variants"

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  if (asChild && props.children && typeof props.children === "object") {
    const child = props.children as React.ReactElement<Record<string, unknown>>;
    const { children: _c, ...rest } = props;
    return (
      <child.type
        {...(child.props || {})}
        {...rest}
        className={cn(buttonVariants({ variant, size, className }), String((child.props as Record<string, unknown>)?.className || ""))}
      />
    );
  }
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
