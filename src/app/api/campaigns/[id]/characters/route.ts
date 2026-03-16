import { NextResponse } from "next/server";
import { getCampaignWithRole } from "@/lib/auth-utils";
import { getCurrentUserId } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1),
  game: z.enum(["DND", "DAGGERHEART"]),
  stats: z.record(z.string(), z.unknown()).optional(),
  notes: z.string().optional(),
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
  const characters = await prisma.character.findMany({
    where: { campaignId: id },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  return NextResponse.json(characters);
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
  if (result.role === "MASTER") return NextResponse.json({ error: "Il master non aggiunge personaggi come giocatore" }, { status: 400 });
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Nome e gioco richiesti" }, { status: 400 });
  const campaign = result.campaign;
  if (parsed.data.game !== campaign.game) return NextResponse.json({ error: "Il personaggio deve usare il gioco della campagna" }, { status: 400 });
  const character = await prisma.character.create({
    data: {
      campaignId: id,
      userId,
      name: parsed.data.name,
      game: parsed.data.game,
      stats: parsed.data.stats ? JSON.stringify(parsed.data.stats) : null,
      notes: parsed.data.notes ?? null,
    },
  });
  return NextResponse.json(character);
}
