import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import net from "net";
import dns from "dns";
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
const dbHost = isLocal ? "" : new URL(connectionString).hostname;

const client =
  global.__pgClient ??
  postgres(connectionString, {
    ssl: isLocal ? false : {
      rejectUnauthorized: false,
      servername: dbHost,
    },
    max: 10,
    prepare: !connectionString.includes("-pooler"),
    socket: isLocal ? undefined : (options: any) => {
      const host = Array.isArray(options.host) ? options.host[0] : options.host;
      const port = Array.isArray(options.port) ? options.port[0] : options.port;
      return net.connect({
        host,
        port,
        path: options.path,
        lookup: (hostname, lookupOptions, callback) => {
          dns.lookup(hostname, { ...lookupOptions, family: 4 }, callback);
        }
      });
    }
  } as any);

if (process.env.NODE_ENV !== "production") global.__pgClient = client;

export const db = drizzle(client, { schema });
