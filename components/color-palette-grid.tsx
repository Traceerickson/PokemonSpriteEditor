"use client"

import { useState } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Palette } from "lucide-react"
import { ColorGrid } from "@/components/color-grid"

interface ColorPaletteGridProps {
  currentColor: string
  onColorSelect: (color: string) => void
}

const palette = [
  "#000000","#808080","#C0C0C0","#FFFFFF",
  "#800000","#FF0000","#808000","#FFFF00",
  "#008000","#00FF00","#008080","#00FFFF",
  "#000080","#0000FF","#800080","#FF00FF",
  "#808040","#FFFF80","#004040","#00FF80",
  "#004080","#0080FF","#400040","#FF0080",
  "#8080FF","#80FFFF","#408080","#80FF80",
  "#404080","#8080C0","#804040","#FF8040"
]

export function ColorPaletteGrid({ currentColor, onColorSelect }: ColorPaletteGridProps) {
  const [open, setOpen] = useState(false)
  const [showCustom, setShowCustom] = useState(false)

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button size="sm" variant="outline" className="bg-slate-700 border-slate-600 text-white">
            <Palette className="w-4 h-4 mr-2" /> Color
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2 bg-slate-800 border-slate-600">
          <div className="grid grid-cols-8 gap-1 mb-1">
            {palette.map((color) => (
              <button
                key={color}
                className={`w-5 h-5 rounded border ${color === currentColor ? "border-white" : "border-slate-600"}`}
                style={{ backgroundColor: color }}
                onClick={() => {
                  onColorSelect(color)
                  setOpen(false)
                }}
              />
            ))}
            <button
              className="col-span-2 text-[10px] px-1 h-5 rounded border border-slate-600 bg-slate-700 text-white flex items-center justify-center"
              onClick={() => {
                setOpen(false)
                setShowCustom(true)
              }}
            >
              Custom…
            </button>
          </div>
        </PopoverContent>
      </Popover>
      <ColorGrid
        isOpen={showCustom}
        onClose={() => setShowCustom(false)}
        onColorSelect={onColorSelect}
        currentColor={currentColor}
      />
    </>
  )
}
