"use client"

import { useRef, useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface Pixel {
  x: number
  y: number
  color: string
}

interface BattleSpriteTabsProps {
  frameData?: { [key: number]: Pixel[] }
  pokemonData?: any
}

const spriteTypes = [
  { id: "front", label: "Front", key: "front_default" },
  { id: "back", label: "Back", key: "back_default" },
  { id: "front-shiny", label: "Front Shiny", key: "front_shiny" },
  { id: "back-shiny", label: "Back Shiny", key: "back_shiny" },
]

function SpriteCard({
  spriteType,
  spriteUrl,
  frameData,
}: {
  spriteType: any
  spriteUrl: string | null
  frameData?: { [key: number]: Pixel[] }
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [pixelsByFrame, setPixelsByFrame] = useState<{ [key: number]: Pixel[] }>(
    frameData || { 0: [] },
  )
  const [selectedColor, setSelectedColor] = useState("#000000")
  const [canvasSize, setCanvasSize] = useState({ width: 80, height: 80 })
  const [isDrawing, setIsDrawing] = useState(false)

  // Load sprite from URL on mount
  useEffect(() => {
    const load = async () => {
      if (!spriteUrl) return
      try {
        const img = new Image()
        img.crossOrigin = "anonymous"
        await new Promise((resolve, reject) => {
          img.onload = resolve
          img.onerror = reject
          img.src = spriteUrl
        })

        const c = document.createElement("canvas")
        const ctx = c.getContext("2d")
        if (!ctx) return
        c.width = img.width
        c.height = img.height
        ctx.drawImage(img, 0, 0)
        const imageData = ctx.getImageData(0, 0, c.width, c.height)
        const pixels: Pixel[] = []
        for (let y = 0; y < c.height; y++) {
          for (let x = 0; x < c.width; x++) {
            const idx = (y * c.width + x) * 4
            const r = imageData.data[idx]
            const g = imageData.data[idx + 1]
            const b = imageData.data[idx + 2]
            const a = imageData.data[idx + 3]
            if (a > 0) {
              pixels.push({ x, y, color: `rgb(${r}, ${g}, ${b})` })
            }
          }
        }
        setCanvasSize({ width: c.width, height: c.height })
        setPixelsByFrame({ 0: pixels })
      } catch (e) {
        console.error("Failed to load sprite", e)
      }
    }
    load()
  }, [spriteUrl])

  // Draw pixels to canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const pixels = pixelsByFrame[0] || []
    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height)
    ctx.fillStyle = "#374151"
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height)
    ctx.imageSmoothingEnabled = false
    pixels.forEach((p) => {
      ctx.fillStyle = p.color
      ctx.fillRect(p.x, p.y, 1, 1)
    })

    // grid lines
    ctx.strokeStyle = "#4B5563"
    ctx.lineWidth = 0.5
    for (let x = 0; x <= canvasSize.width; x++) {
      ctx.beginPath()
      ctx.moveTo(x + 0.5, 0)
      ctx.lineTo(x + 0.5, canvasSize.height)
      ctx.stroke()
    }
    for (let y = 0; y <= canvasSize.height; y++) {
      ctx.beginPath()
      ctx.moveTo(0, y + 0.5)
      ctx.lineTo(canvasSize.width, y + 0.5)
      ctx.stroke()
    }
  }, [pixelsByFrame, canvasSize])

  const getCoords = (e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvasSize.width / rect.width
    const scaleY = canvasSize.height / rect.height
    const x = Math.floor((e.clientX - rect.left) * scaleX)
    const y = Math.floor((e.clientY - rect.top) * scaleY)
    if (x < 0 || x >= canvasSize.width || y < 0 || y >= canvasSize.height)
      return null
    return { x, y }
  }

  const drawPixel = (x: number, y: number, color: string) => {
    setPixelsByFrame((prev) => {
      const framePixels = prev[0] || []
      const filtered = framePixels.filter((p) => !(p.x === x && p.y === y))
      return { ...prev, 0: [...filtered, { x, y, color }] }
    })
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    const coords = getCoords(e)
    if (!coords) return
    drawPixel(coords.x, coords.y, selectedColor)
    setIsDrawing(true)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing) return
    const coords = getCoords(e)
    if (!coords) return
    drawPixel(coords.x, coords.y, selectedColor)
  }

  const clearCanvas = () => {
    setPixelsByFrame({ 0: [] })
  }

  return (
    <Card className="p-3 border-2 bg-slate-750 border-slate-600">
      <div className="space-y-2">
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          style={{ width: 96, height: 96, imageRendering: "pixelated" }}
          onMouseDown={handleMouseDown}
          onMouseUp={() => setIsDrawing(false)}
          onMouseLeave={() => setIsDrawing(false)}
          onMouseMove={handleMouseMove}
        />
        <div className="flex items-center justify-between">
          <span className="text-white font-medium text-sm">
            {spriteType.label} Sprite
          </span>
          <input
            type="color"
            value={selectedColor}
            onChange={(e) => setSelectedColor(e.target.value)}
            className="w-6 h-6 p-0 border-0 bg-transparent"
          />
        </div>
        <Button
          size="sm"
          variant="outline"
          className="w-full h-7 text-xs"
          onClick={clearCanvas}
        >
          Clear
        </Button>
      </div>
    </Card>
  )
}

export function BattleSpriteTabs({ frameData, pokemonData }: BattleSpriteTabsProps) {
  return (
    <div>
      <h3 className="text-white font-medium mb-4">Battle Sprites</h3>

      <div className="space-y-3">
        {spriteTypes.map((spriteType) => {
          const spriteUrl = pokemonData?.sprites?.[spriteType.key] || null

          return (
            <SpriteCard
              key={spriteType.id}
              spriteType={spriteType}
              spriteUrl={spriteUrl}
              frameData={frameData}
            />
          )
        })}
      </div>
    </div>
  )
}
