import { NextApiRequest, NextApiResponse } from 'next'
import connectDB from '@/lib/mongodb'
import Project from '@/models/Project'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectDB()
  const { id } = req.query

  if (req.method === 'GET') {
    const project = await Project.findById(id)
    return project
      ? res.status(200).json(project)
      : res.status(404).json({ error: 'Not found' })
  }

  res.setHeader('Allow', ['GET'])
  res.status(405).end(`Method ${req.method} Not Allowed`)
}
