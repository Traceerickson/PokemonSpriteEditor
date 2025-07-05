"use client"

import type React from "react"

import { SessionProvider } from "next-auth/react"
import { SpriteStoreProvider } from "@/contexts/sprite-store"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SpriteStoreProvider>{children}</SpriteStoreProvider>
    </SessionProvider>
  )
}
