import { SupabaseClient } from "@supabase/supabase-js";

export const getActiveSemester = async ({
  supabase,
  userId,
}: {
  supabase: SupabaseClient;
  userId: string;
}): Promise<Semester> => {
  const { data: activeSemester, error: semError } = await supabase
    .from("semesters")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .single();

  console.log("Active semester:", userId, activeSemester);
  console.log("Active semester error:", semError);

  if (semError || !activeSemester) {
    throw new Error("Active semester not found");
  }

  return activeSemester;
};
