import type { WinRateStat } from "@/domain/stats";
import { characterDisplayName } from "@/domain/match";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  title: string;
  stats: WinRateStat[];
}

export function WinRateCards({ title, stats }: Props) {
  if (stats.length === 0) return null;

  return (
    <section className="space-y-3">
      <h3 className="text-muted-foreground text-sm font-medium">{title}</h3>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3">
        {stats.map((s) => (
          <Card key={s.character} size="sm">
            <CardHeader className="pb-0">
              <CardTitle className="text-center text-sm">{characterDisplayName(s.character)}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-center">
              <div className="text-primary text-2xl font-bold">
                {(s.winRate * 100).toFixed(1)}%
              </div>
              <div className="text-muted-foreground text-xs">
                {s.wins}W {s.losses}L ({s.total}戦)
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
