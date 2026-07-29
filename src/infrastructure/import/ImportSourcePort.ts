import type { Match } from "../../domain/match";

export interface ImportResult {
  imported: Match[];
  errors: string[];
}

export interface ImportSourcePort {
  readonly name: string;
  readonly description: string;
  readonly available: boolean;
  import(): Promise<ImportResult>;
}
