// Test script to verify MongoDB connection
const mongoose = require("mongoose")

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
