"use client"

import { useRef, useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Loader2 } from "lucide-react"

interface Pixel {
  x: number
  y: number
  color: string
}

interface BattleSpriteTabsProps {
  frameData?: { [key: number]: Pixel[] }
  pokemonData?: any
  gameVersion?: any
  onLoadSprite?: (spriteData: any, spriteType: string) => void
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
  pokemonData,
  gameVersion,
  onLoadSprite,
  frameData,
}: {
  spriteType: any
  spriteUrl: string | null
  pokemonData?: any
  gameVersion?: any
  onLoadSprite?: (spriteData: any, spriteType: string) => void
  frameData?: { [key: number]: Pixel[] }
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [imageError, setImageError] = useState(false)

  // Get frame 1 data (index 0) for previews if no sprite URL
  const frame1Pixels = frameData?.[0] || []

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const previewSize = 80

    // Clear canvas
    ctx.clearRect(0, 0, previewSize, previewSize)
    ctx.fillStyle = "#374151"
    ctx.fillRect(0, 0, previewSize, previewSize)

    // If we have a sprite URL, try to load it
    if (spriteUrl && !imageError) {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = () => {
        const scale = previewSize / Math.max(img.width, img.height)
        const scaledWidth = img.width * scale
        const scaledHeight = img.height * scale
        const offsetX = (previewSize - scaledWidth) / 2
        const offsetY = (previewSize - scaledHeight) / 2

        ctx.imageSmoothingEnabled = false
        ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight)
      }
      img.onerror = () => setImageError(true)
      img.src = spriteUrl
    } else if (frame1Pixels.length > 0) {
      // Fallback to frame data if available
      const scale = previewSize / Math.max(80, 80) // Assume 80x80 default
      ctx.imageSmoothingEnabled = false
      frame1Pixels.forEach((pixel) => {
        ctx.fillStyle = pixel.color
        const x = Math.floor(pixel.x * scale)
        const y = Math.floor(pixel.y * scale)
        const size = Math.max(1, Math.floor(scale))
        ctx.fillRect(x, y, size, size)
      })
    }
  }, [spriteUrl, frame1Pixels, imageError])

  const handleLoadSprite = async () => {
    if (!spriteUrl || !onLoadSprite || isLoading) return

    setIsLoading(true)
    try {
      // Load the sprite and convert to pixel data
      const img = new Image()
      img.crossOrigin = "anonymous"

      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
        img.src = spriteUrl
      })

      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("Could not get canvas context")

      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const pixels = []

      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const index = (y * canvas.width + x) * 4
          const r = imageData.data[index]
          const g = imageData.data[index + 1]
          const b = imageData.data[index + 2]
          const a = imageData.data[index + 3]

          if (a > 0) {
            const color = `rgb(${r}, ${g}, ${b})`
            pixels.push({ x, y, color })
          }
        }
      }

      const spriteData = {
        id: `${pokemonData?.name || "sprite"}-${spriteType.id}`,
        name: `${pokemonData?.name || "Sprite"} ${spriteType.label}`,
        category: "Battle Sprite",
        description: `${spriteType.label} sprite`,
        size: `${canvas.width}x${canvas.height}`,
        pixels: pixels,
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        pokemonData: pokemonData,
        gameVersion: gameVersion,
      }

      onLoadSprite(spriteData, spriteType.id)
    } catch (error) {
      console.error("Failed to load sprite:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className={`p-3 cursor-pointer transition-all border-2 bg-slate-750 border-slate-600 hover:border-slate-500`}>
      <div className="space-y-2">
        <div className="w-full h-20 bg-slate-600 rounded flex items-center justify-center relative overflow-hidden">
          {spriteUrl && !imageError ? (
            <img
              src={spriteUrl || "/placeholder.svg"}
              alt={spriteType.label}
              className="max-w-full max-h-full object-contain pixelated"
              style={{ imageRendering: "pixelated" }}
              onError={() => setImageError(true)}
            />
          ) : (
            <canvas ref={canvasRef} width={80} height={80} className="rounded" />
          )}
        </div>
        <div className="text-center">
          <span className="text-white font-medium text-sm">{spriteType.label}</span>
        </div>
        {spriteUrl && !imageError && onLoadSprite && (
          <Button
            size="sm"
            variant="outline"
            className="w-full bg-green-600 border-green-600 text-white hover:bg-green-700 disabled:opacity-50 h-7 text-xs"
            onClick={handleLoadSprite}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
                Loading...
              </>
            ) : (
              <>
                <Download className="w-3 h-3 mr-1" />
                Load
              </>
            )}
          </Button>
        )}
      </div>
    </Card>
  )
}

export function BattleSpriteTabs({ frameData, pokemonData, gameVersion, onLoadSprite }: BattleSpriteTabsProps) {
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
              pokemonData={pokemonData}
              gameVersion={gameVersion}
              onLoadSprite={onLoadSprite}
              frameData={frameData}
            />
          )
        })}
      </div>
    </div>
  )
}
