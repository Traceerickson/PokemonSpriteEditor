"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Grid3X3, Download, Star, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { hgssStencils } from "@/data/stencils"
import { useRef, useEffect } from "react"

interface StencilsPageProps {
  onPageChange: (page: "studio" | "projects" | "stencils") => void
  onLoadStencil?: (stencil: any) => void
}

const stencilCategories = [
  { id: "overworld", name: "Overworld", count: 1 },
  { id: "pokemon", name: "Pokemon", count: 2 },
  { id: "gym-leaders", name: "Gym Leaders", count: 1 },
]

function StencilPreview({ stencil }: { stencil: any }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const previewSize = 64
    const scale = previewSize / Math.max(stencil.canvasWidth, stencil.canvasHeight)

    ctx.clearRect(0, 0, previewSize, previewSize)
    ctx.fillStyle = "#374151"
    ctx.fillRect(0, 0, previewSize, previewSize)

    ctx.imageSmoothingEnabled = false
    stencil.pixels.forEach((pixel: any) => {
      ctx.fillStyle = pixel.color
      const x = Math.floor(pixel.x * scale)
      const y = Math.floor(pixel.y * scale)
      const size = Math.max(1, Math.floor(scale))
      ctx.fillRect(x, y, size, size)
    })
  }, [stencil])

  return <canvas ref={canvasRef} width={64} height={64} className="rounded" />
}

export function StencilsPage({ onPageChange, onLoadStencil }: StencilsPageProps) {
  const handleUseStencil = (stencil: any) => {
    if (onLoadStencil) {
      onLoadStencil(stencil)
      onPageChange("studio")
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-cyan-500 rounded flex items-center justify-center">
                <Grid3X3 className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-cyan-400">PixelForge</span>
            </div>

            <nav className="flex items-center gap-6">
              <Button
                variant="ghost"
                className="text-slate-300 hover:text-white"
                onClick={() => onPageChange("studio")}
              >
                <Grid3X3 className="w-4 h-4 mr-2" />
                Studio
              </Button>
              <Button
                variant="ghost"
                className="text-slate-300 hover:text-white"
                onClick={() => onPageChange("projects")}
              >
                Projects
              </Button>
              <Button variant="ghost" className="text-cyan-400 bg-slate-700">
                Stencils
              </Button>
              <Button variant="ghost" className="text-slate-300 hover:text-white">
                Gallery
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">HeartGold/SoulSilver Stencils</h1>
            <p className="text-slate-400">Authentic HGSS-style sprite templates for your ROM hack projects</p>
          </div>

          {/* Search and Filters */}
          <div className="mb-8">
            <div className="flex gap-4 mb-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input placeholder="Search stencils..." className="pl-10 bg-slate-800 border-slate-600 text-white" />
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button size="sm" variant="outline" className="bg-cyan-600 border-cyan-600 text-white">
                All
              </Button>
              {stencilCategories.map((category) => (
                <Button
                  key={category.id}
                  size="sm"
                  variant="outline"
                  className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                >
                  {category.name} ({category.count})
                </Button>
              ))}
            </div>
          </div>

          {/* HGSS Stencils */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4">HeartGold/SoulSilver Templates</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hgssStencils.map((stencil) => (
                <Card
                  key={stencil.id}
                  className="p-4 bg-slate-800 border-slate-600 hover:border-slate-500 cursor-pointer transition-all"
                >
                  <div className="space-y-3">
                    <div className="w-full h-24 bg-slate-700 rounded flex items-center justify-center">
                      <StencilPreview stencil={stencil} />
                    </div>
                    <div>
                      <h3 className="font-medium text-white">{stencil.name}</h3>
                      <p className="text-sm text-slate-400">
                        {stencil.category} • {stencil.size}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">{stencil.description}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-400 fill-current" />
                          <span className="text-xs text-slate-400">{stencil.rating}</span>
                        </div>
                        <span className="text-xs text-slate-500">•</span>
                        <span className="text-xs text-slate-400">{stencil.downloads} downloads</span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-green-600 border-green-600 text-white hover:bg-green-700"
                        onClick={() => handleUseStencil(stencil)}
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Use
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Browse by Category</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stencilCategories.map((category) => (
                <Card
                  key={category.id}
                  className="p-6 bg-slate-800 border-slate-600 hover:border-slate-500 cursor-pointer transition-all"
                >
                  <div className="text-center">
                    <h3 className="font-medium text-white mb-1">{category.name}</h3>
                    <p className="text-sm text-slate-400">{category.count} stencils available</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
