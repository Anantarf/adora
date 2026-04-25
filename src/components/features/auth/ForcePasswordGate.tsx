"use client";

import { useSession } from "next-auth/react";
import { ForcePasswordDialog } from "./ForcePasswordDialog";

export function ForcePasswordGate({ children }: { children?: React.ReactNode }) {
  const { data: session, status } = useSession();

  // If loading or unauthenticated, we don't interfere.
  // The layout will handle unauthenticated redirects.
  if (status !== "authenticated" || !session?.user) {
    return <>{children}</>;
  }

  const mustChange = session.user.mustChangePassword === true;

  return (
    <>
      {children}
      {mustChange && <ForcePasswordDialog isOpen={true} />}
    </>
  );
}
