import { getPendingRegistrations } from "@/actions/register";
import { RegistrationsTable } from "@/components/features/dashboard/RegistrationsTable";

export const metadata = {
  title: "Pendaftar Baru - ADORA BBC",
};

export default async function RegistrationsPage() {
  const registrations = await getPendingRegistrations();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-10">
      <div className="border-b border-border/50 pb-6 md:pb-8">
        <p className="max-w-3xl text-sm text-muted-foreground">
          Konfirmasi pembayaran pendaftar dari formulir web sebelum dipindahkan
          ke data pemain.
        </p>
      </div>

      <RegistrationsTable registrations={registrations} />
    </div>
  );
}
