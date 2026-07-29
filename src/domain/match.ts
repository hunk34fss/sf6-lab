export interface Match {
  id?: number;
  played_at: string;
  my_character: string;
  opponent_character: string;
  result: "win" | "loss";
  mr_before: number;
  mr_after: number;
  memo: string;
}

export const SF6_CHARACTERS = [
  "Ryu",
  "Luke",
  "Jamie",
  "Chun-Li",
  "Guile",
  "Kimberly",
  "Juri",
  "Ken",
  "Blanka",
  "Dhalsim",
  "E.Honda",
  "Dee Jay",
  "Manon",
  "Marisa",
  "JP",
  "Zangief",
  "Lily",
  "Cammy",
  "Rashid",
  "A.K.I.",
  "Ed",
  "Akuma",
  "M.Bison",
  "Terry",
  "Mai",
  "Elena",
  "Gouki",
] as const;

export type Sf6Character = (typeof SF6_CHARACTERS)[number];
