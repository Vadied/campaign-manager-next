import { NextResponse } from "next/server";
import { getCampaignWithRole } from "@/lib/auth-utils";
import { getCurrentUserId } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  stats: z.record(z.string(), z.unknown()).optional(),
  notes: z.string().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; charId: string }> }
) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, charId } = await params;
  const result = await getCampaignWithRole(id, userId);
  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const character = await prisma.character.findFirst({
    where: { id: charId, campaignId: id },
  });
  if (!character) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (character.userId !== userId) return NextResponse.json({ error: "Puoi modificare solo i tuoi personaggi" }, { status: 403 });
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dati non validi" }, { status: 400 });
  const updated = await prisma.character.update({
    where: { id: charId },
    data: {
      ...(parsed.data.name && { name: parsed.data.name }),
      ...(parsed.data.stats !== undefined && { stats: JSON.stringify(parsed.data.stats) }),
      ...(parsed.data.notes !== undefined && { notes: parsed.data.notes }),
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; charId: string }> }
) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, charId } = await params;
  const result = await getCampaignWithRole(id, userId);
  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const character = await prisma.character.findFirst({
    where: { id: charId, campaignId: id },
  });
  if (!character || character.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await prisma.character.delete({ where: { id: charId } });
  return NextResponse.json({ ok: true });
}
