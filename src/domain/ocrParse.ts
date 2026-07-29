import { SF6_CHARACTERS } from "./match";

export interface OcrMatchDraft {
  raw_text: string;
  my_character?: string;
  opponent_character?: string;
  result?: "win" | "loss";
  mr_before?: number;
  mr_after?: number;
  notes: string[];
}

const WIN_KEYWORDS = ["勝ち", "勝利", "WIN", "VICTORY", "YOU WIN"];
const LOSS_KEYWORDS = ["負け", "敗北", "LOSE", "LOSS", "DEFEAT", "YOU LOSE"];

const EXTRA_ALIASES: Record<string, string> = {
  ベガ: "M.Bison",
  バイソン: "M.Bison",
  Vega: "M.Bison",
  Bison: "M.Bison",
  "M.Bison": "M.Bison",
  ヴァイパー: "C.Viper",
  バイパー: "C.Viper",
  Viper: "C.Viper",
  "C.Viper": "C.Viper",
  サガット: "Sagat",
  アレックス: "Alex",
  イングリッド: "Ingrid",
  春麗: "Chun-Li",
  Chunli: "Chun-Li",
  "Chun Li": "Chun-Li",
  Honda: "E.Honda",
  本田: "E.Honda",
  Deejay: "Dee Jay",
  "DeeJay": "Dee Jay",
  AKI: "A.K.I.",
  豪鬼: "Akuma",
  Gouki: "Akuma",
};

function normalize(text: string): string {
  return text.replace(/\s+/g, "").toLowerCase();
}

function buildNamePatterns(): { id: string; pattern: string }[] {
  const patterns: { id: string; pattern: string }[] = [];

  for (const c of SF6_CHARACTERS) {
    patterns.push({ id: c.id, pattern: c.id });
    patterns.push({ id: c.id, pattern: c.ja });
  }
  for (const [alias, id] of Object.entries(EXTRA_ALIASES)) {
    patterns.push({ id, pattern: alias });
  }

  // Longer names first to avoid partial overlaps
  patterns.sort((a, b) => b.pattern.length - a.pattern.length);
  return patterns;
}

function findCharacters(text: string): string[] {
  const norm = normalize(text);
  const found: string[] = [];
  const usedRanges: Array<[number, number]> = [];

  for (const { id, pattern } of buildNamePatterns()) {
    const p = normalize(pattern);
    if (!p) continue;
    let from = 0;
    while (from <= norm.length - p.length) {
      const idx = norm.indexOf(p, from);
      if (idx < 0) break;
      const end = idx + p.length;
      const overlaps = usedRanges.some(([s, e]) => idx < e && end > s);
      if (!overlaps) {
        if (!found.includes(id)) found.push(id);
        usedRanges.push([idx, end]);
      }
      from = idx + 1;
    }
  }

  return found;
}

function detectResult(text: string): "win" | "loss" | undefined {
  const upper = text.toUpperCase();
  const hasWin = WIN_KEYWORDS.some((k) => upper.includes(k.toUpperCase()) || text.includes(k));
  const hasLoss = LOSS_KEYWORDS.some((k) => upper.includes(k.toUpperCase()) || text.includes(k));

  if (hasWin && !hasLoss) return "win";
  if (hasLoss && !hasWin) return "loss";
  if (hasWin && hasLoss) {
    // Prefer the keyword that appears first
    const winPos = Math.min(
      ...WIN_KEYWORDS.map((k) => {
        const i = upper.indexOf(k.toUpperCase());
        return i < 0 ? Number.MAX_SAFE_INTEGER : i;
      })
    );
    const lossPos = Math.min(
      ...LOSS_KEYWORDS.map((k) => {
        const i = upper.indexOf(k.toUpperCase());
        return i < 0 ? Number.MAX_SAFE_INTEGER : i;
      })
    );
    return winPos <= lossPos ? "win" : "loss";
  }
  return undefined;
}

function extractMrCandidates(text: string): number[] {
  const matches = text.match(/\b([1-3]\d{3})\b/g) ?? [];
  const values = matches
    .map((m) => Number(m))
    .filter((n) => n >= 1000 && n <= 3000);

  // unique preserving order
  const seen = new Set<number>();
  const unique: number[] = [];
  for (const n of values) {
    if (!seen.has(n)) {
      seen.add(n);
      unique.push(n);
    }
  }
  return unique;
}

export function parseOcrText(text: string): OcrMatchDraft {
  const notes: string[] = [];
  const draft: OcrMatchDraft = { raw_text: text, notes };

  const chars = findCharacters(text);
  if (chars.length >= 1) {
    draft.my_character = chars[0];
  } else {
    notes.push("自キャラを認識できませんでした");
  }
  if (chars.length >= 2) {
    draft.opponent_character = chars[1];
  } else {
    notes.push("相手キャラを認識できませんでした");
  }
  if (chars.length > 2) {
    notes.push(`追加で認識したキャラ: ${chars.slice(2).join(", ")}`);
  }

  const result = detectResult(text);
  if (result) {
    draft.result = result;
  } else {
    notes.push("勝敗を認識できませんでした");
  }

  const mrs = extractMrCandidates(text);
  if (mrs.length >= 2) {
    // Heuristic: first = before, second = after (common on result screens)
    draft.mr_before = mrs[0];
    draft.mr_after = mrs[1];
  } else if (mrs.length === 1) {
    draft.mr_after = mrs[0];
    draft.mr_before = mrs[0];
    notes.push("MRが1件のみのため変動前・後に同じ値を設定しました");
  } else {
    notes.push("MRを認識できませんでした");
  }

  return draft;
}
