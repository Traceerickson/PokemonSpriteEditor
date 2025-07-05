"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export interface SliderProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value: number[]
  onValueChange?: (value: number[]) => void
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, value, onValueChange, min, max, step, ...props }, ref) => {
    return (
      <input
        type="range"
        ref={ref}
        className={cn("w-full cursor-pointer", className)}
        min={min}
        max={max}
        step={step}
        value={value[0]}
        onChange={(e) => onValueChange?.([parseFloat(e.target.value)])}
        {...props}
      />
    )
  },
)
Slider.displayName = "Slider"

export { Slider }
