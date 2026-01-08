import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";

export async function GET(req: NextRequest) {
  const validation = await validateSessionForAPI(req);
  if (!validation.valid) return validation.response;

  try {
    const personas = await db.persona.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        promptTemplate: true,
        defaultModel: true,
      },
    });
    return NextResponse.json({ personas });
  } catch (error) {
    console.error("Error fetching personas:", error);
    return NextResponse.json(
      { error: "Failed to fetch personas" },
      { status: 500 }
    );
  }
}
