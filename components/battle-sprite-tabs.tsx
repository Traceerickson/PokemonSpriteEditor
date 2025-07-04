"use client"

import { useRef, useEffect } from "react"
import { Card } from "@/components/ui/card"
import type { SpriteSet, SpriteTypeKey } from "@/types/sprite-set"
import type { Pixel } from "@/types/pixel"

export interface BattleSpriteTabsProps {
  spriteSet: SpriteSet
  currentSprite: SpriteTypeKey
  onSpriteChange: (sprite: SpriteTypeKey) => void
  canvasWidth: number
  canvasHeight: number
}

export const spriteTypes: Array<{ id: SpriteTypeKey; label: string; key: string }> = [
  { id: "front", label: "Front", key: "front_default" },
  { id: "back", label: "Back", key: "back_default" },
  { id: "frontShiny", label: "Front Shiny", key: "front_shiny" },
  { id: "backShiny", label: "Back Shiny", key: "back_shiny" },
]

interface SpritePreviewProps {
  label: string
  pixels: Pixel[]
  active: boolean
  onClick: () => void
  canvasWidth: number
  canvasHeight: number
}

function SpritePreview({
  label,
  pixels,
  active,
  onClick,
  canvasWidth,
  canvasHeight,
}: SpritePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const previewSize = 48
    const scale = previewSize / Math.max(canvasWidth, canvasHeight)

    ctx.clearRect(0, 0, previewSize, previewSize)
    ctx.fillStyle = "#374151"
    ctx.fillRect(0, 0, previewSize, previewSize)
    ctx.imageSmoothingEnabled = false

    pixels.forEach((p) => {
      ctx.fillStyle = p.color
      const x = Math.floor(p.x * scale)
      const y = Math.floor(p.y * scale)
      const size = Math.max(1, Math.floor(scale))
      ctx.fillRect(x, y, size, size)
    })
  }, [pixels, canvasWidth, canvasHeight])

  return (
    <Card
      className={`flex items-center gap-3 p-2 cursor-pointer border-2 transition-colors ${active ? "border-cyan-400 bg-slate-600" : "border-slate-600 bg-slate-750 hover:border-slate-500"}`}
      onClick={onClick}
    >
      <canvas ref={canvasRef} width={48} height={48} className="rounded" />
      <span className="text-white text-sm flex-1">{label}</span>
    </Card>
  )
}

export function BattleSpriteTabs({
  spriteSet,
  currentSprite,
  onSpriteChange,
  canvasWidth,
  canvasHeight,
}: BattleSpriteTabsProps) {
  return (
    <div>
      <h3 className="text-white font-medium mb-4">Battle Sprites</h3>
      <div className="space-y-2">
        {spriteTypes.map((sprite) => (
          <SpritePreview
            key={sprite.id}
            label={sprite.label}
            pixels={spriteSet[sprite.id][0] || []}
            active={currentSprite === sprite.id}
            onClick={() => onSpriteChange(sprite.id)}
            canvasWidth={canvasWidth}
            canvasHeight={canvasHeight}
          />
        ))}
      </div>
    </div>
  )
}
