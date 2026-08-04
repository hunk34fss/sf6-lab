import type { WinRateStat } from "@/domain/stats";
import { characterDisplayName } from "@/domain/match";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Props {
  title: string;
  stats: WinRateStat[];
}

export function WinRateCards({ title, stats }: Props) {
  if (stats.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>表示できる対戦がありません</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{stats.length} キャラ</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3">
          {stats.map((s) => (
            <Card key={s.character} size="sm">
              <CardHeader className="pb-0">
                <CardTitle className="text-center text-sm">
                  {characterDisplayName(s.character)}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-2 text-center">
                <div className="text-primary text-2xl font-bold">
                  {(s.winRate * 100).toFixed(1)}%
                </div>
                <Badge variant="secondary">
                  {s.wins}W {s.losses}L · {s.total}戦
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
