import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

export async function GET() {
  const uri = process.env.MONGODB_URI; // Ensure this is set in your .env file
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db("yourDatabaseName");
    const collection = db.collection("test");

    const data = await collection.find({}).toArray();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("MongoDB connection error:", error);
    return NextResponse.json(
      { success: false, message: "Database connection failed" },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}