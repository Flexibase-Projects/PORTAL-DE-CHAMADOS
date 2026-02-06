import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AreaChartProps {
  data: { date: string; count: number }[];
}

const areaConfig: ChartConfig = {
  count: { label: "Chamados", color: "var(--color-chart-1)" },
};

export function TicketsAreaChart({ data }: AreaChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Chamados por Dia</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">
            Sem dados disponíveis.
          </p>
        ) : (
          <ChartContainer config={areaConfig} className="h-[250px] w-full">
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} allowDecimals={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="count"
                fill="var(--color-chart-1)"
                fillOpacity={0.2}
                stroke="var(--color-chart-1)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

interface BarChartProps {
  data: { area: string; count: number }[];
}

const barConfig: ChartConfig = {
  count: { label: "Chamados", color: "var(--color-chart-2)" },
};

export function DepartmentBarChart({ data }: BarChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Por Departamento</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">
            Sem dados disponíveis.
          </p>
        ) : (
          <ChartContainer config={barConfig} className="h-[250px] w-full">
            <BarChart data={data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tickLine={false} axisLine={false} fontSize={12} allowDecimals={false} />
              <YAxis
                dataKey="area"
                type="category"
                tickLine={false}
                axisLine={false}
                fontSize={11}
                width={100}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="var(--color-chart-2)" radius={4} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
