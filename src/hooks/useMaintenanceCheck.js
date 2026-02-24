"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function useMaintenanceCheck() {
  const router = useRouter();
  useEffect(() => {
    fetch("/api/maintenance")
      .then((r) => r.json())
      .then((d) => { if (d.maintenanceMode) router.replace("/maintenance"); })
      .catch(() => {});
  }, [router]);
}
