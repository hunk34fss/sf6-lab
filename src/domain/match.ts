export interface Match {
  id?: number;
  played_at: string;
  my_character: string;
  opponent_character: string;
  result: "win" | "loss";
  mr_before: number;
  mr_after: number;
  memo: string;
  season_id?: number;
}

/** English id (stored in DB) → Japanese display name */
export const SF6_CHARACTERS = [
  { id: "Ryu", ja: "リュウ" },
  { id: "Luke", ja: "ルーク" },
  { id: "Jamie", ja: "ジェイミー" },
  { id: "Chun-Li", ja: "春麗" },
  { id: "Guile", ja: "ガイル" },
  { id: "Kimberly", ja: "キンバリー" },
  { id: "Juri", ja: "ジュリ" },
  { id: "Ken", ja: "ケン" },
  { id: "Blanka", ja: "ブランカ" },
  { id: "Dhalsim", ja: "ダルシム" },
  { id: "E.Honda", ja: "E.本田" },
  { id: "Dee Jay", ja: "ディージェイ" },
  { id: "Manon", ja: "マノン" },
  { id: "Marisa", ja: "マリーザ" },
  { id: "JP", ja: "JP" },
  { id: "Zangief", ja: "ザンギエフ" },
  { id: "Lily", ja: "リリー" },
  { id: "Cammy", ja: "キャミィ" },
  { id: "Rashid", ja: "ラシード" },
  { id: "A.K.I.", ja: "A.K.I." },
  { id: "Ed", ja: "エド" },
  { id: "Akuma", ja: "豪鬼" },
  { id: "M.Bison", ja: "ベガ" },
  { id: "Terry", ja: "テリー" },
  { id: "Mai", ja: "舞" },
  { id: "Elena", ja: "エレナ" },
  { id: "Sagat", ja: "サガット" },
  { id: "C.Viper", ja: "ヴァイパー" },
  { id: "Alex", ja: "アレックス" },
  { id: "Ingrid", ja: "イングリッド" },
] as const;

export type Sf6CharacterId = (typeof SF6_CHARACTERS)[number]["id"];

const JA_BY_ID = Object.fromEntries(
  SF6_CHARACTERS.map((c) => [c.id, c.ja])
) as Record<string, string>;

export function characterDisplayName(id: string): string {
  return JA_BY_ID[id] ?? id;
}
