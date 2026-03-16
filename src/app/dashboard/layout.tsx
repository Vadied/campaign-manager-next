import { redirect } from "next/navigation";
import { getSessionSafe } from "@/lib/auth-utils";
import Link from "next/link";
import { NavClient } from "./NavClient";

export default async function DashboardLayout({
  children,
}: { children: React.ReactNode }) {
  const session = await getSessionSafe();
  if (!session?.user) redirect("/login");
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-900/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3">
          <Link href="/dashboard" className="text-lg font-bold text-amber-400">
            Witchmaker
          </Link>
          <NavClient />
        </div>
      </header>
      <main className="flex-1 px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
