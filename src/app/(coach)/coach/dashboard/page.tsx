import { CoachDashboardPageClient } from "@/components/features/coach/CoachDashboardPageClient";

// Page wrapper sengaja tipis: seluruh UI (termasuk heading, lebar max-w-7xl, dan state loading) hidup di CoachDashboardPageClient untuk konsistensi dengan client component lain di role ini.
export default function CoachDashboardPage() {
  return <CoachDashboardPageClient />;
}
