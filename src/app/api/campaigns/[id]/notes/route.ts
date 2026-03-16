import { NextResponse } from "next/server";
import { getCampaignWithRole } from "@/lib/auth-utils";
import { getCurrentUserId } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({ title: z.string().optional(), content: z.string().min(1) });

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const result = await getCampaignWithRole(id, userId);
  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const notes = await prisma.campaignNote.findMany({
    where: { campaignId: id },
    include: { author: { select: { id: true, name: true } } },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(notes);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const result = await getCampaignWithRole(id, userId);
  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Contenuto richiesto" }, { status: 400 });
  const note = await prisma.campaignNote.create({
    data: {
      campaignId: id,
      authorId: userId,
      title: parsed.data.title ?? null,
      content: parsed.data.content,
    },
  });
  return NextResponse.json(note);
}
