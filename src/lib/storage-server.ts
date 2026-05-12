import { writeFile, unlink, mkdir } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";

const UPLOADS_DIR = join(process.cwd(), "uploads");

/**
 * Ensure the uploads directory exists.
 */
async function ensureUploadsDir(): Promise<void> {
  await mkdir(UPLOADS_DIR, { recursive: true });
}

/**
 * Save an uploaded file to the uploads directory with a unique filename.
 * Returns the relative URL path for accessing the file.
 */
export async function saveUploadedFile(file: File): Promise<string> {
  await ensureUploadsDir();

  const originalName = file.name;
  const ext = originalName.includes(".")
    ? originalName.substring(originalName.lastIndexOf("."))
    : "";
  const uniqueName = `${uuidv4()}${ext}`;
  const filePath = join(UPLOADS_DIR, uniqueName);

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  await writeFile(filePath, buffer);

  return `/uploads/${uniqueName}`;
}

/**
 * Delete a file from the uploads directory given its relative URL path.
 */
export async function deleteFile(filePath: string): Promise<void> {
  try {
    // Extract filename from the relative path (e.g. "/uploads/abc.jpg" -> "abc.jpg")
    const filename = filePath.replace(/^\/uploads\//, "");
    const fullPath = join(UPLOADS_DIR, filename);
    await unlink(fullPath);
  } catch {
    // File may not exist, ignore errors
  }
}

/**
 * Get the full URL path for a file stored in uploads.
 */
export function getFileUrl(filePath: string): string {
  if (filePath.startsWith("/uploads/")) {
    return filePath;
  }
  return `/uploads/${filePath}`;
}
