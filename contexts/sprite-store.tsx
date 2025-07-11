import React, { createContext, useContext, useState } from 'react'
import type { SpriteSet, SpriteTypeKey, FrameData } from '@/types/sprite-set'
import type { Pixel } from '@/types/pixel'

export interface SpriteStore {
  front: FrameData
  back: FrameData
  frontShiny: FrameData
  backShiny: FrameData
  currentSpriteType: SpriteTypeKey
  currentFrame: number
  zoom: number
}

interface SpriteStoreContextValue {
  store: SpriteStore
  setCurrentSpriteType: (type: SpriteTypeKey) => void
  setCurrentFrame: (frame: number) => void
  updateFrame: (pixels: Pixel[]) => void
  replaceStore: (newStore: SpriteStore) => void
  setZoom: (zoom: number) => void
}

const createEmptyFrames = (): FrameData => ({ 0: [], 1: [], 2: [], 3: [] })

const defaultStore: SpriteStore = {
  front: createEmptyFrames(),
  back: createEmptyFrames(),
  frontShiny: createEmptyFrames(),
  backShiny: createEmptyFrames(),
  currentSpriteType: 'front',
  currentFrame: 0,
  zoom: 1,
}

const SpriteStoreContext = createContext<SpriteStoreContextValue | undefined>(undefined)

export function SpriteStoreProvider({ children }: { children: React.ReactNode }) {
  const [store, setStore] = useState<SpriteStore>(defaultStore)

  const setCurrentSpriteType = React.useCallback((type: SpriteTypeKey) => {
    setStore((s) => ({ ...s, currentSpriteType: type }))
  }, [])

  const setCurrentFrame = React.useCallback((frame: number) => {
    setStore((s) => ({ ...s, currentFrame: frame }))
  }, [])

  const setZoom = React.useCallback((z: number) => {
    setStore((s) => ({ ...s, zoom: z }))
  }, [])

  const updateFrame = React.useCallback((pixels: Pixel[]) => {
    setStore((s) => {
      const frameData = s[s.currentSpriteType]
      const updated: FrameData = { ...frameData, [s.currentFrame]: pixels }
      return { ...s, [s.currentSpriteType]: updated }
    })
  }, [])

  const replaceStore = React.useCallback((newStore: SpriteStore) => {
    setStore(newStore)
  }, [])

  return (
    <SpriteStoreContext.Provider
      value={{ store, setCurrentSpriteType, setCurrentFrame, updateFrame, replaceStore, setZoom }}
    >
      {children}
    </SpriteStoreContext.Provider>
  )
}

export function useSpriteStore() {
  const ctx = useContext(SpriteStoreContext)
  if (!ctx) throw new Error('useSpriteStore must be used within SpriteStoreProvider')
  return ctx
}
