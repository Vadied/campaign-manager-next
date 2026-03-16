"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Campaign = { id: string; name: string; game: string; masterId: string };

export function CampaignList({ initialCampaigns }: { initialCampaigns: Campaign[] }) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [game, setGame] = useState<"DND" | "DAGGERHEART">("DND");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setError("");
    setLoading(true);
    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), game }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Errore");
      return;
    }
    setShowModal(false);
    setName("");
    router.push(`/campaigns/${data.id}`);
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
      >
        Nuova campagna
      </button>
      {showModal && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-xl border border-slate-700 bg-slate-900 p-6">
            <h2 className="mb-4 text-lg font-semibold">Nuova campagna</h2>
            <form onSubmit={create} className="flex flex-col gap-3">
              <div>
                <label className="mb-1 block text-sm text-slate-400">Nome campagna</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-400">Gioco</label>
                <select
                  value={game}
                  onChange={(e) => setGame(e.target.value as "DND" | "DAGGERHEART")}
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2"
                >
                  <option value="DND">Dungeons & Dragons</option>
                  <option value="DAGGERHEART">Daggerheart</option>
                </select>
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-lg bg-amber-600 py-2 font-medium text-white hover:bg-amber-700 disabled:opacity-50"
                >
                  Crea
                </button>
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setError(""); }}
                  className="rounded-lg border border-slate-600 px-4 py-2"
                >
                  Annulla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
