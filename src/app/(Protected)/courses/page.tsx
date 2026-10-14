import { Suspense } from "react";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { CoursesClient } from "./courses-client";

async function CoursesData() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: courses } = await supabase
    .from("courses")
    .select("*")
    .order("created_at", { ascending: false });

  return <CoursesClient initialCourses={courses || []} />;
}

export default function CoursesPage() {
  return (
    <Suspense fallback={<div className="p-6">Memuat data mata kuliah...</div>}>
      <CoursesData />
    </Suspense>
  );
}

