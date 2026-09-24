import type { TourProject } from "./store/tour-project-store";

class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload && typeof payload.error === "string"
        ? payload.error
        : `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status);
  }

  return payload as T;
}

export async function listProjects(): Promise<TourProject[]> {
  const response = await fetch("/api/projects", {
    method: "GET",
    cache: "no-store",
  });

  return parseResponse<TourProject[]>(response);
}

export async function loadProject(
  projectId: string
): Promise<TourProject | undefined> {
  const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}`, {
    method: "GET",
    cache: "no-store",
  });

  if (response.status === 404) return undefined;
  return parseResponse<TourProject>(response);
}

export async function saveProject(
  project: TourProject
): Promise<TourProject> {
  const updateResponse = await fetch(
    `/api/projects/${encodeURIComponent(project.id)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(project),
    }
  );

  if (updateResponse.status !== 404) {
    return parseResponse<TourProject>(updateResponse);
  }

  const createResponse = await fetch("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(project),
  });

  return parseResponse<TourProject>(createResponse);
}

export async function deleteProject(projectId: string): Promise<void> {
  const response = await fetch(
    `/api/projects/${encodeURIComponent(projectId)}`,
    {
      method: "DELETE",
    }
  );

  await parseResponse<{ ok: true }>(response);
}

export interface UploadedAsset {
  url: string;
  pathname: string;
  contentType: string;
  size: number;
}

export async function uploadAsset(
  projectId: string,
  assetKey: string,
  file: File
): Promise<UploadedAsset> {
  const formData = new FormData();
  formData.set("file", file);
  formData.set("projectId", projectId);
  formData.set("assetKey", assetKey);

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  return parseResponse<UploadedAsset>(response);
}

export async function savePanorama(
  projectId: string,
  pointId: string,
  file: File
): Promise<string> {
  const uploaded = await uploadAsset(projectId, `panorama-${pointId}`, file);
  return uploaded.url;
}

export async function saveFile(
  projectId: string,
  fileKey: string,
  file: File
): Promise<string> {
  const uploaded = await uploadAsset(projectId, fileKey, file);
  return uploaded.url;
}
