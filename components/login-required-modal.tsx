"use client"

import { Button } from "@/components/ui/button"

interface LoginRequiredModalProps {
  isOpen: boolean
  onClose: () => void
}

export function LoginRequiredModal({ isOpen, onClose }: LoginRequiredModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-600 w-full max-w-sm mx-4 text-center space-y-4">
        <h3 className="text-white font-medium">Sign In Required</h3>
        <p className="text-slate-400 text-sm">You need to be logged in to save your project.</p>
        <div className="flex gap-2 pt-2 justify-center">
          <Button variant="outline" onClick={onClose} className="bg-slate-700 border-slate-600 text-white">
            Cancel
          </Button>
          <Button onClick={() => (window.location.href = "/auth/signin")} className="bg-cyan-600 hover:bg-cyan-700">
            Sign In
          </Button>
        </div>
      </div>
    </div>
  )
}
