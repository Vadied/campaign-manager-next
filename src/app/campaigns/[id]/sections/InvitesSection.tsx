"use client";

import { useState, useEffect } from "react";

type Invite = { id: string; email: string; token: string; createdAt: string };

export function InvitesSection({
  campaignId,
  visible,
  compact,
}: {
  campaignId: string;
  visible: boolean;
  compact?: boolean;
}) {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) return;
    fetch(`/api/campaigns/${campaignId}/invites`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setInvites);
  }, [campaignId, visible]);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    const res = await fetch(`/api/campaigns/${campaignId}/invites`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim() }),
    });
    setSubmitting(false);
    if (res.ok) {
      const inv = await res.json();
      setInvites((i) => [inv, ...i]);
      setEmail("");
    }
  }

  if (!visible) return null;

  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold">Invita giocatori</h2>
      {!compact && (
        <form onSubmit={invite} className="mb-3 flex flex-wrap gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@giocatore.it"
            className="rounded border border-slate-600 bg-slate-800 px-3 py-2 text-sm"
          />
          <button type="submit" disabled={submitting} className="rounded bg-amber-600 px-3 py-2 text-sm text-white hover:bg-amber-700 disabled:opacity-50">
            Invia invito
          </button>
        </form>
      )}
      <ul className="space-y-1 text-sm">
        {invites.length === 0 ? (
          <li className="text-slate-500">Nessun invito in sospeso.</li>
        ) : (
          invites.map((i) => (
            <li key={i.id} className="flex items-center justify-between gap-2 rounded bg-slate-800/50 px-2 py-1">
              <span>{i.email}</span>
              <span className="text-xs text-slate-500">
                Link: /campaigns/{campaignId}/join?token={i.token}
              </span>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
