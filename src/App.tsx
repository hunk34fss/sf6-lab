import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Match } from "@/domain/match";
import { calcMrTimeline, calcWinRateByCharacter, calcOverallWinRate } from "@/domain/stats";
import { MatchForm } from "@/features/matches/MatchForm";
import { MatchList } from "@/features/matches/MatchList";
import { MrTrendChart } from "@/features/dashboard/MrTrendChart";
import { WinRateCards } from "@/features/dashboard/WinRateCards";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
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
  const [matches, setMatches] = useState<Match[]>([]);
  const [tab, setTab] = useState<Tab>("input");
  const [recentN, setRecentN] = useState<number>(0);

  const loadMatches = useCallback(async () => {
    try {
      const data: Match[] = await invoke("get_matches");
      setMatches(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  const filtered = recentN > 0 ? matches.slice(0, recentN) : matches;
  const mrData = calcMrTimeline(filtered);
  const myCharStats = calcWinRateByCharacter(filtered, "my_character");
  const oppCharStats = calcWinRateByCharacter(filtered, "opponent_character");
  const overall = calcOverallWinRate(filtered);

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as Tab)}
        className="gap-6"
      >
        <header className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">SF6 Lab</h1>
          <TabsList>
            <TabsTrigger value="input">対戦入力</TabsTrigger>
            <TabsTrigger value="dashboard">ダッシュボード</TabsTrigger>
          </TabsList>
        </header>

        <TabsContent value="input" className="space-y-6">
          <MatchForm onCreated={loadMatches} />
          <MatchList matches={matches} onDeleted={loadMatches} />
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle>概要</CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">
                  {overall.wins}W {overall.losses}L
                </Badge>
                <Badge>
                  勝率 {(overall.winRate * 100).toFixed(1)}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
    </main>
  );
}

export default App;
