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
 * GET /api/projects/[id] — Get a project by ID with all relations
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = await db.tourProject.findUnique({
      where: { id },
      include: projectInclude,
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/projects/[id] — Update a project by ID
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check project exists
    const existing = await db.tourProject.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    const { name, description, thumbnail, isPublic, shareSlug } = body;
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (thumbnail !== undefined) updateData.thumbnail = thumbnail || null;
    if (isPublic !== undefined) updateData.isPublic = isPublic;
    if (shareSlug !== undefined) updateData.shareSlug = shareSlug || null;

    const project = await db.tourProject.update({
      where: { id },
      data: updateData,
      include: projectInclude,
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/projects/[id] — Delete a project by ID
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check project exists
    const existing = await db.tourProject.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    await db.tourProject.delete({ where: { id } });

    return NextResponse.json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}
