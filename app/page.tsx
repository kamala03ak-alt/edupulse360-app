import { redirect } from "next/navigation";

import { getAuthContext } from "@/lib/auth/server";

export default async function Home() {
  const context = await getAuthContext();
  redirect(context ? "/app" : "/login");
}
