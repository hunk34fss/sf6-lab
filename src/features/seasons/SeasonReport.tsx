import { characterDisplayName } from "@/domain/match";
import type { Match } from "@/domain/match";
import type { Season } from "@/domain/season";
import {
  calcMrTimeline,
  calcOverallWinRate,
  calcWinRateByCharacter,
} from "@/domain/stats";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Props {
  season: Season;
  matches: Match[];
  onClose: () => void;
}

export function SeasonReport({ season, matches, onClose }: Props) {
  const overall = calcOverallWinRate(matches);
  const myStats = calcWinRateByCharacter(matches, "my_character");
  const oppStats = calcWinRateByCharacter(matches, "opponent_character");
  const timeline = calcMrTimeline(matches);
  const latestMr =
    timeline.length > 0 ? timeline[timeline.length - 1].mr : season.starting_mr;
  const endedLabel = season.ended_at
    ? new Date(season.ended_at).toLocaleString("ja-JP")
    : "現行";

  return (
    <div className="season-report mx-auto max-w-4xl space-y-6 p-4 md:p-6 print:max-w-none print:p-0">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">{season.name} レポート</h2>
          <p className="text-muted-foreground text-sm">
            印刷ダイアログから「PDF に保存」を選んでください
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            閉じる
          </Button>
          <Button type="button" onClick={() => window.print()}>
            印刷 / PDF に保存
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{season.name}</CardTitle>
          <CardDescription>
            {new Date(season.started_at).toLocaleString("ja-JP")} 〜 {endedLabel}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Badge variant="secondary">開始 MR {season.starting_mr}</Badge>
          <Badge variant="secondary">最終 MR {latestMr}</Badge>
          <Badge variant="secondary">
            {overall.wins}W {overall.losses}L
          </Badge>
          <Badge>勝率 {(overall.winRate * 100).toFixed(1)}%</Badge>
          <Badge variant="outline">{matches.length} 戦</Badge>
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-2">
        <WinRateSection title="自キャラ別勝率" stats={myStats} />
        <WinRateSection title="相手キャラ別勝率" stats={oppStats} />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>対戦一覧</CardTitle>
        </CardHeader>
        <CardContent>
          {matches.length === 0 ? (
            <p className="text-muted-foreground text-sm">対戦がありません</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>日時</TableHead>
                  <TableHead>自</TableHead>
                  <TableHead>相手</TableHead>
                  <TableHead>結果</TableHead>
                  <TableHead>MR</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matches.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      {new Date(m.played_at).toLocaleString("ja-JP")}
                    </TableCell>
                    <TableCell>{characterDisplayName(m.my_character)}</TableCell>
                    <TableCell>
                      {characterDisplayName(m.opponent_character)}
                    </TableCell>
                    <TableCell>{m.result === "win" ? "勝" : "負"}</TableCell>
                    <TableCell>
                      {m.mr_before} → {m.mr_after}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function WinRateSection({
  title,
  stats,
}: {
  title: string;
  stats: ReturnType<typeof calcWinRateByCharacter>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {stats.length === 0 ? (
          <p className="text-muted-foreground text-sm">データなし</p>
        ) : (
          stats.map((s) => (
            <div
              key={s.character}
              className="flex items-center justify-between gap-2 text-sm"
            >
              <span>{characterDisplayName(s.character)}</span>
              <span className="text-muted-foreground">
                {(s.winRate * 100).toFixed(1)}% ({s.wins}W {s.losses}L)
              </span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
