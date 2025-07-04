import mongoose, { type Document, Schema } from "mongoose"

export interface IPixel {
  x: number
  y: number
  color: string
}

export interface IProjectFrame {
  frameNumber: number
  pixels: IPixel[]
}

export interface IProject extends Document {
  userId: mongoose.Types.ObjectId
  name: string
  description?: string
  canvasWidth: number
  canvasHeight: number
  isAnimated: boolean
  isPublic: boolean
  frames: IProjectFrame[]
  tags: string[]
  pokemonData?: any
  gameVersion?: any
  createdAt: Date
  updatedAt: Date
}

const PixelSchema = new Schema<IPixel>(
  {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    color: { type: String, required: true },
  },
  { _id: false },
)

const ProjectFrameSchema = new Schema<IProjectFrame>(
  {
    frameNumber: { type: Number, required: true },
    pixels: [PixelSchema],
  },
  { _id: false },
)

const ProjectSchema = new Schema<IProject>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    canvasWidth: {
      type: Number,
      required: true,
      min: 16,
      max: 512,
    },
    canvasHeight: {
      type: Number,
      required: true,
      min: 16,
      max: 512,
    },
    isAnimated: {
      type: Boolean,
      default: false,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    frames: [ProjectFrameSchema],
    tags: [
      {
        type: String,
        trim: true,
        maxlength: 30,
      },
    ],
    pokemonData: {
      type: Schema.Types.Mixed,
      default: null,
    },
    gameVersion: {
      type: Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  },
)

// Create indexes
ProjectSchema.index({ userId: 1 })
ProjectSchema.index({ isPublic: 1 })
ProjectSchema.index({ tags: 1 })
ProjectSchema.index({ createdAt: -1 })

export default mongoose.models.Project || mongoose.model<IProject>("Project", ProjectSchema)
