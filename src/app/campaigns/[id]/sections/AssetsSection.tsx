"use client";

import { useState, useEffect } from "react";

type Asset = { id: string; type: string; title: string; description: string | null; imagePath: string | null };

export function AssetsSection({ campaignId }: { campaignId: string }) {
  const [list, setList] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<"IMAGE" | "NPC" | "PLACE">("NPC");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imagePath, setImagePath] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/campaigns/${campaignId}/assets`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setList)
      .finally(() => setLoading(false));
  }, [campaignId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    const res = await fetch(`/api/campaigns/${campaignId}/assets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        title: title.trim(),
        description: description.trim() || undefined,
        imagePath: imagePath.trim() || undefined,
      }),
    });
    setSubmitting(false);
    if (res.ok) {
      const asset = await res.json();
      setList((l) => [asset, ...l]);
      setTitle("");
      setDescription("");
      setImagePath("");
      setShowForm(false);
    }
  }

  if (loading) return <p className="text-slate-400">Caricamento asset...</p>;

  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold">Asset (immagini, NPC, luoghi)</h2>
      <button
        type="button"
        onClick={() => setShowForm(!showForm)}
        className="mb-3 rounded bg-amber-600 px-3 py-1 text-sm text-white hover:bg-amber-700"
      >
        {showForm ? "Annulla" : "Aggiungi"}
      </button>
      {showForm && (
        <form onSubmit={submit} className="mb-4 rounded-lg border border-slate-700 bg-slate-800/50 p-4">
          <div className="mb-3">
            <label className="mb-1 block text-sm text-slate-400">Tipo</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as "IMAGE" | "NPC" | "PLACE")}
              className="w-full rounded border border-slate-600 bg-slate-800 px-3 py-2"
            >
              <option value="IMAGE">Immagine</option>
              <option value="NPC">NPC</option>
              <option value="PLACE">Luogo</option>
            </select>
          </div>
          <div className="mb-3">
            <label className="mb-1 block text-sm text-slate-400">Titolo</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded border border-slate-600 bg-slate-800 px-3 py-2"
            />
          </div>
          <div className="mb-3">
            <label className="mb-1 block text-sm text-slate-400">Descrizione</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded border border-slate-600 bg-slate-800 px-3 py-2 text-sm"
            />
          </div>
          <div className="mb-3">
            <label className="mb-1 block text-sm text-slate-400">URL immagine (opzionale)</label>
            <input
              type="text"
              value={imagePath}
              onChange={(e) => setImagePath(e.target.value)}
              placeholder="https://..."
              className="w-full rounded border border-slate-600 bg-slate-800 px-3 py-2 text-sm"
            />
          </div>
          <button type="submit" disabled={submitting} className="rounded bg-amber-600 px-3 py-1 text-sm text-white disabled:opacity-50">
            Salva
          </button>
        </form>
      )}
      <ul className="grid gap-3 sm:grid-cols-2">
        {list.length === 0 ? (
          <li className="col-span-2 text-sm text-slate-500">Nessun asset.</li>
        ) : (
          list.map((a) => (
            <li key={a.id} className="rounded-lg border border-slate-700 bg-slate-800/30 p-3">
              <span className="rounded bg-slate-700 px-1.5 py-0.5 text-xs">{a.type}</span>
              <p className="mt-2 font-medium">{a.title}</p>
              {a.description && <p className="mt-1 text-sm text-slate-400">{a.description}</p>}
              {a.imagePath && (
                <img src={a.imagePath} alt={a.title} className="mt-2 max-h-40 w-full rounded object-cover" />
              )}
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
