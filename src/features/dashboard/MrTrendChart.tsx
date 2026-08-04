import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import type { MrDataPoint } from "@/domain/stats";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface Props {
  data: MrDataPoint[];
}

const chartConfig = {
  mr: {
    label: "MR",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export function MrTrendChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>MR推移</CardTitle>
          <CardDescription>まだ表示できる MR データがありません</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const formatted = data.map((d) => ({
    ...d,
    label: new Date(d.played_at).toLocaleDateString("ja-JP"),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>MR推移</CardTitle>
        <CardDescription>対戦ごとの MR 推移</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-[300px] w-full">
          <LineChart data={formatted} accessibilityLayer>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              domain={["dataMin - 50", "dataMax + 50"]}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={48}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Line
              type="monotone"
              dataKey="mr"
              stroke="var(--color-mr)"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
