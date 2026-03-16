"use client";

import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

type User = { id: string; name: string | null; email: string };
type Thread = { other: User; lastMessage: { content: string; createdAt: string; fromId: string } };
type Message = { id: string; content: string; fromId: string; from: { name: string | null }; createdAt: string };

export function MessagesSection({ campaignId, role }: { campaignId: string; role: string }) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/campaigns/${campaignId}/messages`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setThreads)
      .finally(() => setLoading(false));
  }, [campaignId]);

  useEffect(() => {
    if (!selectedUserId) {
      setMessages([]);
      return;
    }
    fetch(`/api/campaigns/${campaignId}/messages?with=${selectedUserId}`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setMessages);
  }, [campaignId, selectedUserId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || !selectedUserId) return;
    setSubmitting(true);
    const res = await fetch(`/api/campaigns/${campaignId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toId: selectedUserId, content: content.trim() }),
    });
    setSubmitting(false);
    if (res.ok) {
      const msg = await res.json();
      setMessages((m) => [...m, msg]);
      setContent("");
    }
  }

  if (loading) return <p className="text-slate-400">Caricamento messaggi...</p>;

  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold">Messaggi privati</h2>
      <p className="mb-3 text-sm text-slate-400">
        {role === "MASTER" ? "Invia messaggi ai giocatori." : "Invia messaggi al master."}
      </p>
      <div className="flex flex-col gap-4 sm:flex-row">
        <ul className="w-full shrink-0 space-y-1 sm:w-48">
          {threads.length === 0 ? (
            <li className="text-sm text-slate-500">Nessuna conversazione.</li>
          ) : (
            threads.map((t) => (
              <li key={t.other.id}>
                <button
                  type="button"
                  onClick={() => setSelectedUserId(t.other.id)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                    selectedUserId === t.other.id ? "bg-amber-600/20 text-amber-400" : "hover:bg-slate-800"
                  }`}
                >
                  {t.other.name || t.other.email}
                </button>
              </li>
            ))
          )}
        </ul>
        <div className="min-h-64 flex-1 rounded-lg border border-slate-700 bg-slate-800/30 flex flex-col">
          {!selectedUserId ? (
            <p className="p-4 text-sm text-slate-500">Seleziona una conversazione.</p>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-80">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`rounded-lg p-2 max-w-[85%] ${
                      m.fromId === selectedUserId ? "mr-auto bg-slate-700" : "ml-auto bg-amber-600/20"
                    }`}
                  >
                    <p className="text-sm">{m.content}</p>
                    <p className="text-xs text-slate-500 mt-1">{format(new Date(m.createdAt), "d MMM HH:mm", { locale: it })}</p>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
              <form onSubmit={send} className="flex gap-2 border-t border-slate-700 p-2">
                <input
                  type="text"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Scrivi un messaggio..."
                  className="flex-1 rounded border border-slate-600 bg-slate-800 px-3 py-2 text-sm"
                />
                <button type="submit" disabled={submitting} className="rounded bg-amber-600 px-3 py-2 text-sm text-white hover:bg-amber-700 disabled:opacity-50">
                  Invia
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
