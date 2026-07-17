import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

declare global {
  // eslint-disable-next-line no-var
  var __pgClient: ReturnType<typeof postgres> | undefined;
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Add it to .env.local — see README.md for how to get a free connection string from Neon or Supabase."
  );
}

// Neon/Supabase require SSL; local Postgres during development does not.
const isLocal = connectionString.includes("localhost") || connectionString.includes("127.0.0.1");

const client =
  global.__pgClient ??
  postgres(connectionString, {
    ssl: isLocal ? false : "require",
    max: 10,
  });

if (process.env.NODE_ENV !== "production") global.__pgClient = client;

export const db = drizzle(client, { schema });
