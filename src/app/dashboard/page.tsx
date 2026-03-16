import { redirect } from "next/navigation";
import { getSessionSafe } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { CampaignList } from "./CampaignList";

export default async function DashboardPage() {
  const session = await getSessionSafe();
  if (!session?.user) redirect("/login");
  const userId = (session.user as { id: string }).id;
  const asMaster = await prisma.campaign.findMany({
    where: { masterId: userId },
    include: { master: { select: { name: true, email: true } } },
  });
  const asMember = await prisma.campaign.findMany({
    where: { members: { some: { userId } } },
    include: { master: { select: { name: true, email: true } } },
  });
  const all = [...asMaster, ...asMember.filter((c) => !asMaster.some((m) => m.id === c.id))];
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Le mie campagne</h1>
        <CampaignList initialCampaigns={all} />
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {all.length === 0 ? (
          <li className="col-span-2 rounded-xl border border-slate-700 bg-slate-800/50 p-6 text-center text-slate-400">
            Nessuna campagna. Creane una o accetta un invito.
          </li>
        ) : (
          all.map((c) => (
            <li key={c.id}>
              <Link
                href={`/campaigns/${c.id}`}
                className="block rounded-xl border border-slate-700 bg-slate-800/50 p-4 transition hover:border-amber-500/50 hover:bg-slate-800"
              >
                <span className="font-semibold text-white">{c.name}</span>
                <span className="ml-2 rounded bg-slate-700 px-1.5 py-0.5 text-xs">
                  {c.game === "DND" ? "D&D" : "Daggerheart"}
                </span>
                {c.masterId === userId && (
                  <span className="ml-2 text-xs text-amber-400">Master</span>
                )}
                <p className="mt-1 text-sm text-slate-400">
                  Master: {c.master?.name || c.master?.email || c.masterId}
                </p>
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
