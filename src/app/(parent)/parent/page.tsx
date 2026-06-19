// Server component: pre-fetch data keluarga + child aktif secara paralel di server,
// lalu teruskan sebagai initialData ke client component. SSR sudah merender
// konten nyata sehingga LCP tidak menunggu React Query selesai di browser.
import { getFamilyPlayersAction, getPlayerAttendanceAction } from "@/actions/family";
import { getPlayerStatsAction } from "@/actions/stats";
import { getPlayerCertificatesAction } from "@/actions/certificates";
import { getReleasedReportArchivesForPlayerAction } from "@/actions/report-archives";

import { ParentDashboardClient } from "./ParentDashboardClient";

async function loadInitialData() {
  const family = await getFamilyPlayersAction();
  const effectiveChildId = family[0]?.id ?? null;

  if (!effectiveChildId) {
    return {
      family,
      effectiveChildId,
      stats: [],
      attendances: [],
      certificates: [],
      releasedArchives: [],
    };
  }

  const [stats, attendances, certificates, releasedArchives] = await Promise.all([
    getPlayerStatsAction(effectiveChildId),
    getPlayerAttendanceAction(effectiveChildId),
    getPlayerCertificatesAction(effectiveChildId),
    getReleasedReportArchivesForPlayerAction(effectiveChildId),
  ]);

  return {
    family,
    effectiveChildId,
    stats,
    attendances,
    certificates,
    releasedArchives,
  };
}

export default async function ParentPage() {
  const initialData = await loadInitialData();
  return <ParentDashboardClient initialData={initialData} />;
}
