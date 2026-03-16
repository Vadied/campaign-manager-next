import { NextResponse } from "next/server";
import { getCampaignWithRole } from "@/lib/auth-utils";
import { getCurrentUserId } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const result = await getCampaignWithRole(id, userId);
  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const sessions = await prisma.session.findMany({
    where: { campaignId: id },
    orderBy: { scheduledAt: "desc" },
  });
  return NextResponse.json(sessions);
}
