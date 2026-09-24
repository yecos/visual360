import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { db } from "@/lib/db";
import {
  getSessionUserId,
  projectInclude,
  toClientProject,
} from "@/lib/project-server";
import { createProjectForUser } from "@/lib/project-write";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const projects = await db.tourProject.findMany({
      where: { userId },
      include: projectInclude,
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(projects.map(toClientProject));
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const project = await createProjectForUser(body, userId);
    return NextResponse.json(toClientProject(project), { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid project payload", issues: error.issues },
        { status: 400 }
      );
    }

    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
