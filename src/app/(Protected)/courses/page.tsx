import { Suspense } from "react";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { CoursesClient } from "./courses-client";
import { connection } from "next/server";
import { getMetadata } from "@/data";

export const metadata = getMetadata("/courses");

async function CoursesData() {
  await connection();
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: courses } = await supabase
    .from("courses")
    .select("*, milestones(readed_pages)")
    .order("created_at", { ascending: false });

  return <CoursesClient initialCourses={(courses as Course[]) || []} />;
}

export default function CoursesPage() {
  return (
    <Suspense fallback={<div className="p-6">Memuat data mata kuliah...</div>}>
      <CoursesData />
    </Suspense>
  );
}
