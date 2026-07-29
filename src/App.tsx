import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Match } from "./domain/match";
import { calcMrTimeline, calcWinRateByCharacter, calcOverallWinRate } from "./domain/stats";
import { MatchForm } from "./features/matches/MatchForm";
import { MatchList } from "./features/matches/MatchList";
import { MrTrendChart } from "./features/dashboard/MrTrendChart";
import { WinRateCards } from "./features/dashboard/WinRateCards";
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
    <main className="app">
      <header className="app-header">
        <h1>SF6 Lab</h1>
        <nav className="tab-nav">
          <button className={tab === "input" ? "active" : ""} onClick={() => setTab("input")}>
            対戦入力
          </button>
          <button className={tab === "dashboard" ? "active" : ""} onClick={() => setTab("dashboard")}>
            ダッシュボード
          </button>
        </nav>
      </header>

      {tab === "input" && (
        <div className="tab-content">
          <MatchForm onCreated={loadMatches} />
          <MatchList matches={matches} onDeleted={loadMatches} />
        </div>
      )}

      {tab === "dashboard" && (
        <div className="tab-content">
          <div className="filter-bar">
            <label>
              表示件数:
              <select value={recentN} onChange={(e) => setRecentN(Number(e.target.value))}>
                <option value={0}>全件</option>
                <option value={10}>直近10戦</option>
                <option value={20}>直近20戦</option>
                <option value={50}>直近50戦</option>
              </select>
            </label>
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
