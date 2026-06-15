import { headers } from "next/headers";

import RegisterPageClient from "./RegisterPageClient";

export default async function RegisterPage() {
  await headers();

  return <RegisterPageClient />;
}
