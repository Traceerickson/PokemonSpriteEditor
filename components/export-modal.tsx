"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { X, Download } from "lucide-react"

interface Pixel {
  x: number
  y: number
  color: string
}

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  frameData: { [key: number]: Pixel[] }
  canvasWidth: number
  canvasHeight: number
}

export function ExportModal({ isOpen, onClose, frameData, canvasWidth, canvasHeight }: ExportModalProps) {
  const [selectedSprites, setSelectedSprites] = useState({
    front: true,
    back: false,
    frontShiny: false,
    backShiny: false,
  })
  const [selectedFrames, setSelectedFrames] = useState({
    frame1: true,
    frame2: true,
    frame3: true,
    frame4: true,
  })
  const [exportFormat, setExportFormat] = useState<"individual" | "spritesheet">("spritesheet")

  const handleSpriteToggle = (sprite: keyof typeof selectedSprites) => {
    setSelectedSprites((prev) => ({ ...prev, [sprite]: !prev[sprite] }))
  }

  const handleFrameToggle = (frame: keyof typeof selectedFrames) => {
    setSelectedFrames((prev) => ({ ...prev, [frame]: !prev[frame] }))
  }

  const exportFrameAsPNG = (frameIndex: number, filename: string) => {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = canvasWidth
    canvas.height = canvasHeight

    // Clear with transparent background
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw pixels
    const pixels = frameData[frameIndex] || []
    pixels.forEach((pixel) => {
      ctx.fillStyle = pixel.color
      ctx.fillRect(pixel.x, pixel.y, 1, 1)
    })

    // Download
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = filename
        link.click()
        URL.revokeObjectURL(url)
      }
    }, "image/png")
  }

  const exportSpriteSheet = () => {
    // Get all frames that have pixel data
    const framesWithData = Object.entries(selectedFrames)
      .filter(([_, selected]) => selected)
      .map(([frame, _]) => Number.parseInt(frame.replace("frame", "")) - 1)
      .filter((frameIndex) => {
        const pixels = frameData[frameIndex] || []
        return pixels.length > 0 // Only include frames with actual pixel data
      })

    if (framesWithData.length === 0) {
      // If no frames have data, export all selected frames anyway
      const allSelectedFrames = Object.entries(selectedFrames)
        .filter(([_, selected]) => selected)
        .map(([frame, _]) => Number.parseInt(frame.replace("frame", "")) - 1)

      if (allSelectedFrames.length === 0) return

      exportFramesAsSpriteSheet(allSelectedFrames)
      return
    }

    exportFramesAsSpriteSheet(framesWithData)
  }

  const exportFramesAsSpriteSheet = (frameIndices: number[]) => {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Calculate sprite sheet dimensions - arrange in a row for animation
    const cols = frameIndices.length
    const rows = 1

    canvas.width = canvasWidth * cols
    canvas.height = canvasHeight * rows

    // Clear with transparent background
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw each frame
    frameIndices.forEach((frameIndex, i) => {
      const offsetX = i * canvasWidth
      const offsetY = 0

      const pixels = frameData[frameIndex] || []
      pixels.forEach((pixel) => {
        ctx.fillStyle = pixel.color
        ctx.fillRect(offsetX + pixel.x, offsetY + pixel.y, 1, 1)
      })
    })

    // Download
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = "sprite-sheet.png"
        link.click()
        URL.revokeObjectURL(url)
      }
    }, "image/png")
  }

  const handleExport = () => {
    if (exportFormat === "spritesheet") {
      exportSpriteSheet()
    } else {
      // Export individual frames - only frames with pixel data
      Object.entries(selectedFrames).forEach(([frame, selected]) => {
        if (selected) {
          const frameIndex = Number.parseInt(frame.replace("frame", "")) - 1
          const pixels = frameData[frameIndex] || []
          if (pixels.length > 0) {
            // Only export frames with pixel data
            exportFrameAsPNG(frameIndex, `frame-${frameIndex + 1}.png`)
          }
        }
      })
    }
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-600 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-medium">Export Sprites</h3>
          <Button size="sm" variant="ghost" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-6">
          {/* Export Format */}
          <div>
            <label className="text-sm text-slate-400 block mb-2">Export Format</label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="spritesheet"
                  name="format"
                  checked={exportFormat === "spritesheet"}
                  onChange={() => setExportFormat("spritesheet")}
                  className="text-cyan-500"
                />
                <label htmlFor="spritesheet" className="text-white text-sm">
                  Sprite Sheet
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="individual"
                  name="format"
                  checked={exportFormat === "individual"}
                  onChange={() => setExportFormat("individual")}
                  className="text-cyan-500"
                />
                <label htmlFor="individual" className="text-white text-sm">
                  Individual Frames
                </label>
              </div>
            </div>
          </div>

          {/* Frame Selection */}
          <div>
            <label className="text-sm text-slate-400 block mb-2">Frames to Export</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(selectedFrames).map(([frame, selected]) => (
                <div key={frame} className="flex items-center space-x-2">
                  <Checkbox
                    id={frame}
                    checked={selected}
                    onCheckedChange={() => handleFrameToggle(frame as keyof typeof selectedFrames)}
                  />
                  <label htmlFor={frame} className="text-white text-sm">
                    Frame {frame.replace("frame", "")}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Sprite Types */}
          <div>
            <label className="text-sm text-slate-400 block mb-2">Sprite Types</label>
            <div className="space-y-2">
              {Object.entries(selectedSprites).map(([sprite, selected]) => (
                <div key={sprite} className="flex items-center space-x-2">
                  <Checkbox
                    id={sprite}
                    checked={selected}
                    onCheckedChange={() => handleSpriteToggle(sprite as keyof typeof selectedSprites)}
                  />
                  <label htmlFor={sprite} className="text-white text-sm">
                    {sprite === "front" && "Front Sprite"}
                    {sprite === "back" && "Back Sprite"}
                    {sprite === "frontShiny" && "Front Shiny"}
                    {sprite === "backShiny" && "Back Shiny"}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1 bg-slate-700 border-slate-600 text-white">
              Cancel
            </Button>
            <Button onClick={handleExport} className="flex-1 bg-green-600 hover:bg-green-700">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
