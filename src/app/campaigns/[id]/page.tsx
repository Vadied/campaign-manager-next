import { redirect, notFound } from "next/navigation";
import { getSessionSafe, getCampaignWithRole } from "@/lib/auth-utils";
import Link from "next/link";
import { CampaignTabs } from "./CampaignTabs";

export default async function CampaignPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const session = await getSessionSafe();
  if (!session?.user) redirect("/login");
  const { id } = await params;
  const userId = (session.user as { id: string }).id;
  const result = await getCampaignWithRole(id, userId);
  if (!result) notFound();
  const { campaign, role } = result;
  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/dashboard" className="text-sm text-slate-400 hover:text-amber-400">
            ← Campagne
          </Link>
          <h1 className="mt-1 text-2xl font-bold">{campaign.name}</h1>
          <p className="text-sm text-slate-400">
            {campaign.game === "DND" ? "D&D" : "Daggerheart"}
            {role === "MASTER" && " · Tu sei il Master"}
          </p>
        </div>
      </div>
      <CampaignTabs campaignId={id} role={role} game={campaign.game} />
    </div>
  );
}
