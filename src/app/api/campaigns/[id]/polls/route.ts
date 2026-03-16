import { NextResponse } from "next/server";
import { getCampaignWithRole, isMaster } from "@/lib/auth-utils";
import { getCurrentUserId } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  dates: z.array(z.string()),
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
  const polls = await prisma.sessionPoll.findMany({
    where: { campaignId: id },
    include: {
      options: { include: { votes: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(polls);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const result = await getCampaignWithRole(id, userId);
  if (!result || !isMaster(result.role)) return NextResponse.json({ error: "Solo il master può creare sondaggi" }, { status: 403 });
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success || !parsed.data.dates.length) return NextResponse.json({ error: "Inserisci almeno una data" }, { status: 400 });
  const poll = await prisma.sessionPoll.create({
    data: {
      campaignId: id,
      options: {
        create: parsed.data.dates.map((d) => ({ dateTime: new Date(d) })),
      },
    },
    include: { options: true },
  });
  return NextResponse.json(poll);
}
