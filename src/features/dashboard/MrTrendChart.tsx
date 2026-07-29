import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { MrDataPoint } from "../../domain/stats";

interface Props {
  data: MrDataPoint[];
}

export function MrTrendChart({ data }: Props) {
  if (data.length === 0) {
    return <p className="empty">MRデータがありません</p>;
  }

  const formatted = data.map((d) => ({
    ...d,
    label: new Date(d.played_at).toLocaleDateString("ja-JP"),
  }));

  return (
    <div className="chart-container">
      <h2>MR推移</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={formatted}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <YAxis domain={["dataMin - 50", "dataMax + 50"]} />
          <Tooltip />
          <Line type="monotone" dataKey="mr" stroke="#4f8cff" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
