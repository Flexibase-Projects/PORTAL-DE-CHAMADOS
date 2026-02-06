import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { StatsCards } from "./components/StatsCards";
import { RecentTickets } from "./components/RecentTickets";
import { TicketsAreaChart, DepartmentBarChart } from "./components/Charts";
import { ticketService, type DashboardStats } from "@/services/ticketService";

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
    ticketService
      .getDashboardStats()
      .then((res) => {
        if (res.success) setStats(res.stats);
      })
      .catch(() => {
        // silently fail - dashboard will show zeros
      })
      .finally(() => setLoading(false));
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
