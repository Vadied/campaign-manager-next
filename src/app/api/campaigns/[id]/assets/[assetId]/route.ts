import { NextResponse } from "next/server";
import { getCampaignWithRole, isMaster } from "@/lib/auth-utils";
import { getCurrentUserId } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  imagePath: z.string().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; assetId: string }> }
) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, assetId } = await params;
  const result = await getCampaignWithRole(id, userId);
  if (!result || !isMaster(result.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const asset = await prisma.asset.findFirst({
    where: { id: assetId, campaignId: id },
  });
  if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dati non validi" }, { status: 400 });
  const updated = await prisma.asset.update({
    where: { id: assetId },
    data: {
      ...(parsed.data.title && { title: parsed.data.title }),
      ...(parsed.data.description !== undefined && { description: parsed.data.description }),
      ...(parsed.data.imagePath !== undefined && { imagePath: parsed.data.imagePath }),
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; assetId: string }> }
) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, assetId } = await params;
  const result = await getCampaignWithRole(id, userId);
  if (!result || !isMaster(result.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await prisma.asset.deleteMany({ where: { id: assetId, campaignId: id } });
  return NextResponse.json({ ok: true });
}
