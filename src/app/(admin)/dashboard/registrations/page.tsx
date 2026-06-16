import { getPendingRegistrations } from "@/actions/register";
import { AdminPageHeader } from "@/components/features/admin-page-header";
import { RegistrationsTable } from "@/components/features/dashboard/RegistrationsTable";

export const metadata = {
  title: "Pendaftar Baru - ADORA BBC",
};

export default async function RegistrationsPage() {
  const registrations = await getPendingRegistrations();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-10">
      <AdminPageHeader
        eyebrow="Pendaftaran"
        title="Pendaftar Baru"
        description="Konfirmasi pembayaran pendaftar dari formulir web sebelum dipindahkan ke data pemain."
      />

      <RegistrationsTable registrations={registrations} />
    </div>
  );
}
