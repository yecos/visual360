import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projectInclude, toClientProject } from "@/lib/project-server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const project = await db.tourProject.findFirst({
      where: {
        shareSlug: slug,
        isPublic: true,
      },
      include: projectInclude,
    });

    if (!project) {
      return NextResponse.json(
        { error: "Tour not found or not publicly accessible" },
        { status: 404 }
      );
    }

    return NextResponse.json(toClientProject(project), {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("Error fetching public tour:", error);
    return NextResponse.json(
      { error: "Failed to fetch tour" },
      { status: 500 }
    );
  }
}
