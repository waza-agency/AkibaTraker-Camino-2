import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "@db/schema";

console.log('Current environment variables:', {
  DATABASE_URL: process.env.DATABASE_URL ? 'exists' : 'missing',
  NODE_ENV: process.env.NODE_ENV
});

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const db = drizzle({
  connection: process.env.DATABASE_URL,
  schema,
  ws: ws,
});
