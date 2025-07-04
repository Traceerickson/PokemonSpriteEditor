"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface ColorGridProps {
  isOpen: boolean
  onClose: () => void
  onColorSelect: (color: string) => void
  currentColor: string
}

// Generate a comprehensive color grid
const generateColorGrid = () => {
  const colors = []

  // Grayscale
  for (let i = 0; i <= 15; i++) {
    const value = Math.round((i / 15) * 255)
    colors.push(`rgb(${value}, ${value}, ${value})`)
  }

  // Color spectrum
  const hues = [
    0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180, 195, 210, 225, 240, 255, 270, 285, 300, 315, 330, 345,
  ]
  const saturations = [100, 75, 50, 25]
  const lightnesses = [90, 75, 60, 45, 30, 15]

  for (const lightness of lightnesses) {
    for (const saturation of saturations) {
      for (const hue of hues) {
        colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`)
      }
    }
  }

  return colors
}

const colorGrid = generateColorGrid()

export function ColorGrid({ isOpen, onClose, onColorSelect, currentColor }: ColorGridProps) {
  const [selectedColor, setSelectedColor] = useState(currentColor)
  const [customColor, setCustomColor] = useState(currentColor)

  const handleColorClick = (color: string) => {
    setSelectedColor(color)
    setCustomColor(color)
  }

  const handleConfirm = () => {
    onColorSelect(selectedColor)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-600 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-medium">Color Picker</h3>
          <Button size="sm" variant="ghost" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-4">
          {/* Current Color Preview */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded border-2 border-slate-600" style={{ backgroundColor: selectedColor }} />
            <div className="flex-1">
              <label className="text-xs text-slate-400 block mb-1">Custom Color</label>
              <input
                type="color"
                value={customColor}
                onChange={(e) => {
                  setCustomColor(e.target.value)
                  setSelectedColor(e.target.value)
                }}
                className="w-full h-8 bg-slate-700 border border-slate-600 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Color Grid */}
          <div>
            <label className="text-xs text-slate-400 block mb-2">Color Palette</label>
            <div className="grid grid-cols-24 gap-1 max-h-64 overflow-y-auto">
              {colorGrid.map((color, index) => (
                <button
                  key={index}
                  className={`w-4 h-4 rounded border ${
                    selectedColor === color ? "border-white border-2" : "border-slate-600"
                  } hover:border-slate-400 transition-all`}
                  style={{ backgroundColor: color }}
                  onClick={() => handleColorClick(color)}
                  title={color}
                />
              ))}
            </div>
          </div>

          {/* Hex Input */}
          <div>
            <label className="text-xs text-slate-400 block mb-1">Hex Color</label>
            <input
              type="text"
              value={selectedColor.startsWith("#") ? selectedColor : customColor}
              onChange={(e) => {
                setCustomColor(e.target.value)
                setSelectedColor(e.target.value)
              }}
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm"
              placeholder="#000000"
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1 bg-slate-700 border-slate-600 text-white">
              Cancel
            </Button>
            <Button onClick={handleConfirm} className="flex-1 bg-cyan-600 hover:bg-cyan-700">
              Select
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
