"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Grid3X3, Plus, FolderOpen, Clock, Star, Loader2 } from "lucide-react"

interface ProjectsPageProps {
  onPageChange: (page: "studio" | "projects" | "stencils") => void
  onNewProject: () => void
  onProjectSelect: (id: string) => void
}

export function ProjectsPage({ onPageChange, onNewProject, onProjectSelect }: ProjectsPageProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (session?.user?.id) {
      fetchProjects()
    } else {
      setLoading(false)
    }
  }, [session])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/projects")

      if (!response.ok) {
        throw new Error("Failed to fetch projects")
      }

      const data = await response.json()
      setProjects(data.projects || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load projects")
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return "1 day ago"
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`
    return date.toLocaleDateString()
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-slate-900 text-white">
        <header className="bg-slate-800 border-b border-slate-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-cyan-500 rounded flex items-center justify-center">
                  <Grid3X3 className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-cyan-400">Poke Sprite Generator</span>
              </div>
            </div>
          </div>
        </header>

        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Sign In Required</h1>
            <p className="text-slate-400 mb-6">Please sign in to view your projects</p>
            <Button onClick={() => (window.location.href = "/auth/signin")} className="bg-cyan-600 hover:bg-cyan-700">
              Sign In
            </Button>
          </div>
        </div>
      </div>
    )
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
              <span className="text-xl font-bold text-cyan-400">Poke Sprite Generator</span>
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
              <Button variant="ghost" className="text-cyan-400 bg-slate-700">
                Projects
              </Button>
              <Button
                variant="ghost"
                className="text-slate-300 hover:text-white"
                onClick={() => onPageChange("stencils")}
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
            <Button onClick={onNewProject} className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </div>
        </div>
      </header>

      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Your Projects</h1>
            <p className="text-slate-400">Manage and organize your sprite projects</p>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
            </div>
          )}

          {error && (
            <div className="bg-red-900/20 border border-red-500 rounded-lg p-6 mb-8 text-center">
              <p className="text-red-400">{error}</p>
              <Button onClick={fetchProjects} className="mt-4 bg-red-600 hover:bg-red-700">
                Retry
              </Button>
            </div>
          )}

          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {/* New Project Card */}
              <Card
                className="p-6 border-2 border-dashed border-slate-600 bg-slate-800 hover:border-slate-500 cursor-pointer transition-all"
                onClick={onNewProject}
              >
                <div className="flex flex-col items-center justify-center h-32 text-slate-400">
                  <Plus className="w-8 h-8 mb-2" />
                  <span className="font-medium">Create New Project</span>
                </div>
              </Card>

              {/* User Projects */}
              {projects.map((project) => (
                <Card
                  key={project.id || project._id}
                  className="p-4 bg-slate-800 border-slate-600 hover:border-slate-500 cursor-pointer transition-all"
                  onClick={() => onProjectSelect(project.id || project._id)}
                >
                  <div className="space-y-3">
                    <div className="w-full h-16 bg-slate-700 rounded flex items-center justify-center">
                      <div className="text-slate-400 text-xs">
                        {project.canvasWidth}×{project.canvasHeight}
                        {project.isAnimated && " • Animated"}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium text-white truncate">{project.name}</h3>
                      <p className="text-sm text-slate-400 truncate">
                        {project.frameCount || 0} frames • {project.tags?.length || 0} tags
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Clock className="w-3 h-3" />
                      {formatDate(project.updatedAt)}
                    </div>
                  </div>
                </Card>
              ))}

              {projects.length === 0 && !loading && (
                <div className="col-span-full text-center py-12">
                  <p className="text-slate-400 mb-4">No projects yet</p>
                  <Button onClick={onNewProject} className="bg-green-600 hover:bg-green-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Project
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="mt-12">
            <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4 bg-slate-800 border-slate-600 hover:border-slate-500 cursor-pointer transition-all">
                <div className="flex items-center gap-3">
                  <FolderOpen className="w-5 h-5 text-cyan-400" />
                  <div>
                    <h3 className="font-medium text-white">Import Project</h3>
                    <p className="text-sm text-slate-400">Load an existing project file</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4 bg-slate-800 border-slate-600 hover:border-slate-500 cursor-pointer transition-all">
                <div className="flex items-center gap-3">
                  <Star className="w-5 h-5 text-yellow-400" />
                  <div>
                    <h3 className="font-medium text-white">Templates</h3>
                    <p className="text-sm text-slate-400">Browse project templates</p>
                  </div>
                </div>
              </Card>
              <Card
                className="p-4 bg-slate-800 border-slate-600 hover:border-slate-500 cursor-pointer transition-all"
                onClick={() => onPageChange("stencils")}
              >
                <div className="flex items-center gap-3">
                  <Grid3X3 className="w-5 h-5 text-green-400" />
                  <div>
                    <h3 className="font-medium text-white">Pokemon Repository</h3>
                    <p className="text-sm text-slate-400">Load official Pokemon sprites from PokeAPI</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
