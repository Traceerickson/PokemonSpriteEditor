"use client"

import { Button } from "@/components/ui/button"

interface UnsavedChangesModalProps {
  isOpen: boolean
  onCancel: () => void
  onSave: () => void
  onDiscard: () => void
}

export function UnsavedChangesModal({ isOpen, onCancel, onSave, onDiscard }: UnsavedChangesModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-600 w-full max-w-sm mx-4">
        <h3 className="text-white font-medium mb-2">Unsaved Changes</h3>
        <p className="text-slate-400 text-sm mb-4">You have unsaved work. Would you like to save before continuing?</p>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onCancel} className="bg-slate-700 border-slate-600 text-white">
            Cancel
          </Button>
          <Button variant="ghost" onClick={onDiscard} className="text-slate-300 hover:text-white">
            Discard
          </Button>
          <Button onClick={onSave} className="bg-green-600 hover:bg-green-700">
            Save
          </Button>
        </div>
      </div>
    </div>
  )
}
