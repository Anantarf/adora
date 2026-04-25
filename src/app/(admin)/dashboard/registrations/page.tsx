import { getPendingRegistrations } from "@/actions/register";
import { RegistrationsTable } from "@/components/features/dashboard/RegistrationsTable";

export const metadata = {
  title: "Pendaftar Baru - Adora Basketball Club",
};

export default async function RegistrationsPage() {
  const registrations = await getPendingRegistrations();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-2xl font-bold tracking-widest text-foreground uppercase">
          Pendaftar Baru
        </h2>
      </div>

      <RegistrationsTable registrations={registrations} />
    </div>
  );
}
