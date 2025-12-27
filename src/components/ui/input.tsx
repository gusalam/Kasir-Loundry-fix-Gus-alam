import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  inputSize?: "default" | "sm" | "lg";
  variant?: "default" | "filled" | "outline" | "error";
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, leftIcon, rightIcon, inputSize = "default", variant = "default", ...props }, ref) => {
    const sizeClasses = {
      default: "h-10 px-4 py-2 text-sm",
      sm: "h-8 px-3 py-1.5 text-xs rounded-md",
      lg: "h-12 px-5 py-3 text-base",
    };

    const variantClasses = {
      default: "border-input focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary",
      filled: "border-transparent bg-muted focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-ring",
      outline: "border-2 border-input focus-visible:border-primary",
      error: "border-danger focus-visible:ring-2 focus-visible:ring-danger/20",
    };

    const inputClasses = cn(
      "flex w-full rounded-lg border bg-background text-foreground transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
      sizeClasses[inputSize],
      variantClasses[variant],
      leftIcon && "pl-10",
      rightIcon && "pr-10",
      className
    );

    if (leftIcon || rightIcon) {
      return (
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {leftIcon}
            </div>
          )}
          <input type={type} className={inputClasses} ref={ref} {...props} />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {rightIcon}
            </div>
          )}
        </div>
      );
    }

    return <input type={type} className={inputClasses} ref={ref} {...props} />;
  }
);
Input.displayName = "Input";

export { Input };
