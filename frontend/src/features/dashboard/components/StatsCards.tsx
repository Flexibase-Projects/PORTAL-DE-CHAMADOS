import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  TicketCheck,
} from "lucide-react";

interface StatsCardsProps {
  total: number;
  abertos: number;
  emAndamento: number;
  concluidos: number;
}

const stats = [
  {
    key: "total",
    label: "Total de Chamados",
    icon: TicketCheck,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950",
  },
  {
    key: "abertos",
    label: "Abertos",
    icon: AlertCircle,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950",
  },
  {
    key: "emAndamento",
    label: "Em Andamento",
    icon: Clock,
    color: "text-yellow-600 dark:text-yellow-400",
    bg: "bg-yellow-50 dark:bg-yellow-950",
  },
  {
    key: "concluidos",
    label: "Concluídos",
    icon: CheckCircle2,
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-50 dark:bg-green-950",
  },
] as const;

export function StatsCards({
  total,
  abertos,
  emAndamento,
  concluidos,
}: StatsCardsProps) {
  const values: Record<string, number> = {
    total,
    abertos,
    emAndamento,
    concluidos,
  };

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((s) => (
        <Card key={s.key}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {s.label}
            </CardTitle>
            <div className={`rounded-md p-2 ${s.bg}`}>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{values[s.key]}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
