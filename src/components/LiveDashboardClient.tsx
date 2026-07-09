"use client";

import { useEffect, useState } from "react";
import { DashboardClient } from "@/components/DashboardClient";
import type { DashboardData } from "@/lib/types";

export function LiveDashboardClient({ initialData }: { initialData: DashboardData }) {
  const [data, setData] = useState(initialData);

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      try {
        const response = await fetch("/api/landing", { cache: "no-store" });
        if (!response.ok) return;
        const nextData = (await response.json()) as DashboardData;
        if (!cancelled) setData(nextData);
      } catch {
        // Keep the last good dashboard visible when Google Sheets is briefly unavailable.
      }
    }

    const timer = window.setInterval(refresh, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  return <DashboardClient data={data} />;
}
