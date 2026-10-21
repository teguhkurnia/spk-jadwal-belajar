import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { DashboardClient } from "./dashboard-client";
import { getActiveSemester } from "@/lib/semester";
import { connection } from "next/server";
import { getMetadata } from "@/data";

async function DashboardData() {
  await connection();

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const activeSemester = await getActiveSemester({
    supabase,
    userId: session!.user.id,
  });

  return (
    <DashboardClient
      initialSemester={activeSemester}
      userEmail={session!.user.email}
    />
  );
}

export const metadata = getMetadata("/dashboard");

export default function DashboardPage() {
  return <DashboardData />;
}
