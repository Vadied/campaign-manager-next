"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";

export function NavClient() {
  return (
    <nav className="flex items-center gap-3">
      <Link
        href="/dashboard"
        className="rounded-lg px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
      >
        Le mie campagne
      </Link>
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="rounded-lg px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-white"
      >
        Esci
      </button>
    </nav>
  );
}
