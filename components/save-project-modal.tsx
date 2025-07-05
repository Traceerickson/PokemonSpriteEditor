"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"

import type { SpriteSet } from "@/types/sprite-set"
import type { Pixel } from "@/types/pixel"
import { spriteTypes } from "@/components/battle-sprite-tabs"

interface SaveProjectModalProps {
  isOpen: boolean
  defaultName: string
  defaultTags?: string[]
  spriteSet: SpriteSet
  canvasWidth: number
  canvasHeight: number
  onCancel: () => void
  onSave: (name: string, tags: string[]) => void
}

const tagOptions = [
  "overworld",
  "battle",
  "gen1",
  "gen2",
  "gen3",
  "gen4",
  "gen5",
]

function SpritePreview({
  label,
  pixels,
  canvasWidth,
  canvasHeight,
}: {
  label: string
  pixels: Pixel[]
  canvasWidth: number
  canvasHeight: number
}) {
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
    <div className="flex flex-col items-center text-center">
      <canvas ref={canvasRef} width={48} height={48} className="rounded mb-1" />
      <span className="text-xs text-white">{label}</span>
    </div>
  )
}

export function SaveProjectModal({
  isOpen,
  defaultName,
  defaultTags = [],
  spriteSet,
  canvasWidth,
  canvasHeight,
  onCancel,
  onSave,
}: SaveProjectModalProps) {
  const [name, setName] = useState(defaultName)
  const [tags, setTags] = useState<string[]>(defaultTags)

  const toggleTag = (tag: string) => {
    setTags((t) =>
      t.includes(tag) ? t.filter((x) => x !== tag) : [...t, tag],
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-600 w-full max-w-md mx-4">
        <h3 className="text-white font-medium mb-4">Save Project</h3>
        <div className="space-y-6">
          <div>
            <label className="text-sm text-slate-400 block mb-2">Project Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>
          <div>
            <label className="text-sm text-slate-400 block mb-2">Tags</label>
            <div className="grid grid-cols-2 gap-2">
              {tagOptions.map((tag) => (
                <div key={tag} className="flex items-center space-x-2">
                  <Checkbox
                    id={tag}
                    checked={tags.includes(tag)}
                    onCheckedChange={() => toggleTag(tag)}
                  />
                  <label htmlFor={tag} className="text-white text-sm capitalize">
                    {tag}
                  </label>
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm text-slate-400 block mb-2">Preview</label>
            <div className="grid grid-cols-2 gap-2">
              {spriteTypes.map((s) => (
                <SpritePreview
                  key={s.id}
                  label={s.label}
                  pixels={spriteSet[s.id][0] || []}
                  canvasWidth={canvasWidth}
                  canvasHeight={canvasHeight}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onCancel} className="flex-1 bg-slate-700 border-slate-600 text-white">
              Cancel
            </Button>
            <Button onClick={() => onSave(name, tags)} className="flex-1 bg-green-600 hover:bg-green-700">
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
