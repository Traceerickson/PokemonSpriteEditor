"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { SpriteEditor } from "@/components/sprite-editor"
import { CreateProjectModal } from "@/components/create-project-modal"
import { ProjectsPage } from "@/components/projects-page"
import { SpriteRepositoryPage } from "@/components/sprite-repository-page"

export default function Home() {
  const { data: session, status } = useSession()
  const [showCreateModal, setShowCreateModal] = useState(true)
  const [currentProject, setCurrentProject] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState<"studio" | "projects" | "stencils">("studio")

  const handleCreateProject = (projectData: any) => {
    setCurrentProject(projectData)
    setShowCreateModal(false)
    setCurrentPage("studio")
  }

  const handleLoadSprite = (spriteData: any) => {
    // Handle animated sprites with frame extraction
    if (spriteData.isAnimated) {
      const projectData = {
        name: spriteData.name,
        template: {
          id: spriteData.id,
          name: spriteData.name,
          description: spriteData.description + " (Animated)",
          dimensions: { width: spriteData.canvasWidth, height: spriteData.canvasHeight },
        },
        dimensions: { width: spriteData.canvasWidth, height: spriteData.canvasHeight },
        stencilData: {
          ...spriteData,
          // For animated sprites, we'll populate frames with extracted data
          pixels: [], // Frame 0 will be populated from animatedFrames
        },
        spriteType: spriteData.spriteType,
        isAnimated: true,
        originalSpriteUrl: spriteData.spriteUrl,
        animatedFrames: spriteData.animatedFrames,
      }
      setCurrentProject(projectData)
    } else {
      // Regular sprite handling
      const projectData = {
        name: spriteData.name,
        template: {
          id: spriteData.id,
          name: spriteData.name,
          description: spriteData.description,
          dimensions: { width: spriteData.canvasWidth, height: spriteData.canvasHeight },
        },
        dimensions: { width: spriteData.canvasWidth, height: spriteData.canvasHeight },
        stencilData: spriteData,
        spriteType: spriteData.spriteType,
      }
      setCurrentProject(projectData)
    }
    setCurrentPage("studio")
  }

  const handlePageChange = (page: "studio" | "projects" | "stencils") => {
    setCurrentPage(page)
  }

  // Show loading while session is being fetched
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (showCreateModal) {
    return <CreateProjectModal onCreateProject={handleCreateProject} onCancel={() => setShowCreateModal(false)} />
  }

  if (currentPage === "projects") {
    return <ProjectsPage onPageChange={handlePageChange} onNewProject={() => setShowCreateModal(true)} />
  }

  if (currentPage === "stencils") {
    return <SpriteRepositoryPage onPageChange={handlePageChange} onLoadSprite={handleLoadSprite} />
  }

  return (
    <SpriteEditor
      project={currentProject}
      onNewProject={() => setShowCreateModal(true)}
      onPageChange={handlePageChange}
    />
  )
}
