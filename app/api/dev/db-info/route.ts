import { db } from "@/lib/db";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return new Response("Not allowed", { status: 403 });
  }

  try {
    const schema = await db.$queryRawUnsafe(
      "SELECT current_schema() AS schema"
    );
    const search_path = await db.$queryRawUnsafe("SHOW search_path");
    const tables = await db.$queryRawUnsafe(
      "SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema IN ('public','ontargetv5') ORDER BY table_schema, table_name"
    );

    return new Response(
      JSON.stringify({ schema, search_path, tables }, null, 2),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }, null, 2), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
}
