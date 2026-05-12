import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const projectInclude = {
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
};

/**
 * GET /api/projects — List all projects with relations
 */
export async function GET() {
  try {
    const projects = await db.tourProject.findMany({
      include: projectInclude,
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects — Create a new project
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, thumbnail, isPublic, shareSlug, userId } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    const project = await db.tourProject.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        thumbnail: thumbnail || null,
        isPublic: isPublic ?? false,
        shareSlug: shareSlug || null,
        userId: userId || null,
        floors: {
          create: {
            name: "Floor 1",
            order: 0,
          },
        },
        branding: {
          create: {
            primaryColor: "#3B82F6",
          },
        },
        walkthrough: {
          create: {
            pointIds: "[]",
            autoplay: false,
            interval: 5,
          },
        },
      },
      include: projectInclude,
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
