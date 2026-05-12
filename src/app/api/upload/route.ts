import { NextResponse } from "next/server";
import { saveUploadedFile } from "@/lib/storage-server";

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const ALLOWED_VIDEO_TYPES = ["video/mp4"];

const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];

const DEFAULT_MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * POST /api/upload — Upload a file
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: `Invalid file type: ${file.type}. Allowed types: ${ALLOWED_TYPES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Validate file size
    const maxFileSize = process.env.MAX_FILE_SIZE
      ? parseInt(process.env.MAX_FILE_SIZE, 10)
      : DEFAULT_MAX_FILE_SIZE;

    if (file.size > maxFileSize) {
      return NextResponse.json(
        {
          error: `File size exceeds maximum allowed size of ${maxFileSize / (1024 * 1024)}MB`,
        },
        { status: 400 }
      );
    }

    const url = await saveUploadedFile(file);

    return NextResponse.json({ url }, { status: 201 });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
