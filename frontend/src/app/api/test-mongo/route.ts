import { MongoClient } from 'mongodb';

// Ensure the environment variable is correctly defined
const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error('Environment variable MONGODB_URI is not defined');
}

// Initialize MongoDB client
const client = new MongoClient(uri);

export async function GET() {
  try {
    await client.connect();
    const db = client.db(); // Connect to the default database
    const testCollection = db.collection('test'); // Example collection

    // Fetch some data for testing
    const data = await testCollection.find({}).toArray();

    return new Response(JSON.stringify({ success: true, data }), { status: 200 });
  } catch (err) {
    // Explicitly cast `err` to `Error` to avoid the `unknown` type issue
    const errorMessage = (err as Error).message || 'An unknown error occurred';
    console.error('MongoDB Connection Error:', errorMessage);

    return new Response(JSON.stringify({ success: false, error: errorMessage }), { status: 500 });
  } finally {
    await client.close(); // Always close the client after the operation
  }
}