import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import Project from "@/models/Project"
import mongoose from "mongoose"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 })
    }

    await connectDB()

    const project = await Project.findOne({
      _id: params.id,
      userId: session.user.id,
    }).lean()

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Convert frames array back to frameData object
    const frameData: { [key: number]: any } = {}
    if (project.frames) {
      project.frames.forEach((frame: any) => {
        frameData[frame.frameNumber] = frame.pixels
      })
    }

    return NextResponse.json({
      project: {
        ...project,
        id: project._id,
        frameData,
      },
    })
  } catch (error) {
    console.error("Get project error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 })
    }

    const { name, description, frameData, tags } = await request.json()

    await connectDB()

    // Convert frameData object to frames array
    const frames = []
    if (frameData) {
      for (const [frameNumber, pixels] of Object.entries(frameData)) {
        if (Array.isArray(pixels) && pixels.length > 0) {
          frames.push({
            frameNumber: Number.parseInt(frameNumber),
            pixels: pixels,
          })
        }
      }
    }

    const project = await Project.findOneAndUpdate(
      { _id: params.id, userId: session.user.id },
      {
        name,
        description,
        frames,
        tags: tags || [],
        updatedAt: new Date(),
      },
      { new: true },
    )

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Project updated successfully" })
  } catch (error) {
    console.error("Update project error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 })
    }

    await connectDB()

    const project = await Project.findOneAndDelete({
      _id: params.id,
      userId: session.user.id,
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Project deleted successfully" })
  } catch (error) {
    console.error("Delete project error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
