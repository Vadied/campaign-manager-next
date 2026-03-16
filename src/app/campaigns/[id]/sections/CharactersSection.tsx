"use client";

import { useState, useEffect } from "react";

type Character = {
  id: string;
  name: string;
  game: string;
  stats: string | null;
  notes: string | null;
  user: { id: string; name: string | null };
};

const DND_STATS = ["Forza", "Destrezza", "Costituzione", "Intelligenza", "Saggezza", "Carisma"];
const DAGGERHEART_STATS = ["Cuore", "Spirito", "Rischio"];

export function CharactersSection({
  campaignId,
  game,
  role,
}: {
  campaignId: string;
  game: string;
  role: string;
}) {
  const [list, setList] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [stats, setStats] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const statLabels = game === "DND" ? DND_STATS : DAGGERHEART_STATS;

  useEffect(() => {
    fetch(`/api/campaigns/${campaignId}/characters`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setList)
      .finally(() => setLoading(false));
  }, [campaignId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    const res = await fetch(`/api/campaigns/${campaignId}/characters`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        game,
        stats: Object.keys(stats).length ? stats : undefined,
        notes: notes.trim() || undefined,
      }),
    });
    setSubmitting(false);
    if (res.ok) {
      const char = await res.json();
      setList((l) => [char, ...l]);
      setName("");
      setStats({});
      setNotes("");
      setShowForm(false);
    }
  }

  if (loading) return <p className="text-slate-400">Caricamento personaggi...</p>;

  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold">Personaggi</h2>
      {role === "PLAYER" && (
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="mb-3 rounded bg-amber-600 px-3 py-1 text-sm text-white hover:bg-amber-700"
        >
          {showForm ? "Annulla" : "Aggiungi personaggio"}
        </button>
      )}
      {showForm && (
        <form onSubmit={submit} className="mb-4 rounded-lg border border-slate-700 bg-slate-800/50 p-4">
          <div className="mb-3">
            <label className="mb-1 block text-sm text-slate-400">Nome</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded border border-slate-600 bg-slate-800 px-3 py-2"
            />
          </div>
          <div className="mb-3">
            <p className="mb-2 text-sm text-slate-400">Statistiche</p>
            <div className="flex flex-wrap gap-2">
              {statLabels.map((label) => (
                <div key={label} className="flex items-center gap-1">
                  <label className="text-xs text-slate-500">{label}</label>
                  <input
                    type="number"
                    min={0}
                    value={stats[label] ?? ""}
                    onChange={(e) => setStats((s) => ({ ...s, [label]: parseInt(e.target.value, 10) || 0 }))}
                    className="w-14 rounded border border-slate-600 bg-slate-800 px-2 py-1 text-center text-sm"
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="mb-3">
            <label className="mb-1 block text-sm text-slate-400">Note</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full rounded border border-slate-600 bg-slate-800 px-3 py-2 text-sm"
            />
          </div>
          <button type="submit" disabled={submitting} className="rounded bg-amber-600 px-3 py-1 text-sm text-white disabled:opacity-50">
            Salva
          </button>
        </form>
      )}
      <ul className="space-y-3">
        {list.length === 0 ? (
          <li className="text-sm text-slate-500">Nessun personaggio.</li>
        ) : (
          list.map((c) => (
            <li key={c.id} className="rounded-lg border border-slate-700 bg-slate-800/30 p-3">
              <p className="font-medium">{c.name}</p>
              <p className="text-xs text-slate-500">Giocatore: {c.user.name || c.user.id}</p>
              {c.stats && (
                <pre className="mt-2 overflow-x-auto rounded bg-slate-800/50 p-2 text-xs">
                  {typeof c.stats === "string" ? c.stats : JSON.stringify(c.stats, null, 2)}
                </pre>
              )}
              {c.notes && <p className="mt-2 text-sm text-slate-400">{c.notes}</p>}
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
