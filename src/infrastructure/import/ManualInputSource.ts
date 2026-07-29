import type { Match } from "../../domain/match";
import type { ImportSourcePort, ImportResult } from "./ImportSourcePort";

export class ManualInputSource implements ImportSourcePort {
  readonly name = "手動入力";
  readonly description = "フォームから直接対戦結果を入力します";
  readonly available = true;

  async import(): Promise<ImportResult> {
    return { imported: [], errors: [] };
  }

  static createMatch(data: Omit<Match, "id">): Match {
    return { ...data };
  }
}
