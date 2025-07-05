import { NextApiRequest, NextApiResponse } from 'next'
import connectDB from '@/lib/mongodb'
import Project from '@/models/Project'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectDB()

  if (req.method === 'POST') {
    const { name, spriteData } = req.body
    const project = await Project.create({ name, spriteData, updatedAt: new Date() })
    return res.status(201).json(project)
  }

  if (req.method === 'GET') {
    const projects = await Project.find().sort({ updatedAt: -1 })
    return res.status(200).json(projects)
  }

  res.setHeader('Allow', ['GET', 'POST'])
  res.status(405).end(`Method ${req.method} Not Allowed`)
}
