"use client";

import { useState } from "react";
import { NotesSection } from "./sections/NotesSection";
import { SessionsSection } from "./sections/SessionsSection";
import { CharactersSection } from "./sections/CharactersSection";
import { AssetsSection } from "./sections/AssetsSection";
import { MessagesSection } from "./sections/MessagesSection";
import { InvitesSection } from "./sections/InvitesSection";

const TABS = [
  { id: "overview", label: "Panoramica" },
  { id: "notes", label: "Note" },
  { id: "sessions", label: "Sessioni" },
  { id: "characters", label: "Personaggi" },
  { id: "assets", label: "Asset", masterOnly: true },
  { id: "messages", label: "Messaggi" },
  { id: "invites", label: "Inviti", masterOnly: true },
] as const;

export function CampaignTabs({
  campaignId,
  role,
  game,
}: {
  campaignId: string;
  role: string;
  game: string;
}) {
  const [tab, setTab] = useState<string>("overview");
  const isMaster = role === "MASTER";
  const tabs = TABS.filter((t) => !("masterOnly" in t && t.masterOnly) || isMaster);

  return (
    <div>
      <div className="flex flex-wrap gap-1 border-b border-slate-800">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-t-lg px-3 py-2 text-sm font-medium transition ${
              tab === t.id
                ? "border border-slate-700 border-b-slate-900 bg-slate-900 text-amber-400"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="rounded-b-xl border border-t-0 border-slate-700 bg-slate-900/50 p-4 sm:p-6">
        {tab === "overview" && (
          <div className="space-y-6">
            <InvitesSection campaignId={campaignId} visible={isMaster} compact />
            <SessionsSection campaignId={campaignId} compact />
            <NotesSection campaignId={campaignId} compact />
          </div>
        )}
        {tab === "notes" && <NotesSection campaignId={campaignId} />}
        {tab === "sessions" && <SessionsSection campaignId={campaignId} />}
        {tab === "characters" && <CharactersSection campaignId={campaignId} game={game} role={role} />}
        {tab === "assets" && isMaster && <AssetsSection campaignId={campaignId} />}
        {tab === "messages" && <MessagesSection campaignId={campaignId} role={role} />}
        {tab === "invites" && isMaster && <InvitesSection campaignId={campaignId} visible />}
      </div>
    </div>
  );
}
