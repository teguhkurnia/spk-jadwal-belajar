import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import * as React from "react";

export const instant = false;

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // check if user is authenticated, if so redirect to dashboard
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { session },
  } = await supabase.auth.getSession();

  console.log("AuthLayout session", session);

  if (session) {
    // if user not completed onboarding, redirect to onboarding page
    if (!session.user.app_metadata?.is_onboarding_complete) {
      return redirect("/onboarding");
    }

    // redirect to dashboard if user is authenticated
    return redirect("/dashboard");
  }

  return (
    <>
      <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]" />
      <div className="flex min-h-dvh items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-6">{children}</div>
      </div>
    </>
  );
}
