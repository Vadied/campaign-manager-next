import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "./auth";
import { prisma } from "./prisma";

/** Restituisce la sessione o null se non autenticato / JWT non decifrabile (es. NEXTAUTH_SECRET cambiato). */
export async function getSessionSafe(): Promise<Session | null> {
  try {
    return await getServerSession(authOptions);
  } catch (e) {
    const err = e as { name?: string; message?: string };
    if (err?.name === "JWEDecryptionFailed" || err?.message?.includes("decryption")) {
      return null;
    }
    throw e;
  }
}

export async function getSession() {
  return getSessionSafe();
}

export async function getCurrentUserId(): Promise<string | null> {
  const session = await getSessionSafe();
  return (session?.user as { id?: string })?.id ?? null;
}

export async function getCampaignWithRole(campaignId: string, userId: string) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: { master: true, members: { include: { user: true } } },
  });
  if (!campaign) return null;
  const isMaster = campaign.masterId === userId;
  const member = campaign.members.find((m) => m.userId === userId);
  if (!isMaster && !member) return null;
  const role = isMaster ? "MASTER" : "PLAYER";
  return { campaign, role };
}

export function isMaster(role: string) {
  return role === "MASTER";
}
