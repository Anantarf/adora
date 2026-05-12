import { getPendingRegistrations } from "@/actions/register";
import { RegistrationsTable } from "@/components/features/dashboard/RegistrationsTable";

export const metadata = {
  title: "Pendaftar Baru - ADORA BBC",
};

export default async function RegistrationsPage() {
  const registrations = await getPendingRegistrations();

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-10">
      <div className="flex flex-col gap-1 border-b border-border/50 pb-6">
        <h1 className="font-heading text-2xl md:text-4xl text-foreground tracking-widest uppercase">
          Pendaftar Baru
        </h1>
        <p className="text-muted-foreground text-sm font-medium tracking-wide">
          Calon anggota yang mengisi formulir pendaftaran online. Hubungi mereka untuk konfirmasi pembayaran.
        </p>
      </div>

      <RegistrationsTable registrations={registrations} />
    </div>
  );
}
