// Test script to verify MongoDB connection
const fs = require("fs")
const path = require("path")
const mongoose = require("mongoose")

function loadEnv() {
  const envPath = path.resolve(__dirname, "..", ".env")
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/)
    for (const line of lines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/)
      if (match) {
        let [, key, value] = match
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1)
        }
        if (!process.env[key]) {
          process.env[key] = value
        }
      }
    }
  }
}

loadEnv()

async function testConnection() {
  try {
    // Replace with your actual connection string
    const MONGODB_URI = process.env.MONGODB_URI || "your-connection-string-here"

    console.log("Connecting to MongoDB...")
    await mongoose.connect(MONGODB_URI)

    console.log("✅ Successfully connected to MongoDB!")

    // Test creating a simple document
    const TestSchema = new mongoose.Schema({
      name: String,
      createdAt: { type: Date, default: Date.now },
    })

    const TestModel = mongoose.model("Test", TestSchema)

    const testDoc = new TestModel({ name: "Connection Test" })
    await testDoc.save()

    console.log("✅ Successfully created test document!")

    // Clean up
    await TestModel.deleteOne({ _id: testDoc._id })
    console.log("✅ Test document cleaned up!")

    await mongoose.disconnect()
    console.log("✅ Disconnected from MongoDB")
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message)
    process.exit(1)
  }
}

testConnection()
