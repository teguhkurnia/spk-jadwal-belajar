import { getMetadata } from "@/data";
import LoginPageClient from "./login-client";

export const metadata = getMetadata("/login");

export default function LoginPage() {
  return <LoginPageClient />;
}
