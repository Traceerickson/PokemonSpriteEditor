import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import Project from "@/models/Project"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const skip = (page - 1) * limit

    const projects = await Project.find({ userId: session.user.id })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    const totalCount = await Project.countDocuments({ userId: session.user.id })

    return NextResponse.json({
      projects: projects.map((project) => {
        const previewFromFrames =
          project.frames?.find((f: any) => f.frameNumber === 0)?.pixels || []
        const previewFromSet = project.spriteSet?.front?.[0] || []
        return {
          ...project,
          id: project._id,
          frameCount: project.frames?.length || 0,
          previewPixels: previewFromFrames.length ? previewFromFrames : previewFromSet,
        }
      }),
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    })
  } catch (error) {
    console.error("Get projects error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const {
      name,
      description,
      canvasWidth,
      canvasHeight,
      isAnimated,
      frameData,
      spriteSet,
      tags,
      pokemonData,
      gameVersion,
    } = await request.json()

    // Validate input
    if (!name || !canvasWidth || !canvasHeight) {
      return NextResponse.json({ error: "Name, canvas width, and canvas height are required" }, { status: 400 })
    }

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

    // Create project
    const project = await Project.create({
      userId: session.user.id,
      name,
      description: description || "",
      canvasWidth,
      canvasHeight,
      isAnimated: isAnimated || false,
      frames,
      spriteSet: spriteSet || null,
      tags: tags || [],
      pokemonData: pokemonData || null,
      gameVersion: gameVersion || null,
    })

    return NextResponse.json({
      message: "Project created successfully",
      project: {
        ...project.toObject(),
        id: project._id,
      },
    })
  } catch (error) {
    console.error("Create project error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
