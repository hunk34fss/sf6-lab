import type { WinRateStat } from "../../domain/stats";

interface Props {
  title: string;
  stats: WinRateStat[];
}

export function WinRateCards({ title, stats }: Props) {
  if (stats.length === 0) return null;

  return (
    <div className="winrate-section">
      <h3>{title}</h3>
      <div className="winrate-grid">
        {stats.map((s) => (
          <div key={s.character} className="winrate-card">
            <div className="char-name">{s.character}</div>
            <div className="winrate-value">{(s.winRate * 100).toFixed(1)}%</div>
            <div className="winrate-detail">
              {s.wins}W {s.losses}L ({s.total}戦)
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
