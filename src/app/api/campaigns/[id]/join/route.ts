import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const token = body.token as string | undefined;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const invite = await prisma.campaignInvite.findFirst({
    where: { campaignId: id, email: user.email, ...(token ? { token } : {}) },
  });
  if (!invite) return NextResponse.json({ error: "Invito non trovato" }, { status: 404 });
  await prisma.campaignMember.create({
    data: { campaignId: id, userId, role: "PLAYER" },
  });
  await prisma.campaignInvite.delete({ where: { id: invite.id } });
  return NextResponse.json({ ok: true });
}
