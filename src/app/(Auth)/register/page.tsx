import { getMetadata } from "@/data";
import RegisterPageClient from "./register-client";

export const metadata = getMetadata("/register");
export default function RegisterPage() {
  return <RegisterPageClient />;
}
