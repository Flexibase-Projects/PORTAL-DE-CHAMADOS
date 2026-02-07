import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { StatsCards } from "./components/StatsCards";
import { RecentTickets } from "./components/RecentTickets";
import { TicketsAreaChart, DepartmentBarChart } from "./components/Charts";
import { ticketService, type DashboardStats } from "@/services/ticketService";

const DBG = (msg: string, data: Record<string, unknown>, hypothesisId: string) => {
  fetch("http://127.0.0.1:7242/ingest/176f700b-f851-4563-bfe2-b8f27d41c301", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ location: "DashboardPage.tsx", message: msg, data: data || {}, hypothesisId, timestamp: Date.now() }),
  }).catch(() => {});
};

const emptyStats: DashboardStats = {
  total: 0,
  abertos: 0,
  em_andamento: 0,
  concluidos: 0,
  recentes: [],
  por_departamento: [],
  por_dia: [],
};

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>(emptyStats);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // #region agent log
    DBG("useEffect start", {}, "H5");
    const t0 = Date.now();
    // #endregion
    ticketService
      .getDashboardStats()
      .then((res) => {
        // #region agent log
        DBG("API success", { success: res.success, elapsed: Date.now() - t0 }, "H5");
        // #endregion
        if (res.success) setStats(res.stats);
      })
      .catch((err) => {
        // #region agent log
        DBG("API catch", { elapsed: Date.now() - t0, status: err?.response?.status, message: err?.message }, "H1,H5");
        // #endregion
        // silently fail - dashboard will show zeros
      })
      .finally(() => {
        // #region agent log
        DBG("API finally", { totalElapsed: Date.now() - t0 }, "H5");
        // #endregion
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral do Portal de Chamados.
          </p>
        </div>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          <Skeleton className="h-[300px] rounded-xl" />
          <Skeleton className="h-[300px] rounded-xl" />
        </div>
        <Skeleton className="h-[300px] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral do Portal de Chamados.
        </p>
      </div>

      <StatsCards
        total={stats.total}
        abertos={stats.abertos}
        emAndamento={stats.em_andamento}
        concluidos={stats.concluidos}
      />

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <TicketsAreaChart data={stats.por_dia} />
        <DepartmentBarChart data={stats.por_departamento} />
      </div>

      <RecentTickets tickets={stats.recentes} />
    </div>
  );
}
