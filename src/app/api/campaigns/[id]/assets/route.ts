import { NextResponse } from "next/server";
import { getCampaignWithRole, isMaster } from "@/lib/auth-utils";
import { getCurrentUserId } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  type: z.enum(["IMAGE", "NPC", "PLACE"]),
  title: z.string().min(1),
  description: z.string().optional(),
  imagePath: z.string().optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const result = await getCampaignWithRole(id, userId);
  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const assets = await prisma.asset.findMany({
    where: { campaignId: id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(assets);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const result = await getCampaignWithRole(id, userId);
  if (!result || !isMaster(result.role)) return NextResponse.json({ error: "Solo il master può aggiungere asset" }, { status: 403 });
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Tipo e titolo richiesti" }, { status: 400 });
  const asset = await prisma.asset.create({
    data: {
      campaignId: id,
      type: parsed.data.type,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      imagePath: parsed.data.imagePath ?? null,
    },
  });
  return NextResponse.json(asset);
}
