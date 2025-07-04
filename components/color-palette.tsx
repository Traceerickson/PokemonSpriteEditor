"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronDown, Palette } from "lucide-react"

const defaultColors = [
  "#000000",
  "#FFFFFF",
  "#FF0000",
  "#00FF00",
  "#0000FF",
  "#FFFF00",
  "#FF00FF",
  "#00FFFF",
  "#808080",
  "#800000",
  "#008000",
  "#000080",
  "#808000",
  "#800080",
  "#008080",
  "#C0C0C0",
]

export function ColorPalette({ onColorChange }: { onColorChange?: (color: string) => void }) {
  const [selectedColor, setSelectedColor] = useState("#000000")
  const [isExpanded, setIsExpanded] = useState(true)

  const handleColorSelect = (color: string) => {
    setSelectedColor(color)
    onColorChange?.(color)
  }

  return (
    <div>
      <Button
        variant="ghost"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full justify-between text-white hover:bg-slate-700 mb-3"
      >
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-cyan-400" />
          Color Palette
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
      </Button>

      {isExpanded && (
        <div className="grid grid-cols-4 gap-2">
          {defaultColors.map((color) => (
            <button
              key={color}
              className={`w-8 h-8 rounded border-2 ${selectedColor === color ? "border-cyan-400" : "border-slate-600"}`}
              style={{ backgroundColor: color }}
              onClick={() => handleColorSelect(color)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
