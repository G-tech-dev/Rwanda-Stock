import { MongoClient, type Db } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "rwanda_stock";

if (!uri) {
  // Keep this lazy: pages can build without database credentials configured.
}

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let clientPromise: Promise<MongoClient> | undefined;

export async function getDatabase(): Promise<Db> {
  if (!uri) throw new Error("MONGODB_URI is not configured.");
  if (process.env.NODE_ENV === "development") {
    global._mongoClientPromise ??= new MongoClient(uri).connect();
    clientPromise = global._mongoClientPromise;
  } else {
    clientPromise ??= new MongoClient(uri).connect();
  }
  const client = await clientPromise;
  return client.db(dbName);
}
