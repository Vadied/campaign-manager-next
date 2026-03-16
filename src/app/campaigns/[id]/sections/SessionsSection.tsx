"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

type Session = { id: string; scheduledAt: string };
type Poll = {
  id: string;
  createdAt: string;
  closedAt: string | null;
  options: { id: string; dateTime: string; votes: { userId: string; canAttend: boolean }[] }[];
};

export function SessionsSection({ campaignId, compact }: { campaignId: string; compact?: boolean }) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPollForm, setShowPollForm] = useState(false);
  const [pollDates, setPollDates] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function load() {
    Promise.all([
      fetch(`/api/campaigns/${campaignId}/sessions`).then((r) => (r.ok ? r.json() : [])),
      fetch(`/api/campaigns/${campaignId}/polls`).then((r) => (r.ok ? r.json() : [])),
    ]).then(([s, p]) => {
      setSessions(s);
      setPolls(p);
    }).finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [campaignId]);

  async function createPoll(e: React.FormEvent) {
    e.preventDefault();
    const dates = pollDates.split("\n").map((d) => d.trim()).filter(Boolean).map((d) => new Date(d).toISOString());
    if (!dates.length) return;
    setSubmitting(true);
    const res = await fetch(`/api/campaigns/${campaignId}/polls`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dates }),
    });
    setSubmitting(false);
    if (res.ok) {
      setShowPollForm(false);
      setPollDates("");
      load();
    }
  }

  async function confirmDate(pollId: string, optionId: string) {
    const res = await fetch(`/api/campaigns/${campaignId}/polls/${pollId}/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optionId }),
    });
    if (res.ok) load();
  }

  async function vote(pollId: string, optionId: string, canAttend: boolean) {
    await fetch(`/api/campaigns/${campaignId}/polls/${pollId}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optionId, canAttend }),
    });
    load();
  }

  if (loading) return <p className="text-slate-400">Caricamento...</p>;

  const nextSession = sessions[0];
  const openPolls = polls.filter((p) => !p.closedAt);

  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold">Sessioni</h2>
      {nextSession && (
        <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
          <p className="text-sm text-amber-400">Prossima sessione</p>
          <p className="font-medium">{format(new Date(nextSession.scheduledAt), "EEEE d MMMM yyyy, HH:mm", { locale: it })}</p>
        </div>
      )}
      {!compact && (
        <>
          <div className="mb-3 flex justify-between">
            <span className="text-sm text-slate-400">Sondaggio disponibilità</span>
            <button
              type="button"
              onClick={() => setShowPollForm(!showPollForm)}
              className="rounded bg-slate-700 px-2 py-1 text-sm hover:bg-slate-600"
            >
              {showPollForm ? "Annulla" : "Nuovo sondaggio"}
            </button>
          </div>
          {showPollForm && (
            <form onSubmit={createPoll} className="mb-4 rounded border border-slate-700 bg-slate-800/50 p-3">
              <label className="mb-1 block text-sm text-slate-400">Date proposte (una per riga, formato ISO o data)</label>
              <textarea
                value={pollDates}
                onChange={(e) => setPollDates(e.target.value)}
                placeholder="2025-03-20T20:00\n2025-03-22T20:00"
                rows={3}
                className="w-full rounded border border-slate-600 bg-slate-800 px-3 py-2 text-sm"
              />
              <button type="submit" disabled={submitting} className="mt-2 rounded bg-amber-600 px-3 py-1 text-sm text-white disabled:opacity-50">
                Crea sondaggio
              </button>
            </form>
          )}
          {openPolls.map((poll) => (
            <div key={poll.id} className="mb-4 rounded-lg border border-slate-700 p-3">
              <p className="mb-2 text-sm text-slate-400">Sondaggio aperto</p>
              <ul className="space-y-2">
                {poll.options.map((opt) => (
                  <li key={opt.id} className="flex flex-wrap items-center justify-between gap-2 rounded bg-slate-800/50 px-3 py-2">
                    <span>{format(new Date(opt.dateTime), "d MMM yyyy, HH:mm", { locale: it })}</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => vote(poll.id, opt.id, true)}
                        className="rounded bg-emerald-700/50 px-2 py-1 text-xs hover:bg-emerald-700"
                      >
                        Posso
                      </button>
                      <button
                        type="button"
                        onClick={() => vote(poll.id, opt.id, false)}
                        className="rounded bg-red-900/50 px-2 py-1 text-xs hover:bg-red-900"
                      >
                        No
                      </button>
                      <button
                        type="button"
                        onClick={() => confirmDate(poll.id, opt.id)}
                        className="rounded bg-amber-600 px-2 py-1 text-xs text-white hover:bg-amber-700"
                      >
                        Conferma data
                      </button>
                    </div>
                    <span className="w-full text-xs text-slate-500">
                      {opt.votes.filter((v) => v.canAttend).length} possono
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </>
      )}
      {sessions.length > 1 && !compact && (
        <div>
          <p className="mb-2 text-sm text-slate-400">Sessioni passate</p>
          <ul className="space-y-1 text-sm">
            {sessions.slice(1, 6).map((s) => (
              <li key={s.id}>{format(new Date(s.scheduledAt), "d MMM yyyy", { locale: it })}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
