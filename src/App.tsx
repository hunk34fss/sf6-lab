import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Match } from "@/domain/match";
import type { Season } from "@/domain/season";
import { formatSeasonLabel, isCurrentSeason } from "@/domain/season";
import { calcMrTimeline, calcWinRateByCharacter, calcOverallWinRate } from "@/domain/stats";
import { MatchForm } from "@/features/matches/MatchForm";
import { MatchList } from "@/features/matches/MatchList";
import { MrTrendChart } from "@/features/dashboard/MrTrendChart";
import { WinRateCards } from "@/features/dashboard/WinRateCards";
import { SeasonResetDialog } from "@/features/seasons/SeasonResetDialog";
import { SeasonReport } from "@/features/seasons/SeasonReport";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import "./App.css";

type Tab = "input" | "dashboard";

function App() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [currentSeason, setCurrentSeason] = useState<Season | null>(null);
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(null);
  const [inputMatches, setInputMatches] = useState<Match[]>([]);
  const [dashMatches, setDashMatches] = useState<Match[]>([]);
  const [tab, setTab] = useState<Tab>("input");
  const [recentN, setRecentN] = useState<number>(0);
  const [resetOpen, setResetOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const loadSeasons = useCallback(async () => {
    const list = await invoke<Season[]>("get_seasons");
    const current = await invoke<Season>("get_current_season");
    setSeasons(list);
    setCurrentSeason(current);
    setSelectedSeasonId((prev) => prev ?? current.id);
    return current;
  }, []);

  const loadInputMatches = useCallback(async (seasonId: number) => {
    const data = await invoke<Match[]>("get_matches", { season_id: seasonId });
    setInputMatches(data);
  }, []);

  const loadDashMatches = useCallback(async (seasonId: number) => {
    const data = await invoke<Match[]>("get_matches", { season_id: seasonId });
    setDashMatches(data);
  }, []);

  const refreshAll = useCallback(async () => {
    try {
      const current = await loadSeasons();
      await loadInputMatches(current.id);
      const dashId = selectedSeasonId ?? current.id;
      await loadDashMatches(dashId);
    } catch (err) {
      console.error(err);
    }
  }, [loadSeasons, loadInputMatches, loadDashMatches, selectedSeasonId]);

  useEffect(() => {
    void refreshAll();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- initial load only

  useEffect(() => {
    if (selectedSeasonId == null) return;
    void loadDashMatches(selectedSeasonId).catch(console.error);
  }, [selectedSeasonId, loadDashMatches]);

  const selectedSeason =
    seasons.find((s) => s.id === selectedSeasonId) ?? currentSeason;

  const filtered =
    recentN > 0 ? dashMatches.slice(0, recentN) : dashMatches;
  const mrData = calcMrTimeline(filtered);
  const myCharStats = calcWinRateByCharacter(filtered, "my_character");
  const oppCharStats = calcWinRateByCharacter(filtered, "opponent_character");
  const overall = calcOverallWinRate(filtered);

  const defaultMr =
    inputMatches.length > 0
      ? String(inputMatches[0].mr_after)
      : String(currentSeason?.starting_mr ?? 1500);

  async function handleMatchCreated() {
    if (!currentSeason) return;
    await loadInputMatches(currentSeason.id);
    if (selectedSeasonId === currentSeason.id) {
      await loadDashMatches(currentSeason.id);
    }
  }

  async function handleReset(next: Season) {
    setCurrentSeason(next);
    setSelectedSeasonId(next.id);
    await loadSeasons();
    await loadInputMatches(next.id);
    await loadDashMatches(next.id);
  }

  if (reportOpen && selectedSeason) {
    return (
      <SeasonReport
        season={selectedSeason}
        matches={dashMatches}
        onClose={() => setReportOpen(false)}
      />
    );
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as Tab)}
        className="gap-6"
      >
        <header className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">SF6 Lab</h1>
            {currentSeason && (
              <p className="text-muted-foreground text-sm">
                現行: {currentSeason.name}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setResetOpen(true)}
            >
              シーズンをリセット
            </Button>
            <TabsList>
              <TabsTrigger value="input">対戦入力</TabsTrigger>
              <TabsTrigger value="dashboard">ダッシュボード</TabsTrigger>
            </TabsList>
          </div>
        </header>

        <TabsContent value="input" className="space-y-6">
          <MatchForm
            onCreated={() => void handleMatchCreated()}
            defaultMr={defaultMr}
          />
          <MatchList
            matches={inputMatches}
            onDeleted={() => void handleMatchCreated()}
          />
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <CardTitle>概要</CardTitle>
                {selectedSeason && (
                  <CardDescription>
                    {formatSeasonLabel(selectedSeason)} / 開始 MR{" "}
                    {selectedSeason.starting_mr}
                    {!isCurrentSeason(selectedSeason) && "（読み取り専用）"}
                  </CardDescription>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">
                  {overall.wins}W {overall.losses}L
                </Badge>
                <Badge>勝率 {(overall.winRate * 100).toFixed(1)}%</Badge>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setReportOpen(true)}
                  disabled={!selectedSeason}
                >
                  印刷 / PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <Label htmlFor="season-select">シーズン</Label>
                <Select
                  value={selectedSeasonId != null ? String(selectedSeasonId) : undefined}
                  onValueChange={(v) => setSelectedSeasonId(Number(v))}
                >
                  <SelectTrigger id="season-select" className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {seasons.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {formatSeasonLabel(s)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="recent-n">表示件数</Label>
                <Select
                  value={String(recentN)}
                  onValueChange={(v) => setRecentN(Number(v))}
                >
                  <SelectTrigger id="recent-n" className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">全件</SelectItem>
                    <SelectItem value="10">直近10戦</SelectItem>
                    <SelectItem value="20">直近20戦</SelectItem>
                    <SelectItem value="50">直近50戦</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          <MrTrendChart data={mrData} />
          <WinRateCards title="自キャラ別勝率" stats={myCharStats} />
          <WinRateCards title="相手キャラ別勝率" stats={oppCharStats} />
        </TabsContent>
      </Tabs>

      <SeasonResetDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        current={currentSeason}
        onReset={(next) => void handleReset(next)}
        onOpenReport={() => {
          if (currentSeason) {
            void (async () => {
              setSelectedSeasonId(currentSeason.id);
              await loadDashMatches(currentSeason.id);
              setResetOpen(false);
              setTab("dashboard");
              setReportOpen(true);
            })();
          }
        }}
      />
    </main>
  );
}

export default App;
