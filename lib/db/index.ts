import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import net from "net";
import dns from "dns";
import * as schema from "./schema";

declare global {
  // eslint-disable-next-line no-var
  var __pgClient: ReturnType<typeof postgres> | undefined;
}

const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";

// During `next build` a missing DATABASE_URL must not crash module loading (Next imports
// every route to collect page data). Queries then fail individually and are handled by
// callers. At runtime a missing URL is still a hard, loud error.
const connectionString =
  process.env.DATABASE_URL ?? (isBuildPhase ? "postgresql://build:build@127.0.0.1:5432/build" : undefined);

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Add it to .env.local — see README.md for how to get a free connection string from Neon or Supabase."
  );
}

// Neon/Supabase require SSL; local Postgres during development does not.
const isLocal = connectionString.includes("localhost") || connectionString.includes("127.0.0.1");
const isServerless = Boolean(process.env.VERCEL);
const dbHost = isLocal ? "" : new URL(connectionString).hostname;

// Connection budget. Every serverless instance opens its own pool, so with 1000 people
// hitting the site at once a pool of 10 per instance would exhaust Neon's connection
// limit. On Vercel each instance handles requests one-ish at a time, so a tiny pool is
// right — use the Neon *pooled* host (the "-pooler" URL) so PgBouncer multiplexes them.
// Override with DB_POOL_MAX if you self-host on a long-running server.
const poolMax = Number(process.env.DB_POOL_MAX) || (isServerless ? 3 : 10);

// The custom IPv4 socket below is a workaround for networks with broken IPv6 DNS (some
// Pakistani ISPs, local dev). It is not needed on Vercel, where we use normal, fully
// verified TLS instead of disabling certificate checks.
const useIpv4Workaround = !isLocal && !isServerless;

const client =
  global.__pgClient ??
  postgres(connectionString, {
    ssl: isLocal
      ? false
      : isServerless
        ? "require"
        : { rejectUnauthorized: false, servername: dbHost },
    max: poolMax,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: !connectionString.includes("-pooler"),
    ...(useIpv4Workaround
      ? {
          socket: (options: { host: string | string[]; port: number | number[]; path?: string }) => {
            const host = Array.isArray(options.host) ? options.host[0] : options.host;
            const port = Array.isArray(options.port) ? options.port[0] : options.port;
            return net.connect({
              host,
              port,
              path: options.path,
              lookup: (hostname, lookupOptions, callback) => {
                dns.lookup(hostname, { ...lookupOptions, family: 4 }, callback);
              },
            });
          },
        }
      : {}),
  } as postgres.Options<Record<string, postgres.PostgresType>>);

if (process.env.NODE_ENV !== "production") global.__pgClient = client;

export const db = drizzle(client, { schema });
