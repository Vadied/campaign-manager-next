import { NextResponse } from "next/server";
import { getCampaignWithRole } from "@/lib/auth-utils";
import { getCurrentUserId } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({ toId: z.string(), content: z.string().min(1) });

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const result = await getCampaignWithRole(id, userId);
  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { searchParams } = new URL(req.url);
  const withUserId = searchParams.get("with");
  if (!withUserId) {
    const threads = await prisma.privateMessage.findMany({
      where: { campaignId: id, OR: [{ fromId: userId }, { toId: userId }] },
      include: { from: { select: { id: true, name: true, email: true } }, to: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });
    const seen = new Set<string>();
    const list = threads.filter((m) => {
      const other = m.fromId === userId ? m.toId : m.fromId;
      if (seen.has(other)) return false;
      seen.add(other);
      return true;
    });
    return NextResponse.json(list.map((m) => ({ other: m.fromId === userId ? m.to : m.from, lastMessage: m })));
  }
  const messages = await prisma.privateMessage.findMany({
    where: {
      campaignId: id,
      OR: [
        { fromId: userId, toId: withUserId },
        { fromId: withUserId, toId: userId },
      ],
    },
    include: { from: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });
  await prisma.privateMessage.updateMany({
    where: { campaignId: id, toId: userId, fromId: withUserId },
    data: { readAt: new Date() },
  });
  return NextResponse.json(messages);
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
  if (!parsed.success) return NextResponse.json({ error: "Destinatario e messaggio richiesti" }, { status: 400 });
  const campaign = result.campaign;
  const toId = parsed.data.toId;
  if (toId === userId) return NextResponse.json({ error: "Non puoi inviare a te stesso" }, { status: 400 });
  const isToMaster = campaign.masterId === toId;
  const isMaster = campaign.masterId === userId;
  const isToMember = campaign.members.some((m) => m.userId === toId);
  if (!isToMaster && !isToMember) return NextResponse.json({ error: "Destinatario non in campagna" }, { status: 400 });
  if (!isMaster && !isToMaster) return NextResponse.json({ error: "I giocatori possono scrivere solo al master" }, { status: 400 });
  if (isMaster && !isToMember && !isToMaster) return NextResponse.json({ error: "Il master può scrivere solo ai giocatori" }, { status: 400 });
  const message = await prisma.privateMessage.create({
    data: { campaignId: id, fromId: userId, toId, content: parsed.data.content },
    include: { to: { select: { id: true, name: true, email: true } } },
  });
  return NextResponse.json(message);
}
