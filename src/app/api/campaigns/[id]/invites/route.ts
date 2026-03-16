import { NextResponse } from "next/server";
import { getCampaignWithRole, isMaster } from "@/lib/auth-utils";
import { getCurrentUserId } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const inviteSchema = z.object({ email: z.string().email() });

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const result = await getCampaignWithRole(id, userId);
  if (!result || !isMaster(result.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const invites = await prisma.campaignInvite.findMany({
    where: { campaignId: id },
  });
  return NextResponse.json(invites);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const result = await getCampaignWithRole(id, userId);
  if (!result || !isMaster(result.role)) return NextResponse.json({ error: "Solo il master può invitare" }, { status: 403 });
  const body = await req.json();
  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Email richiesta" }, { status: 400 });
  const campaign = result.campaign;
  if (campaign.masterId === userId) {
    const masterUser = await prisma.user.findUnique({ where: { id: campaign.masterId } });
    if (masterUser?.email === parsed.data.email) return NextResponse.json({ error: "Sei già il master" }, { status: 400 });
  }
  const existingMember = await prisma.campaignMember.findFirst({
    where: { campaignId: id, user: { email: parsed.data.email } },
  });
  if (existingMember) return NextResponse.json({ error: "Giocatore già in campagna" }, { status: 409 });
  const existingInvite = await prisma.campaignInvite.findUnique({
    where: { campaignId_email: { campaignId: id, email: parsed.data.email } },
  });
  if (existingInvite) return NextResponse.json({ error: "Invito già inviato" }, { status: 409 });
  const invite = await prisma.campaignInvite.create({
    data: { campaignId: id, email: parsed.data.email, inviterId: userId },
  });
  return NextResponse.json(invite);
}
