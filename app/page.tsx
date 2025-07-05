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
    if (spriteData.targets && currentProject?.spriteSet) {
      const newSet = {
        front: { ...currentProject.spriteSet.front },
        back: { ...currentProject.spriteSet.back },
        frontShiny: { ...currentProject.spriteSet.frontShiny },
        backShiny: { ...currentProject.spriteSet.backShiny },
      }

      const selectedTypes = (
        Object.keys(spriteData.targets) as Array<keyof typeof newSet>
      ).filter((t) => (spriteData.targets[t] || []).length > 0)

      const selectedFrames = Array.from(
        new Set(
          selectedTypes.flatMap((t) => spriteData.targets[t] as number[]),
        ),
      )

      selectedTypes.forEach((type) => {
        const pixels = spriteData.spriteSet[type][0] || []
        selectedFrames.forEach((frameIdx) => {
          newSet[type][frameIdx] = pixels
        })
      })

      setCurrentProject({ ...currentProject, spriteSet: newSet })
    } else if (spriteData.spriteSet) {
      const projectData = {
        name: spriteData.name,
        template: {
          id: spriteData.id,
          name: spriteData.name,
          description: spriteData.description,
          dimensions: { width: spriteData.canvasWidth, height: spriteData.canvasHeight },
        },
        dimensions: { width: spriteData.canvasWidth, height: spriteData.canvasHeight },
        spriteSet: spriteData.spriteSet,
        spriteType: spriteData.spriteType,
        pokemonData: spriteData.pokemonData,
        gameVersion: spriteData.gameVersion,
      }
      setCurrentProject(projectData)
    } else if (spriteData.isAnimated) {
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

  const handleProjectSelect = async (id: string) => {
    try {
      const res = await fetch(`/api/projects/${id}`)
      if (!res.ok) throw new Error('Failed to load project')
      const data = await res.json()
      const project = data.project
      const spriteSet = project.spriteSet || project.frameData
      if (spriteSet) {
        setCurrentProject({
          name: project.name,
          dimensions: {
            width: project.canvasWidth,
            height: project.canvasHeight,
          },
          spriteSet,
          tags: project.tags,
        })
        setCurrentPage('studio')
      }
    } catch (e) {
      console.error(e)
    }
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

  let pageContent: JSX.Element | null = null
  if (currentPage === "projects") {
    pageContent = (
      <ProjectsPage
        onPageChange={handlePageChange}
        onNewProject={() => setShowCreateModal(true)}
        onProjectSelect={handleProjectSelect}
      />
    )
  } else if (currentPage === "stencils") {
    pageContent = (
      <SpriteRepositoryPage
        onPageChange={handlePageChange}
        onLoadSprite={handleLoadSprite}
      />
    )
  } else {
    pageContent = (
      <SpriteEditor
        project={currentProject}
        onNewProject={() => setShowCreateModal(true)}
        onPageChange={handlePageChange}
      />
    )
  }

  return (
    <>
      {pageContent}
      <CreateProjectModal
        isOpen={showCreateModal}
        onCreateProject={handleCreateProject}
        onCancel={() => setShowCreateModal(false)}
      />
    </>
  )
}
