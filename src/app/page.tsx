import { LiveDashboardClient } from "@/components/LiveDashboardClient";
import { TopNav } from "@/components/TopNav";
import { buildGoogleSheetDashboardData } from "@/lib/google-sheet-dashboard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const data = await buildGoogleSheetDashboardData();

  return (
    <>
      <TopNav />
      <LiveDashboardClient initialData={data} />
    </>
  );
}
