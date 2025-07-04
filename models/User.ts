import mongoose, { type Document, Schema } from "mongoose"

export interface IUser extends Document {
  email: string
  username: string
  password: string
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
  },
  {
    timestamps: true,
  },
)

// Create indexes
UserSchema.index({ email: 1 })
UserSchema.index({ username: 1 })

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema)
