/**
 * IndexedDB wrapper for client-side storage of tour projects.
 * Stores projects, floor plan images, and panorama images as base64.
 */

import type { TourProject } from './store/tour-project-store';

const DB_NAME = 'visual360db';
const DB_VERSION = 1;

const STORES = {
  PROJECTS: 'projects',
  FILES: 'files',
} as const;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORES.PROJECTS)) {
        db.createObjectStore(STORES.PROJECTS, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(STORES.FILES)) {
        const fileStore = db.createObjectStore(STORES.FILES, { keyPath: 'key' });
        fileStore.createIndex('projectId', 'projectId', { unique: false });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(new Error(`Failed to open IndexedDB: ${request.error?.message}`));
    };
  });
}

function withTransaction<T>(
  storeName: string,
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, mode);
        const store = tx.objectStore(storeName);
        const request = callback(store);

        request.onsuccess = () => {
          resolve(request.result);
        };

        request.onerror = () => {
          reject(new Error(`IDB transaction failed: ${request.error?.message}`));
        };

        tx.oncomplete = () => {
          db.close();
        };
      }),
  );
}

// ─── Project Operations ─────────────────────────────────────────────────────

/**
 * Save a tour project to IndexedDB.
 */
export async function saveProject(project: TourProject): Promise<void> {
  await withTransaction(STORES.PROJECTS, 'readwrite', (store) =>
    store.put(project),
  );
}

/**
 * Load a single tour project by ID.
 */
export async function loadProject(projectId: string): Promise<TourProject | undefined> {
  return withTransaction<TourProject | undefined>(STORES.PROJECTS, 'readonly', (store) =>
    store.get(projectId),
  );
}

/**
 * List all saved tour projects (metadata only, no deep floor data).
 */
export async function listProjects(): Promise<TourProject[]> {
  return withTransaction<TourProject[]>(STORES.PROJECTS, 'readonly', (store) =>
    store.getAll(),
  );
}

/**
 * Delete a tour project and all associated files.
 */
export async function deleteProject(projectId: string): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORES.PROJECTS, STORES.FILES], 'readwrite');
    const projectStore = tx.objectStore(STORES.PROJECTS);
    const fileStore = tx.objectStore(STORES.FILES);
    const index = fileStore.index('projectId');

    // Delete the project
    projectStore.delete(projectId);

    // Delete all associated files
    const cursorRequest = index.openCursor(IDBKeyRange.only(projectId));
    cursorRequest.onsuccess = () => {
      const cursor = cursorRequest.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };

    tx.oncomplete = () => {
      db.close();
      resolve();
    };

    tx.onerror = () => {
      reject(new Error(`Failed to delete project: ${tx.error?.message}`));
    };
  });
}

// ─── File Operations ────────────────────────────────────────────────────────

interface StoredFile {
  key: string;
  projectId: string;
  data: string; // base64 encoded
  mimeType?: string;
  name?: string;
}

/**
 * Save a panorama image (or any file) as base64 to IndexedDB.
 * @param projectId - The project this file belongs to
 * @param fileKey - A unique key for the file (e.g., "panorama-{pointId}")
 * @param data - Base64 encoded data
 * @param mimeType - Optional MIME type
 * @param name - Optional file name
 */
export async function saveFile(
  projectId: string,
  fileKey: string,
  data: string,
  mimeType?: string,
  name?: string,
): Promise<void> {
  const file: StoredFile = {
    key: fileKey,
    projectId,
    data,
    mimeType,
    name,
  };

  await withTransaction(STORES.FILES, 'readwrite', (store) =>
    store.put(file),
  );
}

/**
 * Load a file by its key.
 * Returns the base64 data or undefined if not found.
 */
export async function loadFile(fileKey: string): Promise<string | undefined> {
  const result = await withTransaction<StoredFile | undefined>(
    STORES.FILES,
    'readonly',
    (store) => store.get(fileKey),
  );
  return result?.data;
}

/**
 * Load all files for a given project.
 */
export async function loadProjectFiles(projectId: string): Promise<StoredFile[]> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.FILES, 'readonly');
    const store = tx.objectStore(STORES.FILES);
    const index = store.index('projectId');
    const request = index.getAll(IDBKeyRange.only(projectId));

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(new Error(`Failed to load project files: ${request.error?.message}`));
    };

    tx.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Delete a file by its key.
 */
export async function deleteFile(fileKey: string): Promise<void> {
  await withTransaction(STORES.FILES, 'readwrite', (store) =>
    store.delete(fileKey),
  );
}

/**
 * Save a panorama image for a specific tour point.
 * Convenience wrapper around saveFile.
 */
export async function savePanorama(
  projectId: string,
  pointId: string,
  data: string,
  mimeType?: string,
  name?: string,
): Promise<void> {
  return saveFile(projectId, `panorama-${pointId}`, data, mimeType, name);
}

/**
 * Load a panorama image for a specific tour point.
 * Convenience wrapper around loadFile.
 */
export async function loadPanorama(pointId: string): Promise<string | undefined> {
  return loadFile(`panorama-${pointId}`);
}

/**
 * Convert a File object to a base64 string.
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = result.split(',')[1] || result;
      resolve(base64);
    };
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Create a data URL from base64 data with a given MIME type.
 */
export function base64ToDataURL(base64: string, mimeType: string = 'image/jpeg'): string {
  return `data:${mimeType};base64,${base64}`;
}
