"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface ColorWheelProps {
  isOpen: boolean
  onClose: () => void
  onColorSelect: (color: string) => void
  currentColor: string
}

const commonColors = [
  "#000000",
  "#FFFFFF",
  "#FF0000",
  "#00FF00",
  "#0000FF",
  "#FFFF00",
  "#FF00FF",
  "#00FFFF",
  "#800000",
  "#008000",
  "#000080",
  "#808000",
  "#800080",
  "#008080",
  "#808080",
  "#C0C0C0",
  "#FF8080",
  "#80FF80",
  "#8080FF",
  "#FFFF80",
  "#FF80FF",
  "#80FFFF",
  "#FFA500",
  "#A52A2A",
]

export function ColorWheel({ isOpen, onClose, onColorSelect, currentColor }: ColorWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [selectedColor, setSelectedColor] = useState(currentColor)
  const [hue, setHue] = useState(0)
  const [saturation, setSaturation] = useState(100)
  const [lightness, setLightness] = useState(50)

  // Convert HSL to hex
  const hslToHex = useCallback((h: number, s: number, l: number) => {
    l /= 100
    const a = (s * Math.min(l, 1 - l)) / 100
    const f = (n: number) => {
      const k = (n + h / 30) % 12
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
      return Math.round(255 * color)
        .toString(16)
        .padStart(2, "0")
    }
    return `#${f(0)}${f(8)}${f(4)}`
  }, [])

  // Convert hex to HSL
  const hexToHsl = useCallback((hex: string) => {
    const r = Number.parseInt(hex.slice(1, 3), 16) / 255
    const g = Number.parseInt(hex.slice(3, 5), 16) / 255
    const b = Number.parseInt(hex.slice(5, 7), 16) / 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = 0
    let s = 0
    const l = (max + min) / 2

    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0)
          break
        case g:
          h = (b - r) / d + 2
          break
        case b:
          h = (r - g) / d + 4
          break
      }
      h /= 6
    }

    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]
  }, [])

  useEffect(() => {
    if (currentColor.startsWith("#")) {
      const [h, s, l] = hexToHsl(currentColor)
      setHue(h)
      setSaturation(s)
      setLightness(l)
    }
  }, [currentColor, hexToHsl])

  useEffect(() => {
    const color = hslToHex(hue, saturation, lightness)
    setSelectedColor(color)
  }, [hue, saturation, lightness, hslToHex])

  const drawColorWheel = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const radius = Math.min(centerX, centerY) - 10

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw color wheel
    for (let angle = 0; angle < 360; angle += 1) {
      const startAngle = ((angle - 1) * Math.PI) / 180
      const endAngle = (angle * Math.PI) / 180

      for (let r = 0; r < radius; r += 1) {
        const sat = (r / radius) * 100
        const hueAngle = angle

        ctx.beginPath()
        ctx.arc(centerX, centerY, r, startAngle, endAngle)
        ctx.strokeStyle = `hsl(${hueAngle}, ${sat}%, 50%)`
        ctx.stroke()
      }
    }

    // Draw current selection indicator
    const currentRadius = (saturation / 100) * radius
    const currentAngle = (hue * Math.PI) / 180
    const indicatorX = centerX + currentRadius * Math.cos(currentAngle)
    const indicatorY = centerY + currentRadius * Math.sin(currentAngle)

    ctx.beginPath()
    ctx.arc(indicatorX, indicatorY, 5, 0, 2 * Math.PI)
    ctx.strokeStyle = "#FFFFFF"
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.strokeStyle = "#000000"
    ctx.lineWidth = 1
    ctx.stroke()
  }, [hue, saturation])

  useEffect(() => {
    if (isOpen) {
      drawColorWheel()
    }
  }, [isOpen, drawColorWheel])

  const handleCanvasClick = (e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const dx = x - centerX
    const dy = y - centerY
    const distance = Math.sqrt(dx * dx + dy * dy)
    const radius = Math.min(centerX, centerY) - 10

    if (distance <= radius) {
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI
      const normalizedAngle = angle < 0 ? angle + 360 : angle
      const sat = Math.min(100, (distance / radius) * 100)

      setHue(normalizedAngle)
      setSaturation(sat)
    }
  }

  const handleConfirm = () => {
    onColorSelect(selectedColor)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-600 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-medium">Color Picker</h3>
          <Button size="sm" variant="ghost" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div className="flex gap-4">
            <canvas
              ref={canvasRef}
              width={180}
              height={180}
              className="border border-slate-600 rounded cursor-crosshair"
              onClick={handleCanvasClick}
            />

            <div className="flex flex-col gap-3 flex-1">
              <div
                className="w-full h-16 rounded border-2 border-slate-600"
                style={{ backgroundColor: selectedColor }}
              />

              <div className="space-y-2">
                <label className="text-xs text-slate-400">Lightness</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={lightness}
                  onChange={(e) => setLightness(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-slate-400">Common Colors</label>
            <div className="grid grid-cols-8 gap-1">
              {commonColors.map((color) => (
                <button
                  key={color}
                  className="w-6 h-6 rounded border border-slate-600 hover:border-slate-400"
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColor(color)}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400">Hex Color</label>
            <input
              type="text"
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm mt-1"
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
