import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1),
  game: z.enum(["DND", "DAGGERHEART"]),
});

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const asMaster = await prisma.campaign.findMany({
    where: { masterId: userId },
    include: { master: { select: { name: true, email: true } } },
  });
  const asMember = await prisma.campaign.findMany({
    where: { members: { some: { userId } } },
    include: { master: { select: { name: true, email: true } } },
  });
  const ids = new Set(asMaster.map((c) => c.id));
  const combined = [...asMaster, ...asMember.filter((c) => !ids.has(c.id))];
  return NextResponse.json(combined);
}

export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Nome e gioco richiesti" }, { status: 400 });
  }
  const campaign = await prisma.campaign.create({
    data: {
      name: parsed.data.name,
      game: parsed.data.game,
      masterId: userId,
    },
  });
  return NextResponse.json(campaign);
}
