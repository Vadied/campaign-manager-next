import { neon } from "@neondatabase/serverless";

/**
 * Client Neon serverless per query SQL raw.
 * Usa la stessa DATABASE_URL di Prisma (Postgres / Vercel Postgres / Neon).
 *
 * Esempio:
 *   import { sql } from "@/lib/neon";
 *   const rows = await sql`SELECT * FROM "User" WHERE id = ${id}`;
 *   await sql.transaction([sql`INSERT INTO ...`, sql`UPDATE ...`]);
 *
 * Per ORM e relazioni usa `prisma` da lib/prisma.
 *
 * @see https://github.com/neondatabase/serverless
 */
function getSql(): ReturnType<typeof neon> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required for Neon serverless.");
  return neon(url);
}

let cached: ReturnType<typeof neon> | null = null;

export const sql = new Proxy({} as ReturnType<typeof neon>, {
  apply(_, __, args: Parameters<ReturnType<typeof neon>>) {
    return (cached ??= getSql())(...(args as [TemplateStringsArray, ...unknown[]]));
  },
  get(_, prop) {
    return (cached ??= getSql())[prop as keyof ReturnType<typeof neon>];
  },
});
