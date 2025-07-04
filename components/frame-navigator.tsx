"use client"

import { useRef, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Play, Pause, SkipBack, SkipForward, Square } from "lucide-react"

interface Pixel {
  x: number
  y: number
  color: string
}

interface FrameNavigatorProps {
  currentFrame: number
  onFrameChange: (frame: number) => void
  frameData: { [key: number]: Pixel[] }
  canvasWidth: number
  canvasHeight: number
}

function FramePreview({
  frameIndex,
  pixels,
  isActive,
  onClick,
  canvasWidth,
  canvasHeight,
}: {
  frameIndex: number
  pixels: Pixel[]
  isActive: boolean
  onClick: () => void
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

    // Clear canvas
    ctx.clearRect(0, 0, previewSize, previewSize)

    // Draw background
    ctx.fillStyle = "#374151"
    ctx.fillRect(0, 0, previewSize, previewSize)

    // Draw pixels
    ctx.imageSmoothingEnabled = false
    pixels.forEach((pixel) => {
      ctx.fillStyle = pixel.color
      const x = Math.floor(pixel.x * scale)
      const y = Math.floor(pixel.y * scale)
      const size = Math.max(1, Math.floor(scale))
      ctx.fillRect(x, y, size, size)
    })
  }, [pixels, canvasWidth, canvasHeight])

  return (
    <div
      className={`relative cursor-pointer rounded border-2 transition-all ${
        isActive ? "border-cyan-400 bg-slate-600" : "border-slate-600 bg-slate-700 hover:border-slate-500"
      }`}
      onClick={onClick}
    >
      <canvas ref={canvasRef} width={48} height={48} className="rounded" />
      <div className="absolute bottom-1 right-1 text-xs text-white bg-black bg-opacity-50 px-1 rounded">
        {frameIndex + 1}
      </div>
    </div>
  )
}

export function FrameNavigator({
  currentFrame,
  onFrameChange,
  frameData,
  canvasWidth,
  canvasHeight,
}: FrameNavigatorProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(500) // milliseconds per frame
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const startPlayback = () => {
    if (intervalRef.current) return

    setIsPlaying(true)
    intervalRef.current = setInterval(() => {
      onFrameChange((prev) => (prev + 1) % 4)
    }, playbackSpeed)
  }

  const stopPlayback = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setIsPlaying(false)
  }

  const togglePlayback = () => {
    if (isPlaying) {
      stopPlayback()
    } else {
      startPlayback()
    }
  }

  const goToFirstFrame = () => {
    stopPlayback()
    onFrameChange(0)
  }

  const goToLastFrame = () => {
    stopPlayback()
    onFrameChange(3)
  }

  const goToPreviousFrame = () => {
    stopPlayback()
    onFrameChange((currentFrame - 1 + 4) % 4)
  }

  const goToNextFrame = () => {
    stopPlayback()
    onFrameChange((currentFrame + 1) % 4)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-medium">Animation Frames</h3>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" className="p-1" onClick={goToFirstFrame}>
            <SkipBack className="w-3 h-3" />
          </Button>
          <Button size="sm" variant="ghost" className="p-1" onClick={goToPreviousFrame}>
            <SkipBack className="w-3 h-3" />
          </Button>
          <Button size="sm" variant="ghost" className="p-1" onClick={togglePlayback}>
            {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          </Button>
          <Button size="sm" variant="ghost" className="p-1" onClick={goToNextFrame}>
            <SkipForward className="w-3 h-3" />
          </Button>
          <Button size="sm" variant="ghost" className="p-1" onClick={goToLastFrame}>
            <SkipForward className="w-3 h-3" />
          </Button>
          <Button size="sm" variant="ghost" className="p-1" onClick={stopPlayback}>
            <Square className="w-3 h-3" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {[0, 1, 2, 3].map((frameIndex) => (
          <FramePreview
            key={frameIndex}
            frameIndex={frameIndex}
            pixels={frameData[frameIndex] || []}
            isActive={currentFrame === frameIndex}
            onClick={() => {
              stopPlayback()
              onFrameChange(frameIndex)
            }}
            canvasWidth={canvasWidth}
            canvasHeight={canvasHeight}
          />
        ))}
      </div>

      <div className="space-y-2">
        <div className="text-center text-sm text-slate-400">Frame {currentFrame + 1} of 4</div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>Speed:</span>
          <input
            type="range"
            min="100"
            max="1000"
            step="100"
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
            className="flex-1"
          />
          <span>{playbackSpeed}ms</span>
        </div>
      </div>
    </div>
  )
}
