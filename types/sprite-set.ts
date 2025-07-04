import type { Pixel } from './pixel'

export type FrameData = {
  [frame: number]: Pixel[]
}

export interface SpriteSet {
  front: FrameData
  back: FrameData
  frontShiny: FrameData
  backShiny: FrameData
}

export type SpriteTypeKey = keyof SpriteSet
