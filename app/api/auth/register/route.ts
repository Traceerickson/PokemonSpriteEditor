import { type NextRequest, NextResponse } from "next/server"
import { hash } from "bcryptjs"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"

export async function POST(request: NextRequest) {
  try {
    const { email, username, password } = await request.json()

    // Validate input
    if (!email || !username || !password) {
      return NextResponse.json({ error: "Email, username, and password are required" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters long" }, { status: 400 })
    }

    if (username.length < 3 || username.length > 20) {
      return NextResponse.json({ error: "Username must be between 3 and 20 characters" }, { status: 400 })
    }

    const db = await connectDB()
    if (!db) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 })
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username: username }],
    })

    if (existingUser) {
      return NextResponse.json({ error: "User with this email or username already exists" }, { status: 409 })
    }

    // Hash password
    const hashedPassword = await hash(password, 12)

    // Create user
    const user = await User.create({
      email: email.toLowerCase(),
      username,
      password: hashedPassword,
    })

    return NextResponse.json({
      message: "User created successfully",
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        createdAt: user.createdAt,
      },
    })
  } catch (error: any) {
    console.error("Registration error:", error)

    if (error.code === 11000) {
      return NextResponse.json({ error: "User with this email or username already exists" }, { status: 409 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
