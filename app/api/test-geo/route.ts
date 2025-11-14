import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Test the ipapi.co API
    const response = await fetch("https://ipapi.co/json/");

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: `API returned status: ${response.status}`,
      });
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      message: "Geo-location API is working!",
      data,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
