"use client"

import type React from "react"
import { useRef, useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"

interface SpriteCanvasProps {
  width: number
  height: number
  zoom: number
  selectedTool: string
  selectedColor?: string
  currentFrame: number
  frameData: { [key: number]: Pixel[] }
  onFrameDataChange: (frameData: { [key: number]: Pixel[] }) => void
  onZoomChange?: (zoom: number) => void
  onColorPick?: (color: string) => void
  showGrid?: boolean
  onBrushStrokeComplete?: () => void
}

interface Pixel {
  x: number
  y: number
  color: string
}

export function SpriteCanvas({
  width,
  height,
  zoom,
  selectedTool,
  selectedColor = "#000000",
  currentFrame,
  frameData,
  onFrameDataChange,
  onZoomChange,
  onColorPick,
  showGrid = true,
  onBrushStrokeComplete,
}: SpriteCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [selection, setSelection] = useState<{ start: { x: number; y: number }; end: { x: number; y: number } } | null>(
    null,
  )
  const [isSelecting, setIsSelecting] = useState(false)
  const [brushStrokeStarted, setBrushStrokeStarted] = useState(false)

  const currentPixels = frameData[currentFrame] || []

  // Start with larger grid cells (about half mouse pointer size)
  const basePixelSize = 10

  const getPixelCoords = useCallback(
    (e: React.MouseEvent) => {
      const canvas = canvasRef.current
      const container = containerRef.current
      if (!canvas || !container) return null

      const rect = canvas.getBoundingClientRect()
      const actualPixelSize = basePixelSize * zoom
      const totalGridWidth = width * actualPixelSize
      const totalGridHeight = height * actualPixelSize

      // Calculate proper offset for centering
      let offsetX = -panOffset.x
      let offsetY = -panOffset.y

      if (totalGridWidth < container.clientWidth) {
        offsetX = (container.clientWidth - totalGridWidth) / 2
      }
      if (totalGridHeight < container.clientHeight) {
        offsetY = (container.clientHeight - totalGridHeight) / 2
      }

      const x = Math.floor((e.clientX - rect.left - offsetX) / actualPixelSize)
      const y = Math.floor((e.clientY - rect.top - offsetY) / actualPixelSize)

      if (x >= 0 && x < width && y >= 0 && y < height) {
        return { x, y }
      }
      return null
    },
    [zoom, width, height, panOffset, basePixelSize],
  )

  const updateFramePixels = useCallback(
    (updater: (pixels: Pixel[]) => Pixel[], saveToHistory = false) => {
      const newFrameData = {
        ...frameData,
        [currentFrame]: updater(currentPixels),
      }
      onFrameDataChange(newFrameData)

      // Only save to history when explicitly requested (brush stroke complete)
      if (saveToHistory && onBrushStrokeComplete) {
        onBrushStrokeComplete()
      }
    },
    [frameData, currentFrame, currentPixels, onFrameDataChange, onBrushStrokeComplete],
  )

  const drawPixel = useCallback(
    (x: number, y: number, color: string, saveToHistory = false) => {
      updateFramePixels((prev) => {
        const filtered = prev.filter((p) => !(p.x === x && p.y === y))
        return [...filtered, { x, y, color }]
      }, saveToHistory)
    },
    [updateFramePixels],
  )

  const erasePixel = useCallback(
    (x: number, y: number, saveToHistory = false) => {
      updateFramePixels((prev) => prev.filter((p) => !(p.x === x && p.y === y)), saveToHistory)
    },
    [updateFramePixels],
  )

  const pickColor = useCallback(
    (x: number, y: number) => {
      const pixel = currentPixels.find((p) => p.x === x && p.y === y)
      if (pixel && onColorPick) {
        onColorPick(pixel.color)
      }
    },
    [currentPixels, onColorPick],
  )

  const floodFill = useCallback(
    (startX: number, startY: number, newColor: string) => {
      const targetPixel = currentPixels.find((p) => p.x === startX && p.y === startY)
      const targetColor = targetPixel?.color || "transparent"

      if (targetColor === newColor) return

      const visited = new Set<string>()
      const stack = [{ x: startX, y: startY }]
      const newPixels: Pixel[] = []

      while (stack.length > 0) {
        const { x, y } = stack.pop()!
        const key = `${x},${y}`

        if (visited.has(key) || x < 0 || x >= width || y < 0 || y >= height) continue

        const currentPixel = currentPixels.find((p) => p.x === x && p.y === y)
        const currentColor = currentPixel?.color || "transparent"

        if (currentColor !== targetColor) continue

        visited.add(key)
        newPixels.push({ x, y, color: newColor })

        stack.push({ x: x + 1, y }, { x: x - 1, y }, { x, y: y + 1 }, { x, y: y - 1 })
      }

      updateFramePixels((prev) => {
        const filtered = prev.filter((p) => !newPixels.some((np) => np.x === p.x && np.y === p.y))
        return [...filtered, ...newPixels]
      }, true) // Save flood fill to history immediately
    },
    [currentPixels, width, height, updateFramePixels],
  )

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const containerWidth = container.clientWidth
    const containerHeight = container.clientHeight
    const actualPixelSize = basePixelSize * zoom

    // Set canvas size to exactly match container
    canvas.width = containerWidth
    canvas.height = containerHeight
    canvas.style.width = `${containerWidth}px`
    canvas.style.height = `${containerHeight}px`

    // Clear canvas with background - fix the blackout issue
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = "#1E293B" // slate-800 background
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Calculate the total grid size
    const totalGridWidth = width * actualPixelSize
    const totalGridHeight = height * actualPixelSize

    // Center the grid in the viewport if it's smaller than the container
    let offsetX = -panOffset.x
    let offsetY = -panOffset.y

    if (totalGridWidth < containerWidth) {
      offsetX = (containerWidth - totalGridWidth) / 2
    }
    if (totalGridHeight < containerHeight) {
      offsetY = (containerHeight - totalGridHeight) / 2
    }

    // Draw grid background - ensure it's always visible
    const gridX = Math.max(0, offsetX)
    const gridY = Math.max(0, offsetY)
    const gridWidth = Math.min(totalGridWidth, containerWidth - Math.max(0, offsetX))
    const gridHeight = Math.min(totalGridHeight, containerHeight - Math.max(0, offsetY))

    if (gridWidth > 0 && gridHeight > 0) {
      ctx.fillStyle = "#374151" // slate-700 grid background
      ctx.fillRect(gridX, gridY, gridWidth, gridHeight)
    }

    // Draw grid lines - only if grid is visible and showGrid is true
    if (showGrid && gridWidth > 0 && gridHeight > 0) {
      ctx.strokeStyle = "#4B5563"
      ctx.lineWidth = 1

      // Vertical lines
      for (let x = 0; x <= width; x++) {
        const lineX = offsetX + x * actualPixelSize
        if (lineX >= 0 && lineX <= containerWidth) {
          ctx.beginPath()
          ctx.moveTo(lineX, Math.max(0, offsetY))
          ctx.lineTo(lineX, Math.min(containerHeight, offsetY + totalGridHeight))
          ctx.stroke()
        }
      }

      // Horizontal lines
      for (let y = 0; y <= height; y++) {
        const lineY = offsetY + y * actualPixelSize
        if (lineY >= 0 && lineY <= containerHeight) {
          ctx.beginPath()
          ctx.moveTo(Math.max(0, offsetX), lineY)
          ctx.lineTo(Math.min(containerWidth, offsetX + totalGridWidth), lineY)
          ctx.stroke()
        }
      }
    }

    // Draw pixels for current frame - ensure they're always visible
    currentPixels.forEach((pixel) => {
      const pixelX = offsetX + pixel.x * actualPixelSize
      const pixelY = offsetY + pixel.y * actualPixelSize

      // Only draw pixels that are visible and within bounds
      if (
        pixelX + actualPixelSize > 0 &&
        pixelX < containerWidth &&
        pixelY + actualPixelSize > 0 &&
        pixelY < containerHeight &&
        pixelX >= offsetX &&
        pixelY >= offsetY
      ) {
        ctx.fillStyle = pixel.color
        ctx.fillRect(pixelX + 1, pixelY + 1, actualPixelSize - 2, actualPixelSize - 2)
      }
    })

    // Draw selection rectangle
    if (selection) {
      ctx.strokeStyle = "#00FFFF"
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      const selStartX = Math.min(selection.start.x, selection.end.x) * actualPixelSize - offsetX
      const selStartY = Math.min(selection.start.y, selection.end.y) * actualPixelSize - offsetY
      const selEndX = Math.max(selection.start.x, selection.end.x) * actualPixelSize + actualPixelSize - offsetX
      const selEndY = Math.max(selection.start.y, selection.end.y) * actualPixelSize + actualPixelSize - offsetY

      // Only draw selection if it's visible
      if (selEndX > 0 && selStartX < containerWidth && selEndY > 0 && selStartY < containerHeight) {
        ctx.strokeRect(
          Math.max(0, selStartX),
          Math.max(0, selStartY),
          Math.min(containerWidth - Math.max(0, selStartX), selEndX - selStartX),
          Math.min(containerHeight - Math.max(0, selStartY), selEndY - selStartY),
        )
      }
      ctx.setLineDash([])
    }
  }, [currentPixels, selection, width, height, zoom, panOffset, basePixelSize, showGrid])

  useEffect(() => {
    redrawCanvas()
  }, [redrawCanvas])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const container = containerRef.current
      if (!container) return

      const step = basePixelSize * zoom
      const totalGridWidth = width * basePixelSize * zoom
      const totalGridHeight = height * basePixelSize * zoom
      const maxPanX = Math.max(0, totalGridWidth - container.clientWidth)
      const maxPanY = Math.max(0, totalGridHeight - container.clientHeight)

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault()
          setPanOffset((prev) => ({ ...prev, y: Math.max(0, prev.y - step) }))
          break
        case "ArrowDown":
          e.preventDefault()
          setPanOffset((prev) => ({ ...prev, y: Math.min(maxPanY, prev.y + step) }))
          break
        case "ArrowLeft":
          e.preventDefault()
          setPanOffset((prev) => ({ ...prev, x: Math.max(0, prev.x - step) }))
          break
        case "ArrowRight":
          e.preventDefault()
          setPanOffset((prev) => ({ ...prev, x: Math.min(maxPanX, prev.x + step) }))
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [zoom, width, height, basePixelSize])

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.shiftKey) {
      setIsPanning(true)
      setPanStart({ x: e.clientX + panOffset.x, y: e.clientY + panOffset.y })
      return
    }

    const coords = getPixelCoords(e)
    if (!coords) return

    if (selectedTool === "eyedropper") {
      pickColor(coords.x, coords.y)
      return
    }

    if (selectedTool === "select") {
      setIsSelecting(true)
      setSelection({ start: coords, end: coords })
    } else {
      setIsDrawing(true)
      setBrushStrokeStarted(true)

      if (selectedTool === "pencil") {
        drawPixel(coords.x, coords.y, selectedColor)
      } else if (selectedTool === "eraser") {
        erasePixel(coords.x, coords.y)
      } else if (selectedTool === "bucket") {
        floodFill(coords.x, coords.y, selectedColor)
      }
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      const container = containerRef.current
      if (!container) return

      const totalGridWidth = width * basePixelSize * zoom
      const totalGridHeight = height * basePixelSize * zoom
      const maxPanX = Math.max(0, totalGridWidth - container.clientWidth)
      const maxPanY = Math.max(0, totalGridHeight - container.clientHeight)

      const newX = Math.max(0, Math.min(maxPanX, panStart.x - e.clientX))
      const newY = Math.max(0, Math.min(maxPanY, panStart.y - e.clientY))
      setPanOffset({ x: newX, y: newY })
      return
    }

    const coords = getPixelCoords(e)
    if (!coords) return

    if (isSelecting && selection) {
      setSelection((prev) => (prev ? { ...prev, end: coords } : null))
    } else if (isDrawing) {
      if (selectedTool === "pencil") {
        drawPixel(coords.x, coords.y, selectedColor)
      } else if (selectedTool === "eraser") {
        erasePixel(coords.x, coords.y)
      }
    }
  }

  const handleMouseUp = () => {
    // Save brush stroke to history when mouse is released
    if (brushStrokeStarted && onBrushStrokeComplete) {
      onBrushStrokeComplete()
      setBrushStrokeStarted(false)
    }

    setIsDrawing(false)
    setIsSelecting(false)
    setIsPanning(false)
  }

  const handleWheel = (e: React.WheelEvent) => {
    if (e.shiftKey) {
      e.preventDefault()
      const container = containerRef.current
      if (!container) return

      const totalGridWidth = width * basePixelSize * zoom
      const totalGridHeight = height * basePixelSize * zoom
      const maxPanX = Math.max(0, totalGridWidth - container.clientWidth)
      const maxPanY = Math.max(0, totalGridHeight - container.clientHeight)

      const deltaX = e.deltaX || e.deltaY
      const deltaY = e.deltaY

      setPanOffset((prev) => ({
        x: Math.max(0, Math.min(maxPanX, prev.x + deltaX)),
        y: Math.max(0, Math.min(maxPanY, prev.y + deltaY)),
      }))
    }
  }

  const getCursorStyle = () => {
    if (isPanning) return "grabbing"
    switch (selectedTool) {
      case "pencil":
        return "crosshair"
      case "eraser":
        return "grab"
      case "bucket":
        return "pointer"
      case "select":
        return "crosshair"
      case "eyedropper":
        return "crosshair"
      default:
        return "default"
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 w-48">
          <Slider
            min={0.5}
            max={3}
            step={0.1}
            value={[zoom]}
            onValueChange={(v) => onZoomChange?.(v[0])}
          />
          <span className="text-sm text-slate-400 w-14 text-right">
            {Math.round(zoom * 100)}%
          </span>
        </div>
        <div className="text-xs text-slate-500">Shift+Drag to pan • Shift+Scroll to pan • Arrow keys to navigate</div>
      </div>
      <div ref={containerRef} className="flex-1 overflow-hidden border border-slate-600 rounded bg-slate-700">
        <canvas
          ref={canvasRef}
          className="block"
          style={{ cursor: getCursorStyle() }}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => {
            if (brushStrokeStarted && onBrushStrokeComplete) {
              onBrushStrokeComplete()
              setBrushStrokeStarted(false)
            }
            setIsDrawing(false)
            setIsSelecting(false)
            setIsPanning(false)
          }}
          onWheel={handleWheel}
        />
      </div>
    </div>
  )
}
