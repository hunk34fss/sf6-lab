import type { Match } from "./match";

export interface WinRateStat {
  character: string;
  wins: number;
  losses: number;
  total: number;
  winRate: number;
}

export interface MrDataPoint {
  played_at: string;
  mr: number;
  delta: number;
}

export function calcWinRateByCharacter(
  matches: Match[],
  key: "my_character" | "opponent_character"
): WinRateStat[] {
  const map = new Map<string, { wins: number; losses: number }>();
  for (const m of matches) {
    const char = m[key];
    const entry = map.get(char) ?? { wins: 0, losses: 0 };
    if (m.result === "win") entry.wins++;
    else entry.losses++;
    map.set(char, entry);
  }
  return Array.from(map.entries())
    .map(([character, { wins, losses }]) => ({
      character,
      wins,
      losses,
      total: wins + losses,
      winRate: wins / (wins + losses),
    }))
    .sort((a, b) => b.total - a.total);
}

export function calcMrTimeline(matches: Match[]): MrDataPoint[] {
  const sorted = [...matches].sort(
    (a, b) => new Date(a.played_at).getTime() - new Date(b.played_at).getTime()
  );
  return sorted.map((m) => ({
    played_at: m.played_at,
    mr: m.mr_after,
    delta: m.mr_after - m.mr_before,
  }));
}

export function calcOverallWinRate(matches: Match[]): {
  wins: number;
  losses: number;
  winRate: number;
} {
  const wins = matches.filter((m) => m.result === "win").length;
  const losses = matches.length - wins;
  return {
    wins,
    losses,
    winRate: matches.length > 0 ? wins / matches.length : 0,
  };
}
