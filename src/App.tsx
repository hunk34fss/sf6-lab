import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Match } from "@/domain/match";
import { calcMrTimeline, calcWinRateByCharacter, calcOverallWinRate } from "@/domain/stats";
import { MatchForm, type MatchFormPrefill } from "@/features/matches/MatchForm";
import { MatchList } from "@/features/matches/MatchList";
import { OcrImportPanel } from "@/features/matches/OcrImportPanel";
import { MrTrendChart } from "@/features/dashboard/MrTrendChart";
import { WinRateCards } from "@/features/dashboard/WinRateCards";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import "./App.css";

type Tab = "input" | "dashboard";

function App() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [tab, setTab] = useState<Tab>("input");
  const [recentN, setRecentN] = useState<number>(0);
  const [prefill, setPrefill] = useState<MatchFormPrefill | null>(null);
  const [prefillVersion, setPrefillVersion] = useState(0);

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

  function handleOcrApply(next: MatchFormPrefill) {
    setPrefill(next);
    setPrefillVersion((v) => v + 1);
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-4">
      <header className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">SF6 Lab</h1>
        <nav className="flex gap-2">
          <Button
            variant={tab === "input" ? "default" : "outline"}
            onClick={() => setTab("input")}
          >
            対戦入力
          </Button>
          <Button
            variant={tab === "dashboard" ? "default" : "outline"}
            onClick={() => setTab("dashboard")}
          >
            ダッシュボード
          </Button>
        </nav>
      </header>

      {tab === "input" && (
        <div className="space-y-6">
          <OcrImportPanel onApply={handleOcrApply} />
          <MatchForm onCreated={loadMatches} prefill={prefill} prefillVersion={prefillVersion} />
          <MatchList matches={matches} onDeleted={loadMatches} />
        </div>
      )}

      {tab === "dashboard" && (
        <div className="tab-content">
          <div className="filter-bar">
            <div className="flex items-center gap-2">
              <Label>表示件数</Label>
              <Select
                value={String(recentN)}
                onValueChange={(v) => setRecentN(Number(v))}
              >
                <SelectTrigger className="w-36">
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
            <div className="overall-stats">
              <span>総合: {overall.wins}W {overall.losses}L</span>
              <span className="overall-rate">({(overall.winRate * 100).toFixed(1)}%)</span>
            </div>
          </div>
          <MrTrendChart data={mrData} />
          <WinRateCards title="自キャラ別勝率" stats={myCharStats} />
          <WinRateCards title="相手キャラ別勝率" stats={oppCharStats} />
        </div>
      )}
    </main>
  );
}

export default App;
