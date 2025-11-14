import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookieStore = await cookies();

    // Remove the userId cookie
    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully",
    });

    response.cookies.delete("userId");

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ error: "Failed to logout" }, { status: 500 });
  }
}
