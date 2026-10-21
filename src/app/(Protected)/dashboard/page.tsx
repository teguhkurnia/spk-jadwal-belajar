import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { DashboardClient } from "./dashboard-client";
import { getActiveSemester } from "@/lib/semester";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const activeSemester = await getActiveSemester({
    supabase,
    userId: user.id,
  });

  return (
    <DashboardClient initialSemester={activeSemester} userEmail={user.email} />
  );
}
