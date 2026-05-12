import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Types matching Prisma schema
export interface TourPoint {
  id: string;
  name: string;
  x: number;
  y: number;
  panoramaUrl: string;
  panoramaType: 'image' | 'video';
  pitch: number;
  yaw: number;
  fov: number;
}

export interface Connection {
  id: string;
  fromId: string;
  toId: string;
}

export interface Floor {
  id: string;
  name: string;
  order: number;
  planImage?: string;
  points: TourPoint[];
  connections: Connection[];
}

export interface Branding {
  logo?: string;
  primaryColor: string;
  companyName?: string;
  contactInfo?: string;
}

export interface Walkthrough {
  pointIds: string[];
  autoplay: boolean;
  interval: number;
  narrationUrl?: string;
}

export interface TourProject {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  floors: Floor[];
  branding?: Branding;
  walkthrough?: Walkthrough;
  isPublic: boolean;
  shareSlug?: string;
}

interface HistoryEntry {
  project: TourProject;
  label: string;
}

const MAX_HISTORY = 50;

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

interface TourProjectState {
  project: TourProject | null;
  selectedPointId: string | null;
  selectedFloorId: string | null;
  history: HistoryEntry[];
  historyIndex: number;

  // Project management
  createProject: (name: string, description?: string) => void;
  loadProject: (project: TourProject) => void;

  // Floor operations
  addFloor: (name: string) => void;
  updateFloor: (floorId: string, updates: Partial<Floor>) => void;
  removeFloor: (floorId: string) => void;
  selectFloor: (floorId: string) => void;

  // Point operations
  addPoint: (floorId: string, point: Omit<TourPoint, 'id'>) => void;
  updatePoint: (floorId: string, pointId: string, updates: Partial<TourPoint>) => void;
  removePoint: (floorId: string, pointId: string) => void;
  selectPoint: (pointId: string | null) => void;

  // Connection operations
  addConnection: (floorId: string, fromId: string, toId: string) => void;
  removeConnection: (floorId: string, connectionId: string) => void;

  // Branding
  updateBranding: (updates: Partial<Branding>) => void;

  // Walkthrough
  updateWalkthrough: (updates: Partial<Walkthrough>) => void;

  // Project settings
  updateProjectInfo: (updates: Partial<Pick<TourProject, 'name' | 'description' | 'thumbnail' | 'isPublic' | 'shareSlug'>>) => void;

  // Undo/Redo
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Internal
  _pushHistory: (label: string) => void;
}

export const useTourProjectStore = create<TourProjectState>()(
  devtools(
    (set, get) => ({
      project: null,
      selectedPointId: null,
      selectedFloorId: null,
      history: [],
      historyIndex: -1,

      _pushHistory: (label: string) => {
        const { project, history, historyIndex } = get();
        if (!project) return;

        // Truncate any future history beyond current index
        const truncatedHistory = history.slice(0, historyIndex + 1);
        const newEntry: HistoryEntry = {
          project: deepClone(project),
          label,
        };

        // Limit history to MAX_HISTORY entries
        const newHistory =
          truncatedHistory.length >= MAX_HISTORY
            ? [...truncatedHistory.slice(truncatedHistory.length - MAX_HISTORY + 1), newEntry]
            : [...truncatedHistory, newEntry];

        set({
          history: newHistory,
          historyIndex: newHistory.length - 1,
        });
      },

      createProject: (name: string, description?: string) => {
        const defaultFloor: Floor = {
          id: generateId(),
          name: 'Floor 1',
          order: 0,
          points: [],
          connections: [],
        };

        const project: TourProject = {
          id: generateId(),
          name,
          description,
          floors: [defaultFloor],
          branding: {
            primaryColor: '#3B82F6',
          },
          walkthrough: {
            pointIds: [],
            autoplay: false,
            interval: 5,
          },
          isPublic: false,
        };

        set({
          project,
          selectedFloorId: defaultFloor.id,
          selectedPointId: null,
          history: [{ project: deepClone(project), label: 'Project created' }],
          historyIndex: 0,
        });
      },

      loadProject: (project: TourProject) => {
        const firstFloorId = project.floors[0]?.id ?? null;
        set({
          project: deepClone(project),
          selectedFloorId: firstFloorId,
          selectedPointId: null,
          history: [{ project: deepClone(project), label: 'Project loaded' }],
          historyIndex: 0,
        });
      },

      addFloor: (name: string) => {
        const { project } = get();
        if (!project) return;

        const newFloor: Floor = {
          id: generateId(),
          name,
          order: project.floors.length,
          points: [],
          connections: [],
        };

        set({
          project: {
            ...project,
            floors: [...project.floors, newFloor],
          },
          selectedFloorId: newFloor.id,
          selectedPointId: null,
        });

        get()._pushHistory(`Added floor "${name}"`);
      },

      updateFloor: (floorId: string, updates: Partial<Floor>) => {
        const { project } = get();
        if (!project) return;

        set({
          project: {
            ...project,
            floors: project.floors.map((f) =>
              f.id === floorId ? { ...f, ...updates } : f
            ),
          },
        });

        get()._pushHistory('Updated floor');
      },

      removeFloor: (floorId: string) => {
        const { project, selectedFloorId } = get();
        if (!project) return;
        if (project.floors.length <= 1) return; // Don't remove last floor

        const newFloors = project.floors.filter((f) => f.id !== floorId);
        const newSelectedFloorId =
          selectedFloorId === floorId
            ? newFloors[0]?.id ?? null
            : selectedFloorId;

        set({
          project: { ...project, floors: newFloors },
          selectedFloorId: newSelectedFloorId,
          selectedPointId: null,
        });

        get()._pushHistory('Removed floor');
      },

      selectFloor: (floorId: string) => {
        set({ selectedFloorId: floorId, selectedPointId: null });
      },

      addPoint: (floorId: string, point: Omit<TourPoint, 'id'>) => {
        const { project } = get();
        if (!project) return;

        const newPoint: TourPoint = {
          ...point,
          id: generateId(),
        };

        set({
          project: {
            ...project,
            floors: project.floors.map((f) =>
              f.id === floorId
                ? { ...f, points: [...f.points, newPoint] }
                : f
            ),
          },
          selectedPointId: newPoint.id,
        });

        get()._pushHistory(`Added point "${point.name}"`);
      },

      updatePoint: (floorId: string, pointId: string, updates: Partial<TourPoint>) => {
        const { project } = get();
        if (!project) return;

        set({
          project: {
            ...project,
            floors: project.floors.map((f) =>
              f.id === floorId
                ? {
                    ...f,
                    points: f.points.map((p) =>
                      p.id === pointId ? { ...p, ...updates } : p
                    ),
                  }
                : f
            ),
          },
        });

        get()._pushHistory('Updated point');
      },

      removePoint: (floorId: string, pointId: string) => {
        const { project, selectedPointId } = get();
        if (!project) return;

        // Also remove connections involving this point
        set({
          project: {
            ...project,
            floors: project.floors.map((f) => {
              if (f.id === floorId) {
                return {
                  ...f,
                  points: f.points.filter((p) => p.id !== pointId),
                  connections: f.connections.filter(
                    (c) => c.fromId !== pointId && c.toId !== pointId
                  ),
                };
              }
              return f;
            }),
          },
          selectedPointId: selectedPointId === pointId ? null : selectedPointId,
        });

        get()._pushHistory('Removed point');
      },

      selectPoint: (pointId: string | null) => {
        set({ selectedPointId: pointId });
      },

      addConnection: (floorId: string, fromId: string, toId: string) => {
        const { project } = get();
        if (!project) return;

        const newConnection: Connection = {
          id: generateId(),
          fromId,
          toId,
        };

        set({
          project: {
            ...project,
            floors: project.floors.map((f) =>
              f.id === floorId
                ? { ...f, connections: [...f.connections, newConnection] }
                : f
            ),
          },
        });

        get()._pushHistory('Added connection');
      },

      removeConnection: (floorId: string, connectionId: string) => {
        const { project } = get();
        if (!project) return;

        set({
          project: {
            ...project,
            floors: project.floors.map((f) =>
              f.id === floorId
                ? {
                    ...f,
                    connections: f.connections.filter((c) => c.id !== connectionId),
                  }
                : f
            ),
          },
        });

        get()._pushHistory('Removed connection');
      },

      updateBranding: (updates: Partial<Branding>) => {
        const { project } = get();
        if (!project) return;

        set({
          project: {
            ...project,
            branding: { ...project.branding, ...updates },
          },
        });

        get()._pushHistory('Updated branding');
      },

      updateWalkthrough: (updates: Partial<Walkthrough>) => {
        const { project } = get();
        if (!project) return;

        set({
          project: {
            ...project,
            walkthrough: { ...project.walkthrough, ...updates },
          },
        });

        get()._pushHistory('Updated walkthrough');
      },

      updateProjectInfo: (updates: Partial<Pick<TourProject, 'name' | 'description' | 'thumbnail' | 'isPublic' | 'shareSlug'>>) => {
        const { project } = get();
        if (!project) return;

        set({
          project: { ...project, ...updates },
        });

        get()._pushHistory('Updated project info');
      },

      undo: () => {
        const { history, historyIndex } = get();
        if (historyIndex <= 0) return;

        const newIndex = historyIndex - 1;
        const entry = history[newIndex];

        set({
          project: deepClone(entry.project),
          historyIndex: newIndex,
          selectedPointId: null,
        });
      },

      redo: () => {
        const { history, historyIndex } = get();
        if (historyIndex >= history.length - 1) return;

        const newIndex = historyIndex + 1;
        const entry = history[newIndex];

        set({
          project: deepClone(entry.project),
          historyIndex: newIndex,
          selectedPointId: null,
        });
      },

      canUndo: () => {
        const { historyIndex } = get();
        return historyIndex > 0;
      },

      canRedo: () => {
        const { history, historyIndex } = get();
        return historyIndex < history.length - 1;
      },
    }),
    { name: 'TourProjectStore' }
  )
);
