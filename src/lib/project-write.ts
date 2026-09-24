import { z } from "zod";
import { db } from "@/lib/db";
import { projectInclude } from "@/lib/project-server";

const pointSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(160),
  x: z.number().finite(),
  y: z.number().finite(),
  panoramaUrl: z.string(),
  panoramaType: z.enum(["image", "video"]).default("image"),
  pitch: z.number().finite().min(-90).max(90).default(0),
  yaw: z.number().finite().min(-360).max(360).default(0),
  fov: z.number().finite().min(20).max(140).default(75),
});

const connectionSchema = z.object({
  id: z.string().min(1),
  fromId: z.string().min(1),
  toId: z.string().min(1),
});

const floorSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(160),
  order: z.number().int().min(0),
  planImage: z.string().optional(),
  points: z.array(pointSchema),
  connections: z.array(connectionSchema),
});

export const clientProjectSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(180),
  description: z.string().trim().max(2000).optional(),
  thumbnail: z.string().optional(),
  floors: z.array(floorSchema).min(1),
  branding: z
    .object({
      logo: z.string().optional(),
      primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#3B82F6"),
      companyName: z.string().max(180).optional(),
      contactInfo: z.string().max(1000).optional(),
    })
    .optional(),
  walkthrough: z
    .object({
      pointIds: z.array(z.string()),
      autoplay: z.boolean().default(false),
      interval: z.number().int().min(2).max(120).default(5),
      narrationUrl: z.string().optional(),
    })
    .optional(),
  isPublic: z.boolean().default(false),
  shareSlug: z.string().trim().min(3).max(100).optional(),
});

export type ClientProjectInput = z.infer<typeof clientProjectSchema>;

function cleanOptional(value?: string) {
  const cleaned = value?.trim();
  return cleaned ? cleaned : null;
}

function floorCreates(project: ClientProjectInput) {
  return project.floors.map((floor) => ({
    id: floor.id,
    name: floor.name.trim(),
    order: floor.order,
    planImage: cleanOptional(floor.planImage),
    points: {
      create: floor.points.map((point) => ({
        id: point.id,
        name: point.name.trim(),
        x: point.x,
        y: point.y,
        panoramaUrl: point.panoramaUrl,
        panoramaType: point.panoramaType,
        pitch: point.pitch,
        yaw: point.yaw,
        fov: point.fov,
      })),
    },
  }));
}

function connectionCreates(project: ClientProjectInput) {
  const pointIds = new Set(project.floors.flatMap((floor) => floor.points.map((point) => point.id)));

  return project.floors.flatMap((floor) =>
    floor.connections
      .filter(
        (connection) =>
          connection.fromId !== connection.toId &&
          pointIds.has(connection.fromId) &&
          pointIds.has(connection.toId)
      )
      .map((connection) => ({
        id: connection.id,
        fromId: connection.fromId,
        toId: connection.toId,
      }))
  );
}

export async function createProjectForUser(
  rawProject: unknown,
  userId: string
) {
  const project = clientProjectSchema.parse(rawProject);

  return db.$transaction(async (tx) => {
    await tx.tourProject.create({
      data: {
        id: project.id,
        name: project.name,
        description: cleanOptional(project.description),
        thumbnail: cleanOptional(project.thumbnail),
        isPublic: project.isPublic,
        shareSlug: project.isPublic ? cleanOptional(project.shareSlug) : null,
        userId,
        floors: { create: floorCreates(project) },
        branding: {
          create: {
            logo: cleanOptional(project.branding?.logo),
            primaryColor: project.branding?.primaryColor ?? "#3B82F6",
            companyName: cleanOptional(project.branding?.companyName),
            contactInfo: cleanOptional(project.branding?.contactInfo),
          },
        },
        walkthrough: {
          create: {
            pointIds: JSON.stringify(project.walkthrough?.pointIds ?? []),
            autoplay: project.walkthrough?.autoplay ?? false,
            interval: project.walkthrough?.interval ?? 5,
            narrationUrl: cleanOptional(project.walkthrough?.narrationUrl),
          },
        },
      },
    });

    const connections = connectionCreates(project);
    if (connections.length > 0) {
      await tx.connection.createMany({
        data: connections,
        skipDuplicates: true,
      });
    }

    return tx.tourProject.findUniqueOrThrow({
      where: { id: project.id },
      include: projectInclude,
    });
  });
}

export async function updateProjectForUser(
  projectId: string,
  rawProject: unknown,
  userId: string
) {
  const project = clientProjectSchema.parse({ ...(rawProject as object), id: projectId });

  return db.$transaction(async (tx) => {
    const existing = await tx.tourProject.findFirst({
      where: { id: projectId, userId },
      select: { id: true },
    });

    if (!existing) return null;

    await tx.floor.deleteMany({ where: { projectId } });

    await tx.tourProject.update({
      where: { id: projectId },
      data: {
        name: project.name,
        description: cleanOptional(project.description),
        thumbnail: cleanOptional(project.thumbnail),
        isPublic: project.isPublic,
        shareSlug: project.isPublic ? cleanOptional(project.shareSlug) : null,
        floors: { create: floorCreates(project) },
      },
    });

    const connections = connectionCreates(project);
    if (connections.length > 0) {
      await tx.connection.createMany({
        data: connections,
        skipDuplicates: true,
      });
    }

    await tx.branding.upsert({
      where: { projectId },
      create: {
        projectId,
        logo: cleanOptional(project.branding?.logo),
        primaryColor: project.branding?.primaryColor ?? "#3B82F6",
        companyName: cleanOptional(project.branding?.companyName),
        contactInfo: cleanOptional(project.branding?.contactInfo),
      },
      update: {
        logo: cleanOptional(project.branding?.logo),
        primaryColor: project.branding?.primaryColor ?? "#3B82F6",
        companyName: cleanOptional(project.branding?.companyName),
        contactInfo: cleanOptional(project.branding?.contactInfo),
      },
    });

    await tx.walkthrough.upsert({
      where: { projectId },
      create: {
        projectId,
        pointIds: JSON.stringify(project.walkthrough?.pointIds ?? []),
        autoplay: project.walkthrough?.autoplay ?? false,
        interval: project.walkthrough?.interval ?? 5,
        narrationUrl: cleanOptional(project.walkthrough?.narrationUrl),
      },
      update: {
        pointIds: JSON.stringify(project.walkthrough?.pointIds ?? []),
        autoplay: project.walkthrough?.autoplay ?? false,
        interval: project.walkthrough?.interval ?? 5,
        narrationUrl: cleanOptional(project.walkthrough?.narrationUrl),
      },
    });

    return tx.tourProject.findUniqueOrThrow({
      where: { id: projectId },
      include: projectInclude,
    });
  });
}
