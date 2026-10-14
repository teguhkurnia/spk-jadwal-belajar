import { Suspense } from "react";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { DashboardClient } from "./dashboard-client";

async function DashboardData() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // 1. Ambil Semester Aktif
  const { data: activeSemester } = await supabase
    .from("semesters")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single();

  return <DashboardClient initialSemester={activeSemester} userEmail={user.email} />;
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="p-6 text-muted-foreground">Memuat Dashboard...</div>}>
      <DashboardData />
    </Suspense>
  );
}

