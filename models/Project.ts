import mongoose, { Schema, type Document } from "mongoose"

export interface Frame {
  frameNumber: number
  pixels: any[]
}

export interface IProject extends Document {
  userId: mongoose.Types.ObjectId
  name: string
  description: string
  canvasWidth: number
  canvasHeight: number
  isAnimated: boolean
  frames: Frame[]
  tags: string[]
  pokemonData: any
  gameVersion: any
  createdAt: Date
  updatedAt: Date
}

const FrameSchema = new Schema<Frame>(
  {
    frameNumber: { type: Number, required: true },
    pixels: { type: Array, required: true },
  },
  { _id: false }
)

const ProjectSchema = new Schema<IProject>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    canvasWidth: { type: Number, required: true },
    canvasHeight: { type: Number, required: true },
    isAnimated: { type: Boolean, default: false },
    frames: [FrameSchema],
    tags: { type: [String], default: [] },
    pokemonData: { type: Schema.Types.Mixed, default: null },
    gameVersion: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
)

export default mongoose.models.Project || mongoose.model<IProject>("Project", ProjectSchema)
