import type { ImportSourcePort, ImportResult } from "./ImportSourcePort";

export class InputLogSource implements ImportSourcePort {
  readonly name = "入力デバイスログ";
  readonly description = "入力デバイスのログから技使用情報を取得します（未実装）";
  readonly available = false;

  async import(): Promise<ImportResult> {
    throw new Error("InputLogSource is not yet implemented");
  }
}
