import mongoose from 'mongoose';

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/legal-ai-db";

export async function connectDB() {
  try {
    // Mongoose connection options
    await mongoose.connect(uri);
    console.log("Connected to MongoDB (Mongoose)");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
}

export function getDB() {
  if (mongoose.connection.readyState !== 1) {
    throw new Error("Database not connected. Call connectDB first.");
  }
  return mongoose.connection.db;
}

