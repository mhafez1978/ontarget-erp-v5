import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const companyId = searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID is required" },
        { status: 400 }
      );
    }

    // Fetch ALL active team members for the company (isFeatured filter removed from UI)
    const teamMembers = await db.companyStaff.findMany({
      where: {
        companyId,
        status: "ACTIVE",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: [{ displayOrder: "asc" }, { hireDate: "asc" }],
    });

    // Format the response
    const formattedMembers = teamMembers.map((member) => ({
      id: member.id,
      name: member.user.name || "Team Member",
      email: member.user.email,
      image: member.user.image,
      role: member.role,
      jobTitle: member.jobTitle,
      bio: member.bio,
      displayOrder: member.displayOrder || 0,
    }));

    return NextResponse.json({
      success: true,
      teamMembers: formattedMembers,
    });
  } catch (error) {
    console.error("Error fetching team members:", error);
    return NextResponse.json(
      { error: "Failed to fetch team members" },
      { status: 500 }
    );
  }
}
