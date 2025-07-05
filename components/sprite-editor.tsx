"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { Slider } from "@/components/ui/slider"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
  Download,
  Upload,
  Brush,
  RotateCw,
  Eye,
  Undo,
  Redo,
  Grid3X3,
  Eraser,
  PaintBucket,
  Square,
  Palette,
  Droplet,
  SaveIcon,
  FolderOpen,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Cloud,
  Loader2,
} from "lucide-react"
import { SpriteCanvas } from "@/components/sprite-canvas"
import { BattleSpriteTabs, spriteTypes } from "@/components/battle-sprite-tabs"
import { FrameNavigator } from "@/components/frame-navigator"
import { ColorPaletteGrid } from "@/components/color-palette-grid"
import { ExportModal } from "@/components/export-modal"
import { SaveProjectModal } from "@/components/save-project-modal"
import { LoginRequiredModal } from "@/components/login-required-modal"
import { UnsavedChangesModal } from "@/components/unsaved-changes-modal"
import { useUndoRedo } from "@/hooks/use-undo-redo"
import type { Pixel } from "@/types/pixel"
import type { SpriteSet, SpriteTypeKey, FrameData } from "@/types/sprite-set"
import { useSpriteStore } from "@/contexts/sprite-store"

interface SpriteEditorProps {
  project: any
  onNewProject: () => void
  onPageChange: (page: "studio" | "projects" | "stencils") => void
}

export function SpriteEditor({ project, onNewProject, onPageChange }: SpriteEditorProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const { store, setCurrentSpriteType: setStoreSpriteType, setCurrentFrame: setStoreFrame, updateFrame, replaceStore, setZoom: setStoreZoom } = useSpriteStore()
  const [selectedTool, setSelectedTool] = useState("pencil")
  const [zoom, setZoom] = useState(store.zoom)
  const [canvasSize] = useState({
    width: project?.dimensions?.width || 80,
    height: project?.dimensions?.height || 80,
  })
  const [selectedColor, setSelectedColor] = useState("#000000")
  const [currentFrame, setCurrentFrame] = useState(store.currentFrame)
  const [showGrid, setShowGrid] = useState(true)
  const [showExportModal, setShowExportModal] = useState(false)
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false)
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showUnsavedModal, setShowUnsavedModal] = useState(false)
  const [lastSaved, setLastSaved] = useState<SpriteSet | null>(null)
  const [hasUnsaved, setHasUnsaved] = useState(false)

  const handleNewProjectClick = () => {
    if (hasUnsaved) {
      pendingPage.current = "new"
      setShowUnsavedModal(true)
    } else {
      onNewProject()
    }
  }

  const handleNavigate = (page: "studio" | "projects" | "stencils") => {
    if (hasUnsaved) {
      setShowUnsavedModal(true)
      pendingPage.current = page
    } else {
      onPageChange(page)
    }
  }

  const pendingPage = useRef<"studio" | "projects" | "stencils" | "new" | null>(null)

  const handleUnsavedCancel = () => {
    setShowUnsavedModal(false)
    pendingPage.current = null
  }

  const handleUnsavedDiscard = () => {
    setShowUnsavedModal(false)
    if (pendingPage.current) {
      setHasUnsaved(false)
      if (pendingPage.current === "new") {
        onNewProject()
      } else {
        onPageChange(pendingPage.current)
      }
      pendingPage.current = null
    } else {
      setHasUnsaved(false)
      onNewProject()
    }
  }

  const handleUnsavedSave = () => {
    setShowUnsavedModal(false)
    setShowSaveModal(true)
  }

  const createEmptyFrames = (): FrameData => ({ 0: [], 1: [], 2: [], 3: [] })

  // Initialize sprite set with stencil data if available
  const getInitialSpriteSet = (): SpriteSet => {
    const blank: SpriteSet = {
      front: createEmptyFrames(),
      back: createEmptyFrames(),
      frontShiny: createEmptyFrames(),
      backShiny: createEmptyFrames(),
    }

    if (project?.spriteSet) {
      return {
        front: project.spriteSet.front || createEmptyFrames(),
        back: project.spriteSet.back || createEmptyFrames(),
        frontShiny: project.spriteSet.frontShiny || createEmptyFrames(),
        backShiny: project.spriteSet.backShiny || createEmptyFrames(),
      }
    }

    if (project?.isAnimated && project?.animatedFrames) {
      blank.front = project.animatedFrames
      return blank
    }

    if (project?.stencilData?.pixels) {
      const type = (project?.spriteType as SpriteTypeKey) || "front"
      blank[type][0] = project.stencilData.pixels
    }

    return blank
  }

  // Undo/Redo system
  const initialSpriteSet: SpriteSet = {
    front: store.front,
    back: store.back,
    frontShiny: store.frontShiny,
    backShiny: store.backShiny,
  }

  const {
    state: spriteSet,
    set: setSpriteSet,
    reset: resetSpriteSet,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useUndoRedo<SpriteSet>(initialSpriteSet)

  const [currentSpriteType, setCurrentSpriteType] = useState<SpriteTypeKey>(
    store.currentSpriteType,
  )

  const frameData = spriteSet[currentSpriteType]

  // track unsaved changes
  useEffect(() => {
    if (!lastSaved) {
      setLastSaved(spriteSet)
      return
    }
    if (JSON.stringify(spriteSet) !== JSON.stringify(lastSaved)) {
      setHasUnsaved(true)
    }
  }, [spriteSet, lastSaved])

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsaved) {
        e.preventDefault()
        e.returnValue = ""
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [hasUnsaved])

  // Load stencil data when project changes
  useEffect(() => {

    if (project?.stencilData?.pixels || project?.animatedFrames) {
      const initial = getInitialSpriteSet()
      resetSpriteSet(initial)
      const type = (project?.spriteType as SpriteTypeKey) || "front"
      setCurrentSpriteType(type)
      replaceStore({
        front: initial.front,
        back: initial.back,
        frontShiny: initial.frontShiny,
        backShiny: initial.backShiny,
        currentSpriteType: type,
        currentFrame,
        zoom,
      })

    }
  }, [project, resetSpriteSet, replaceStore, currentFrame])

  // Load Pokemon battle sprites if available
  useEffect(() => {
    const loadSprites = async () => {
      if (!project?.pokemonData?.sprites) return

      const urls = spriteTypes.map((s) => project.pokemonData.sprites[s.key])
      const loaded: SpriteSet = {
        front: createEmptyFrames(),
        back: createEmptyFrames(),
        frontShiny: createEmptyFrames(),
        backShiny: createEmptyFrames(),
      }

      for (let i = 0; i < urls.length; i++) {
        const url = urls[i]
        if (!url) {
          loaded[i] = []
          continue
        }
        try {
          const img = new Image()
          img.crossOrigin = "anonymous"
          await new Promise((res, rej) => {
            img.onload = res
            img.onerror = rej
            img.src = url
          })

          const c = document.createElement("canvas")
          const ctx = c.getContext("2d")
          if (!ctx) continue
          c.width = img.width
          c.height = img.height
          ctx.drawImage(img, 0, 0)
          const imageData = ctx.getImageData(0, 0, c.width, c.height)
          const data = imageData.data
          const width = imageData.width
          const height = imageData.height
          const pixels: Pixel[] = []
          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              const idx = (y * width + x) * 4
              const r = data[idx]
              const g = data[idx + 1]
              const b = data[idx + 2]
              const a = data[idx + 3]
              if (a > 0) {
                pixels.push({ x, y, color: `rgb(${r}, ${g}, ${b})` })
              }
            }
          }
          const key = spriteTypes[i].id
          loaded[key][0] = pixels
        } catch (e) {
          console.error("Failed to load sprite", e)
          // keep empty frame
        }
      }

      resetSpriteSet(loaded)
      const type = (project?.spriteType as SpriteTypeKey) || "front"
      setCurrentSpriteType(type)
      setCurrentFrame(0)
      replaceStore({
        front: loaded.front,
        back: loaded.back,
        frontShiny: loaded.frontShiny,
        backShiny: loaded.backShiny,
        currentSpriteType: type,
        currentFrame: 0,
        zoom,
      })
    }

    loadSprites()
  }, [project?.pokemonData, resetSpriteSet, replaceStore])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case "z":
            e.preventDefault()
            if (e.shiftKey) {
              redo()
            } else {
              undo()
            }
            break
          case "y":
            e.preventDefault()
            redo()
            break
          case "s":
            e.preventDefault()
            setShowSaveModal(true)
            break
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [undo, redo])

  const handleFrameDataChange = useCallback(
    (newFrameData: FrameData) => {
      setSpriteSet({ ...spriteSet, [currentSpriteType]: newFrameData })
      updateFrame(newFrameData[currentFrame] || [])
    },
    [setSpriteSet, spriteSet, currentSpriteType, updateFrame, currentFrame],
  )

  const handleBrushStrokeComplete = useCallback(() => {
    // This will be called when a brush stroke is complete
    // The undo system will automatically save the current state
  }, [])

  const handleRotateFrame = () => {
    const currentPixels = frameData[currentFrame] || []
    const rotatedPixels = currentPixels.map((pixel) => ({
      ...pixel,
      x: canvasSize.height - 1 - pixel.y,
      y: pixel.x,
    }))

    const newFrameData = {
      ...frameData,
      [currentFrame]: rotatedPixels,
    }
    setSpriteSet({ ...spriteSet, [currentSpriteType]: newFrameData })
    updateFrame(rotatedPixels)
  }

  const exportSpriteSheet = () => {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Get frames that have pixel data
    const framesWithData = [] as number[]
    for (let i = 0; i < 4; i++) {
      const pixels = frameData[i] || []
      if (pixels.length > 0) {
        framesWithData.push(i)
      }
    }

    // If no frames have data, export frame 0 anyway
    if (framesWithData.length === 0) {
      framesWithData.push(0)
    }

    // Arrange frames in a horizontal row for animation
    const cols = framesWithData.length
    canvas.width = canvasSize.width * cols
    canvas.height = canvasSize.height

    // Clear with transparent background
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw each frame with data
    framesWithData.forEach((frameIndex, i) => {
      const offsetX = i * canvasSize.width
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
        link.download = `${project?.name || "sprite"}-sheet.png`
        link.click()
        URL.revokeObjectURL(url)
      }
    }, "image/png")
  }

  const handleSaveToCloud = async (name: string, tags: string[]) => {
    if (!session?.user?.id) {
      setShowLoginModal(true)
      return
    }

    setIsSaving(true)
    try {
      const projectData = {
        name: name || project?.name || "Untitled Project",
        description: project?.description || "",
        canvasWidth: canvasSize.width,
        canvasHeight: canvasSize.height,
        isAnimated: project?.isAnimated || false,
        spriteSet,
        tags: tags,
        pokemonData: project?.pokemonData || null,
        gameVersion: project?.gameVersion || null,
      }

      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(projectData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to save project")
      }

      setCurrentProjectId(result.project.id)
      setLastSaved(spriteSet)
      setHasUnsaved(false)
      alert("Project saved to cloud successfully!")
      if (pendingPage.current) {
        const dest = pendingPage.current
        pendingPage.current = null
        if (dest === "new") {
          onNewProject()
        } else {
          onPageChange(dest)
        }
      } else {
        onPageChange("projects")
      }
    } catch (error) {
      console.error("Save error:", error)
      alert("Failed to save project to cloud")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSave = () => {
    const projectData = {
      name: project?.name || "sprite-project",
      spriteSet,
      canvasSize,
      currentFrame,
      currentSpriteType,
      isAnimated: project?.isAnimated || false,
    }

    const dataStr = JSON.stringify(projectData, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)

    const link = document.createElement("a")
    link.href = url
    link.download = `${projectData.name}.json`
    link.click()

    URL.revokeObjectURL(url)
    setLastSaved(spriteSet)
    setHasUnsaved(false)
  }

  const handleLoad = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".json"
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const projectData = JSON.parse(event.target?.result as string)
          setSpriteSet(projectData.spriteSet || getInitialSpriteSet())
          setCurrentSpriteType(projectData.currentSpriteType || "front")
          setCurrentFrame(projectData.currentFrame || 0)
          setLastSaved(projectData.spriteSet || getInitialSpriteSet())
          setHasUnsaved(false)
        } catch (error) {
          console.error("Failed to load project:", error)
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  const applyPixelsToFrame = useCallback(
    (pixels: Pixel[], spriteType: SpriteTypeKey, frame: number) => {
      const updatedSpriteType = {
        ...spriteSet[spriteType],
        [frame]: pixels,
      }

      const newSpriteSet = {
        ...spriteSet,
        [spriteType]: updatedSpriteType,
      }

      setSpriteSet(newSpriteSet)

      if (spriteType === currentSpriteType && frame === currentFrame) {
        updateFrame(pixels)
      }
    },
    [setSpriteSet, spriteSet, updateFrame, currentSpriteType, currentFrame],
  )

  const handleImport = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = () => {
        const img = new Image()
        img.onload = () => {
          const tempCanvas = document.createElement("canvas")
          const tempCtx = tempCanvas.getContext("2d")
          if (!tempCtx) return

          tempCanvas.width = Math.min(img.width, canvasSize.width)
          tempCanvas.height = Math.min(img.height, canvasSize.height)

          tempCtx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height)

          const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height)
          const pixels: Pixel[] = []

          for (let y = 0; y < tempCanvas.height; y++) {
            for (let x = 0; x < tempCanvas.width; x++) {
              const index = (y * tempCanvas.width + x) * 4
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

          applyPixelsToFrame(pixels, currentSpriteType, currentFrame)
        }
        if (reader.result) {
          img.src = reader.result as string
        }
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }

  const handleLoadBattleSprite = (spriteData: any, spriteType: SpriteTypeKey) => {
    applyPixelsToFrame(spriteData.pixels, spriteType, currentFrame)
  }

  useEffect(() => {
    replaceStore({
      front: spriteSet.front,
      back: spriteSet.back,
      frontShiny: spriteSet.frontShiny,
      backShiny: spriteSet.backShiny,
      currentSpriteType,
      currentFrame,
      zoom,
    })
  }, [spriteSet, currentSpriteType, currentFrame, zoom, replaceStore])

  return (
    <div className="min-h-screen bg-slate-900 text-white overflow-hidden">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-cyan-500 rounded flex items-center justify-center">
                <Grid3X3 className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-cyan-400">Poke Sprite Generator</span>
            </div>

            <nav className="flex items-center gap-6">
              <Button variant="ghost" className="text-cyan-400 bg-slate-700">
                <Grid3X3 className="w-4 h-4 mr-2" />
                Studio
              </Button>
              <Button
                variant="ghost"
                className="text-slate-300 hover:text-white"
                onClick={handleNewProjectClick}
              >
                New Project
              </Button>
              <Button
                variant="ghost"
                className="text-slate-300 hover:text-white"
                onClick={() => handleNavigate("projects")}
              >
                Projects
              </Button>
              <Button
                variant="ghost"
                className="text-slate-300 hover:text-white"
                onClick={() => handleNavigate("stencils")}
              >
                Pokemon Repository
              </Button>
              <Button variant="ghost" className="text-slate-300 hover:text-white">
                Gallery
              </Button>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {session?.user ? (
              <Button
                variant="ghost"
                className="text-slate-300 hover:text-white"
                onClick={() => signOut()}
              >
                Sign Out
              </Button>
            ) : (
              <Button
                variant="ghost"
                className="text-slate-300 hover:text-white"
                onClick={() => router.push("/auth/signin")}
              >
                Sign In
              </Button>
            )}
            <Button variant="outline" className="bg-slate-700 border-slate-600 text-white" onClick={handleImport}>
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
            <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => setShowSaveModal(true)}>
              <SaveIcon className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={() => setShowExportModal(true)}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </header>

      {/* Project Title */}
      <div className="bg-slate-800 border-b border-slate-700 px-6 py-3">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-cyan-500 rounded-sm"></div>
          <span className="font-medium">{project?.name || "New Project"}</span>
          {project?.stencilData && (
            <span className="text-xs text-slate-400 ml-2">• Based on {project.stencilData.name}</span>
          )}
          {project?.isAnimated && <span className="text-xs text-green-400 ml-2">• Animated</span>}
          {session?.user && <span className="text-xs text-blue-400 ml-2">• Signed in as {session.user.username}</span>}
        </div>
      </div>

      <div className="flex h-[calc(100vh-128px)] overflow-hidden">
        {/* Left Sidebar */}
        <div
          className={`${leftSidebarCollapsed ? "w-12" : "w-64"} bg-slate-800 border-r border-slate-700 transition-all duration-300 flex flex-col`}
        >
          <div className="p-2 border-b border-slate-700">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setLeftSidebarCollapsed(!leftSidebarCollapsed)}
              className="w-full justify-center"
            >
              {leftSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </Button>
          </div>

          {!leftSidebarCollapsed && (
            <div className="p-4 space-y-6 overflow-y-auto flex-1">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded border-2 border-slate-600" style={{ backgroundColor: selectedColor }} />
                  <ColorPaletteGrid
                    currentColor={selectedColor}
                    onColorSelect={(c) => {
                      setSelectedColor(c)
                    }}
                  />
                </div>
              </div>

              <FrameNavigator
                currentFrame={currentFrame}
                onFrameChange={(f) => {
                  setCurrentFrame(f)
                  setStoreFrame(f)
                }}
                frameData={frameData}
                canvasWidth={canvasSize.width}
                canvasHeight={canvasSize.height}
              />

              <div className="space-y-3">
                {session?.user && (
                  <Button
                    onClick={() => setShowSaveModal(true)}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Cloud className="w-4 h-4 mr-2" />
                        Save
                      </>
                    )}
                  </Button>
                )}
                <Button onClick={handleSave} className="w-full bg-purple-600 hover:bg-purple-700">
                  <SaveIcon className="w-4 h-4 mr-2" />
                  Download Project
                </Button>
                <Button onClick={handleLoad} className="w-full bg-indigo-600 hover:bg-indigo-700">
                  <FolderOpen className="w-4 h-4 mr-2" />
                  Load Project
                </Button>
              </div>

              <div>
                <h3 className="text-white font-medium mb-3">Export</h3>
                <Button onClick={exportSpriteSheet} className="w-full bg-green-600 hover:bg-green-700 mb-3">
                  <Download className="w-4 h-4 mr-2" />
                  Export Sprite Sheet
                </Button>
                <div className="bg-slate-700 rounded p-3 text-sm text-slate-300">
                  PNG format, transparent background.
                  {session?.user && <div className="mt-2 text-xs text-blue-300">Ctrl+S to save to cloud</div>}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 bg-slate-900 p-6 overflow-hidden">
          <div className="h-full">
            <div className="bg-slate-800 rounded-lg p-4 h-full flex flex-col">
              {/* Canvas Tools */}
              <div className="flex items-center justify-between mb-4">
                <TooltipProvider delayDuration={0}>
                  <div className="flex items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant={selectedTool === "pencil" ? "default" : "ghost"}
                          onClick={() => setSelectedTool("pencil")}
                          className={selectedTool === "pencil" ? "bg-cyan-600 hover:bg-cyan-700" : ""}
                        >
                          <Brush className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Draw Pixel</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant={selectedTool === "eraser" ? "default" : "ghost"}
                          onClick={() => setSelectedTool("eraser")}
                          className={selectedTool === "eraser" ? "bg-cyan-600 hover:bg-cyan-700" : ""}
                        >
                          <Eraser className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Erase Pixel</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant={selectedTool === "bucket" ? "default" : "ghost"}
                          onClick={() => setSelectedTool("bucket")}
                          className={selectedTool === "bucket" ? "bg-cyan-600 hover:bg-cyan-700" : ""}
                        >
                          <PaintBucket className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Bucket Fill</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant={selectedTool === "bucket-erase" ? "default" : "ghost"}
                          onClick={() => setSelectedTool("bucket-erase")}
                          className={selectedTool === "bucket-erase" ? "bg-cyan-600 hover:bg-cyan-700" : ""}
                        >
                          <PaintBucket className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Bucket Erase</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant={selectedTool === "select" ? "default" : "ghost"}
                          onClick={() => setSelectedTool("select")}
                          className={selectedTool === "select" ? "bg-cyan-600 hover:bg-cyan-700" : ""}
                        >
                          <Square className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Marquee Select</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant={selectedTool === "eyedropper" ? "default" : "ghost"}
                          onClick={() => setSelectedTool("eyedropper")}
                          className={selectedTool === "eyedropper" ? "bg-cyan-600 hover:bg-cyan-700" : ""}
                        >
                          <Droplet className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Color Picker</TooltipContent>
                    </Tooltip>

                    <div className="w-px h-6 bg-slate-600 mx-1" />

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="sm" variant="ghost" onClick={handleRotateFrame}>
                          <RotateCw className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Rotate Frame</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowGrid(!showGrid)}
                          className={showGrid ? "text-cyan-400" : ""}
                        >
                          {showGrid ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Toggle Grid</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={undo}
                          disabled={!canUndo}
                          className={!canUndo ? "opacity-50" : ""}
                        >
                          <Undo className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Undo</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={redo}
                          disabled={!canRedo}
                          className={!canRedo ? "opacity-50" : ""}
                        >
                          <Redo className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Redo</TooltipContent>
                    </Tooltip>

                    <div className="flex items-center gap-2 pl-2">
                      <Slider
                        min={0.5}
                        max={3}
                        step={0.1}
                        value={[zoom]}
                        onValueChange={(v) => {
                          setZoom(v[0])
                          setStoreZoom(v[0])
                        }}
                        className="w-24 h-2"
                      />
                      <span className="text-xs text-slate-200">Zoom: {Math.round(zoom * 100)}%</span>
                    </div>
                  </div>
                </TooltipProvider>

                <div className="text-sm text-slate-400">
                  {canvasSize.width}×{canvasSize.height} • {Math.round(zoom * 100)}% zoom • Frame {currentFrame + 1}
                  {project?.isAnimated && " • Animated"}
                </div>
              </div>

              {/* Canvas */}
              <div className="flex-1">
                <SpriteCanvas
                  key={currentSpriteType}
                  width={canvasSize.width}
                  height={canvasSize.height}
                  zoom={zoom}
                  selectedTool={selectedTool}
                  selectedColor={selectedColor}
                  currentFrame={currentFrame}
                  frameData={frameData}
                  onFrameDataChange={handleFrameDataChange}
                  onZoomChange={(z) => {
                    setZoom(z)
                    setStoreZoom(z)
                  }}
                  onColorPick={setSelectedColor}
                  showGrid={showGrid}
                  onBrushStrokeComplete={handleBrushStrokeComplete}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div
          className={`${rightSidebarCollapsed ? "w-12" : "w-80"} bg-slate-800 border-l border-slate-700 transition-all duration-300 flex flex-col`}
        >
          <div className="p-2 border-b border-slate-700">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setRightSidebarCollapsed(!rightSidebarCollapsed)}
              className="w-full justify-center"
            >
              {rightSidebarCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
          </div>

          {!rightSidebarCollapsed && (
            <div className="p-4 overflow-y-auto flex-1">
              <BattleSpriteTabs
                spriteSet={spriteSet}
                currentSprite={currentSpriteType}
                onSpriteChange={(type) => {
                  setCurrentSpriteType(type)
                  setStoreSpriteType(type)
                  setZoom(1)
                  setStoreZoom(1)
                }}
                canvasWidth={canvasSize.width}
                canvasHeight={canvasSize.height}
              />
            </div>
          )}
        </div>
      </div>

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        frameData={frameData}
        canvasWidth={canvasSize.width}
        canvasHeight={canvasSize.height}
      />
      <SaveProjectModal
        isOpen={showSaveModal}
        defaultName={project?.name || "Untitled Project"}
        defaultTags={project?.tags || []}
        spriteSet={spriteSet}
        canvasWidth={canvasSize.width}
        canvasHeight={canvasSize.height}
        onCancel={() => setShowSaveModal(false)}
        onSave={(n, t) => {
          setShowSaveModal(false)
          handleSaveToCloud(n, t)
        }}
      />
      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
      <UnsavedChangesModal
        isOpen={showUnsavedModal}
        onCancel={handleUnsavedCancel}
        onDiscard={handleUnsavedDiscard}
        onSave={handleUnsavedSave}
      />
    </div>
  )
}
