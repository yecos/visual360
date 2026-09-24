import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUserId } from "@/lib/project-server";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "video/mp4",
]);

const DEFAULT_MAX_FILE_SIZE = 100 * 1024 * 1024;

function safeFileName(name: string) {
  return name
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 120);
}

export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Blob storage is not configured" },
      { status: 503 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const projectId = formData.get("projectId");
    const assetKey = formData.get("assetKey");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (typeof projectId !== "string" || !projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    const ownsProject = await db.tourProject.findFirst({
      where: { id: projectId, userId },
      select: { id: true },
    });

    if (!ownsProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Unsupported file type" },
        { status: 415 }
      );
    }

    const maxFileSize = process.env.MAX_FILE_SIZE
      ? Number.parseInt(process.env.MAX_FILE_SIZE, 10)
      : DEFAULT_MAX_FILE_SIZE;

    if (!Number.isFinite(maxFileSize) || file.size > maxFileSize) {
      return NextResponse.json(
        { error: "File exceeds the configured size limit" },
        { status: 413 }
      );
    }

    const key =
      typeof assetKey === "string" && assetKey.trim()
        ? safeFileName(assetKey.trim())
        : "asset";
    const fileName = safeFileName(file.name || "upload");
    const pathname = `visual360/${userId}/${projectId}/${key}-${fileName}`;

    const blob = await put(pathname, file, {
      access: "public",
      addRandomSuffix: true,
      multipart: file.size > 4 * 1024 * 1024,
    });

    return NextResponse.json(
      {
        url: blob.url,
        pathname: blob.pathname,
        contentType: file.type,
        size: file.size,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
