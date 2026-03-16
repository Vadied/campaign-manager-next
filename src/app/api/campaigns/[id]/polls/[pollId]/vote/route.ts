import { NextResponse } from "next/server";
import { getCampaignWithRole } from "@/lib/auth-utils";
import { getCurrentUserId } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const voteSchema = z.object({
  optionId: z.string(),
  canAttend: z.boolean(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; pollId: string }> }
) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, pollId } = await params;
  const result = await getCampaignWithRole(id, userId);
  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const poll = await prisma.sessionPoll.findFirst({
    where: { id: pollId, campaignId: id },
    include: { options: true },
  });
  if (!poll || poll.closedAt) return NextResponse.json({ error: "Sondaggio chiuso o non trovato" }, { status: 400 });
  const body = await req.json();
  const parsed = voteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "optionId e canAttend richiesti" }, { status: 400 });
  const option = poll.options.find((o) => o.id === parsed.data!.optionId);
  if (!option) return NextResponse.json({ error: "Opzione non trovata" }, { status: 404 });
  await prisma.sessionPollVote.upsert({
    where: {
      optionId_userId: { optionId: parsed.data!.optionId, userId },
    },
    create: { optionId: parsed.data!.optionId, userId, canAttend: parsed.data!.canAttend },
    update: { canAttend: parsed.data!.canAttend },
  });
  return NextResponse.json({ ok: true });
}
