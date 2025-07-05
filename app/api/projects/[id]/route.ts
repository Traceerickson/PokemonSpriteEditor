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

    const spriteSet = project.spriteSet || null

    return NextResponse.json({
      project: {
        ...project,
        id: project._id,
        frameData,
        spriteSet,
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

    const { name, description, frameData, spriteSet, tags } = await request.json()

    await connectDB()

    // Convert provided data to frames array (for legacy preview usage)
    const frames: any[] = []
    const sourceData: any = frameData || (spriteSet ? spriteSet.front : null)
    if (sourceData) {
      for (const [frameNumber, pixels] of Object.entries(sourceData)) {
        if (Array.isArray(pixels) && pixels.length > 0) {
          frames.push({
            frameNumber: Number.parseInt(frameNumber),
            pixels,
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
        spriteSet: spriteSet || null,
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
