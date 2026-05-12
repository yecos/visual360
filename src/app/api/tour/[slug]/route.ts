import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/tour/[slug] — Get a public tour by shareSlug
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const project = await db.tourProject.findUnique({
      where: { shareSlug: slug },
      include: {
        floors: {
          include: {
            points: {
              include: {
                fromConnections: true,
                toConnections: true,
              },
            },
          },
          orderBy: { order: "asc" as const },
        },
        branding: true,
        walkthrough: true,
      },
    });

    if (!project || !project.isPublic) {
      return NextResponse.json(
        { error: "Tour not found or not publicly accessible" },
        { status: 404 }
      );
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error("Error fetching public tour:", error);
    return NextResponse.json(
      { error: "Failed to fetch tour" },
      { status: 500 }
    );
  }
}
