import mongoose from 'mongoose'

const ProjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  spriteData: { type: Object, required: true },
  updatedAt: { type: Date, default: Date.now },
})

export default mongoose.models.Project || mongoose.model('Project', ProjectSchema)
