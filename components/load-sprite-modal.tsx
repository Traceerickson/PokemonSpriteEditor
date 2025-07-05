"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import type { SpriteTypeKey } from "@/types/sprite-set"

interface LoadSpriteModalProps {
  isOpen: boolean
  availableTypes: Partial<Record<SpriteTypeKey, boolean>>
  onCancel: () => void
  onConfirm: (selectedTypes: SpriteTypeKey[], selectedFrames: number[]) => void
}

export function LoadSpriteModal({
  isOpen,
  availableTypes,
  onCancel,
  onConfirm,
}: LoadSpriteModalProps) {
  const [types, setTypes] = useState<Record<SpriteTypeKey, boolean>>({
    front: false,
    back: false,
    frontShiny: false,
    backShiny: false,
  })

  const [frames, setFrames] = useState<Record<number, boolean>>({
    0: false,
    1: false,
    2: false,
    3: false,
  })

  const toggleType = (type: SpriteTypeKey) => {
    setTypes((prev) => ({ ...prev, [type]: !prev[type] }))
  }

  const toggleFrame = (frame: number) => {
    setFrames((prev) => ({ ...prev, [frame]: !prev[frame] }))
  }

  const selectedTypes = Object.entries(types)
    .filter(([t, v]) => v && availableTypes[t as SpriteTypeKey])
    .map(([t]) => t as SpriteTypeKey)

  const selectedFrames = Object.entries(frames)
    .filter(([_, v]) => v)
    .map(([f]) => Number(f))

  const confirmDisabled = selectedTypes.length === 0 || selectedFrames.length === 0

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-600 w-full max-w-md mx-4">
        <h3 className="text-white font-medium mb-4">Load Sprite</h3>
        <div className="space-y-6">
          <div>
            <label className="text-sm text-slate-400 block mb-2">Sprite Types</label>
            <div className="space-y-2">
              {(Object.keys(types) as SpriteTypeKey[]).map((key) => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={key}
                    checked={types[key]}
                    disabled={!availableTypes[key]}
                    onCheckedChange={() => toggleType(key)}
                  />
                  <label htmlFor={key} className="text-white text-sm capitalize">
                    {key === "front" && "Front"}
                    {key === "back" && "Back"}
                    {key === "frontShiny" && "Shiny Front"}
                    {key === "backShiny" && "Shiny Back"}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-400 block mb-2">Frames</label>
            <div className="grid grid-cols-2 gap-2">
              {[0, 1, 2, 3].map((f) => (
                <div key={f} className="flex items-center space-x-2">
                  <Checkbox
                    id={`frame${f}`}
                    checked={frames[f]}
                    onCheckedChange={() => toggleFrame(f)}
                  />
                  <label htmlFor={`frame${f}`} className="text-white text-sm">
                    Frame {f + 1}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onCancel} className="flex-1 bg-slate-700 border-slate-600 text-white">
              Cancel
            </Button>
            <Button
              onClick={() => onConfirm(selectedTypes, selectedFrames)}
              disabled={confirmDisabled}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              Confirm
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
