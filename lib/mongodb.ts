import mongoose, { Connection } from "mongoose";

// Connection URI from environment variables
const MONGODB_URI = process.env.MONGODB_URI || "";

// Cached connection interface for global storage
interface MongooseCache {
  conn: Connection | null;
  promise: Promise<Connection> | null;
}

// Extend global type to include mongoose cache
declare global {
  var mongoose: MongooseCache | undefined;
}

// Use cached connection in development to prevent connection pool exhaustion
// during hot reloads. In production, this simply initializes the cache.
const cached: MongooseCache = global.mongoose ?? { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

/**
 * Connects to MongoDB and returns the cached connection.
 * Reuses existing connection if available to prevent multiple connections.
 */
async function connectToDatabase(): Promise<Connection> {
  // Return cached connection if already established
  if (cached.conn) {
    return cached.conn;
  }

  // Create new connection promise if none exists
  if (!cached.promise) {
    if (!MONGODB_URI) {
      throw new Error("Please define the MONGODB_URI environment variable");
    }

    const opts: mongoose.ConnectOptions = {
      bufferCommands: false, // Disable buffering for faster failure detection
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose.connection;
    });
  }

  // Await and cache the connection
  cached.conn = await cached.promise;
  return cached.conn;
}

export default connectToDatabase;
