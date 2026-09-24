import { getServerSession } from "next-auth";
import type { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";

export const projectInclude = {
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
} satisfies Prisma.TourProjectInclude;

export type ProjectWithRelations = Prisma.TourProjectGetPayload<{
  include: typeof projectInclude;
}>;

export async function getSessionUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}

export function toClientProject(project: ProjectWithRelations) {
  return {
    id: project.id,
    name: project.name,
    description: project.description ?? undefined,
    thumbnail: project.thumbnail ?? undefined,
    isPublic: project.isPublic,
    shareSlug: project.shareSlug ?? undefined,
    floors: project.floors.map((floor) => {
      const seen = new Set<string>();
      const connections = floor.points.flatMap((point) =>
        point.fromConnections
          .filter((connection) => {
            if (seen.has(connection.id)) return false;
            seen.add(connection.id);
            return true;
          })
          .map((connection) => ({
            id: connection.id,
            fromId: connection.fromId,
            toId: connection.toId,
          }))
      );

      return {
        id: floor.id,
        name: floor.name,
        order: floor.order,
        planImage: floor.planImage ?? undefined,
        points: floor.points.map((point) => ({
          id: point.id,
          name: point.name,
          x: point.x,
          y: point.y,
          panoramaUrl: point.panoramaUrl,
          panoramaType: point.panoramaType === "video" ? "video" : "image",
          pitch: point.pitch,
          yaw: point.yaw,
          fov: point.fov,
        })),
        connections,
      };
    }),
    branding: project.branding
      ? {
          logo: project.branding.logo ?? undefined,
          primaryColor: project.branding.primaryColor,
          companyName: project.branding.companyName ?? undefined,
          contactInfo: project.branding.contactInfo ?? undefined,
        }
      : undefined,
    walkthrough: project.walkthrough
      ? {
          pointIds: safeParsePointIds(project.walkthrough.pointIds),
          autoplay: project.walkthrough.autoplay,
          interval: project.walkthrough.interval,
          narrationUrl: project.walkthrough.narrationUrl ?? undefined,
        }
      : undefined,
  };
}

function safeParsePointIds(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}
