import type { ImportSourcePort, ImportResult } from "./ImportSourcePort";

export class ReplaySource implements ImportSourcePort {
  readonly name = "リプレイファイル解析";
  readonly description = "リプレイファイルから対戦結果を解析します（未実装）";
  readonly available = false;

  async import(): Promise<ImportResult> {
    throw new Error("ReplaySource is not yet implemented");
  }
}
