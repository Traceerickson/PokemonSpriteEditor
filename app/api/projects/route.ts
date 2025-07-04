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
      projects: projects.map((project) => ({
        ...project,
        id: project._id,
        frameCount: project.frames?.length || 0,
      })),
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

    const { name, description, canvasWidth, canvasHeight, isAnimated, frameData, tags, pokemonData, gameVersion } =
      await request.json()

    // Validate input
    if (!name || !canvasWidth || !canvasHeight) {
      return NextResponse.json({ error: "Name, canvas width, and canvas height are required" }, { status: 400 })
    }

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

    // Create project
    const project = await Project.create({
      userId: session.user.id,
      name,
      description: description || "",
      canvasWidth,
      canvasHeight,
      isAnimated: isAnimated || false,
      frames,
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
