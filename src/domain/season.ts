export interface Season {
  id: number;
  name: string;
  started_at: string;
  ended_at: string | null;
  starting_mr: number;
  note: string;
}

export function isCurrentSeason(season: Season): boolean {
  return season.ended_at == null;
}

export function formatSeasonLabel(season: Season): string {
  if (isCurrentSeason(season)) {
    return `${season.name}（現行）`;
  }
  const end = season.ended_at
    ? new Date(season.ended_at).toLocaleDateString("ja-JP")
    : "";
  return end ? `${season.name}（〜${end}）` : season.name;
}
