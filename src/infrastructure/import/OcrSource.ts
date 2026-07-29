import type { ImportSourcePort, ImportResult } from "./ImportSourcePort";

export class OcrSource implements ImportSourcePort {
  readonly name = "スクリーンショット / OCR";
  readonly description = "スクリーンショットからOCRで対戦結果を読み取ります（未実装）";
  readonly available = false;

  async import(): Promise<ImportResult> {
    throw new Error("OcrSource is not yet implemented");
  }
}
