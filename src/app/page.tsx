import { redirect } from "next/navigation";
import { getSessionSafe } from "@/lib/auth-utils";

export default async function Home() {
  const session = await getSessionSafe();
  redirect(session ? "/dashboard" : "/login");
}
