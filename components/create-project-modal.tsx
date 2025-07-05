"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { User, MoreHorizontal, Shield, Circle, FileText } from "lucide-react"

interface ProjectTemplate {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  dimensions: { width: number; height: number }
  selected?: boolean
}

const templates: ProjectTemplate[] = [
  {
    id: "overworld-ds",
    name: "Overworld Sprite (DS Style)",
    description: "4-directional, 16 frames. 32x32 per frame.",
    icon: <User className="w-5 h-5" />,
    dimensions: { width: 32, height: 32 },
    selected: true,
  },
  {
    id: "overworld-gba",
    name: "Overworld Sprite (GBA Style)",
    description: "4-directional, 16 frames. 32x16 per frame.",
    icon: <MoreHorizontal className="w-5 h-5" />,
    dimensions: { width: 32, height: 16 },
  },
  {
    id: "battle-gen5",
    name: "Battle Sprite (Gen 5 Style)",
    description: "Front/Back sprites. 96x96 per frame.",
    icon: <Shield className="w-5 h-5" />,
    dimensions: { width: 96, height: 96 },
  },
  {
    id: "battle-gen5-animated",
    name: "Animated Battle Sprite (Gen 5)",
    description: "Animated front/back sprites. 96x96, 2-4 frames.",
    icon: <Circle className="w-5 h-5" />,
    dimensions: { width: 96, height: 96 },
  },
  {
    id: "battle-gen34",
    name: "Battle Sprite (Gen 3/4 Style)",
    description: "Front/Back sprites. 80x80 per frame.",
    icon: <Circle className="w-5 h-5" />,
    dimensions: { width: 80, height: 80 },
  },
  {
    id: "custom",
    name: "Custom Project",
    description: "Blank canvas with default settings. 128x128.",
    icon: <FileText className="w-5 h-5" />,
    dimensions: { width: 128, height: 128 },
  },
]

interface CreateProjectModalProps {
  isOpen: boolean
  onCreateProject: (projectData: any) => void
  onCancel: () => void
}

export function CreateProjectModal({ isOpen, onCreateProject, onCancel }: CreateProjectModalProps) {
  if (!isOpen) return null
  const [selectedTemplate, setSelectedTemplate] = useState("overworld-ds")
  const [projectName, setProjectName] = useState("My Awesome Game Sprite")

  const handleCreate = () => {
    const template = templates.find((t) => t.id === selectedTemplate)
    onCreateProject({
      name: projectName,
      template: template,
      dimensions: template?.dimensions || { width: 80, height: 80 },
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg p-8 w-full max-w-4xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Create New Project</h1>
          <p className="text-slate-400">Choose a template to get started with Poke Sprite Generator.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            {templates.map((template) => (
              <Card
                key={template.id}
                className={`p-4 cursor-pointer transition-all border-2 ${
                  selectedTemplate === template.id
                    ? "border-cyan-500 bg-slate-700"
                    : "border-slate-600 bg-slate-750 hover:border-slate-500"
                }`}
                onClick={() => setSelectedTemplate(template.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="text-slate-400 mt-1">{template.icon}</div>
                  <div>
                    <h3 className="text-white font-medium mb-1">{template.name}</h3>
                    <p className="text-slate-400 text-sm">{template.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-white font-medium mb-3">Project Name</label>
              <Input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                placeholder="My Awesome Game Sprite"
              />
              <p className="text-slate-400 text-sm mt-2">You can change this later.</p>
            </div>

            <div className="flex gap-3 pt-8">
              <Button
                variant="outline"
                onClick={onCancel}
                className="flex-1 bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
              >
                Cancel
              </Button>
              <Button onClick={handleCreate} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                Create
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
