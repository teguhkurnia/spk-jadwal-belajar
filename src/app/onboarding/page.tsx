import { createClient } from "@/utils/supabase/server";
import OnboardingPageClient from "./onboarding-client";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function OnboardingPage() {
  // check if the user has completed onboarding
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return redirect("/login");
  }

  if (session.user.app_metadata?.is_onboarding_complete) {
    return redirect("/dashboard");
  }

  return <OnboardingPageClient />;
}
