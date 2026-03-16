import { NextResponse } from "next/server";
import { getCampaignWithRole, isMaster } from "@/lib/auth-utils";
import { getCurrentUserId } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const confirmSchema = z.object({ optionId: z.string() });

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; pollId: string }> }
) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, pollId } = await params;
  const result = await getCampaignWithRole(id, userId);
  if (!result || !isMaster(result.role)) return NextResponse.json({ error: "Solo il master può confermare la data" }, { status: 403 });
  const body = await req.json();
  const parsed = confirmSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "optionId richiesto" }, { status: 400 });
  const option = await prisma.sessionPollOption.findFirst({
    where: { id: parsed.data.optionId, pollId, poll: { campaignId: id } },
  });
  if (!option) return NextResponse.json({ error: "Opzione non trovata" }, { status: 404 });
  await prisma.$transaction([
    prisma.sessionPoll.update({
      where: { id: pollId },
      data: { closedAt: new Date() },
    }),
    prisma.session.create({
      data: { campaignId: id, scheduledAt: option.dateTime },
    }),
  ]);
  return NextResponse.json({ ok: true });
}
