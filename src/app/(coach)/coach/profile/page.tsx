import { CoachProfilePageClient } from "@/components/features/coach/CoachProfilePageClient";

// Page wrapper sengaja tipis: AdminPageHeader, lebar max-w-7xl, dan state form hidup di CoachProfilePageClient agar profil bisa di-edit in-place tanpa navigasi.
export default function CoachProfilePage() {
  return <CoachProfilePageClient />;
}
