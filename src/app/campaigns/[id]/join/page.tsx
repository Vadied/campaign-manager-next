"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function JoinCampaignPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { data: session, status: sessionStatus } = useSession();
  const id = params.id as string;
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");

  async function accept() {
    if (sessionStatus !== "authenticated") {
      setStatus("error");
      setMessage("Devi accedere con l'email a cui è stato inviato l'invito.");
      return;
    }
    setStatus("loading");
    const res = await fetch(`/api/campaigns/${id}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(token ? { token } : {}),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setStatus("ok");
    } else {
      setStatus("error");
      setMessage(data.error || "Impossibile accettare l'invito.");
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-700 bg-slate-900/50 p-6 text-center">
        <h1 className="mb-4 text-xl font-bold text-amber-400">Invito a una campagna</h1>
        {status === "idle" && (
          <>
            {sessionStatus === "unauthenticated" && (
              <p className="mb-3 rounded bg-amber-900/30 p-2 text-sm text-amber-200">
                Accedi con l’email a cui è stato inviato l’invito, poi torna qui.
              </p>
            )}
            <p className="mb-4 text-sm text-slate-400">
              Hai ricevuto un invito. Clicca per unirti alla campagna.
            </p>
            {sessionStatus === "unauthenticated" ? (
              <Link
                href={`/login?callbackUrl=${encodeURIComponent(`/campaigns/${id}/join`)}`}
                className="inline-block w-full rounded-lg bg-amber-600 py-2 text-center font-medium text-white hover:bg-amber-700"
              >
                Accedi
              </Link>
            ) : (
            <button
              type="button"
              onClick={accept}
              className="w-full rounded-lg bg-amber-600 py-2 font-medium text-white hover:bg-amber-700"
            >
              Accetta invito
            </button>
            )}
          </>
        )}
        {status === "loading" && <p className="text-slate-400">Accesso in corso...</p>}
        {status === "ok" && (
          <>
            <p className="mb-4 text-emerald-400">Sei entrato nella campagna!</p>
            <Link href={`/campaigns/${id}`} className="inline-block rounded-lg bg-amber-600 px-4 py-2 text-white hover:bg-amber-700">
              Vai alla campagna
            </Link>
          </>
        )}
        {status === "error" && (
          <>
            <p className="mb-4 text-red-400">{message}</p>
            <Link href="/dashboard" className="text-amber-400 hover:underline">Torna alla dashboard</Link>
          </>
        )}
      </div>
    </div>
  );
}
