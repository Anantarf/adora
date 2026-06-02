import { getPendingRegistrations } from "@/actions/register";
import { RegistrationsTable } from "@/components/features/dashboard/RegistrationsTable";

export const metadata = {
  title: "Pendaftar Baru - ADORA BBC",
};

export default async function RegistrationsPage() {
  const registrations = await getPendingRegistrations();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-10">
      <div className="flex flex-col gap-2 border-b border-border/50 pb-6 md:pb-8">
        <h1 className="font-heading text-2xl text-foreground tracking-widest uppercase md:text-3xl">
          Pendaftar Baru
        </h1>
        <p className="text-sm text-muted-foreground">
          Calon anggota dari formulir web yang perlu dikonfirmasi pembayarannya
          sebelum dipindahkan ke data pemain.
        </p>
      </div>

      <RegistrationsTable registrations={registrations} />
    </div>
  );
}
