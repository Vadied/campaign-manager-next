"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

type Note = { id: string; title: string | null; content: string; author: { name: string | null }; updatedAt: string };

export function NotesSection({ campaignId, compact }: { campaignId: string; compact?: boolean }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/campaigns/${campaignId}/notes`)
      .then((r) => r.ok ? r.json() : [])
      .then(setNotes)
      .finally(() => setLoading(false));
  }, [campaignId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    const res = await fetch(`/api/campaigns/${campaignId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim() || undefined, content: content.trim() }),
    });
    setSubmitting(false);
    if (res.ok) {
      const note = await res.json();
      setNotes((n) => [note, ...n]);
      setTitle("");
      setContent("");
      setShowForm(false);
    }
  }

  if (loading) return <p className="text-slate-400">Caricamento note...</p>;
  const toShow = compact ? notes.slice(0, 3) : notes;

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Note</h2>
        {!compact && (
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="rounded bg-amber-600 px-3 py-1 text-sm text-white hover:bg-amber-700"
          >
            {showForm ? "Annulla" : "Nuova nota"}
          </button>
        )}
      </div>
      {showForm && (
        <form onSubmit={submit} className="mb-4 flex flex-col gap-2 rounded-lg border border-slate-700 bg-slate-800/50 p-3">
          <input
            type="text"
            placeholder="Titolo (opzionale)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded border border-slate-600 bg-slate-800 px-3 py-2 text-sm"
          />
          <textarea
            placeholder="Contenuto"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            required
            className="rounded border border-slate-600 bg-slate-800 px-3 py-2 text-sm"
          />
          <button type="submit" disabled={submitting} className="self-end rounded bg-amber-600 px-3 py-1 text-sm text-white disabled:opacity-50">
            Salva
          </button>
        </form>
      )}
      <ul className="space-y-2">
        {toShow.length === 0 ? (
          <li className="text-sm text-slate-500">Nessuna nota.</li>
        ) : (
          toShow.map((n) => (
            <li key={n.id} className="rounded-lg border border-slate-700 bg-slate-800/30 p-3">
              {n.title && <p className="font-medium text-slate-200">{n.title}</p>}
              <p className="whitespace-pre-wrap text-sm text-slate-300">{n.content}</p>
              <p className="mt-1 text-xs text-slate-500">
                {n.author.name || "—"} · {format(new Date(n.updatedAt), "d MMM yyyy", { locale: it })}
              </p>
            </li>
          ))
        )}
      </ul>
      {compact && notes.length > 3 && (
        <p className="mt-2 text-sm text-slate-500">Vai al tab Note per vedere tutte.</p>
      )}
    </section>
  );
}
