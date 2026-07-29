import { invoke } from "@tauri-apps/api/core";
import type { ImportSourcePort, ImportResult } from "./ImportSourcePort";
import { parseOcrText, type OcrMatchDraft } from "../../domain/ocrParse";

interface OcrCommandResult {
  text: string;
}

export class OcrSource implements ImportSourcePort {
  readonly name = "スクリーンショット / OCR";
  readonly description = "スクリーンショットからOCRで対戦結果を読み取ります";
  readonly available = true;

  async import(): Promise<ImportResult> {
    return {
      imported: [],
      errors: ["画像を指定して recognizeImage を使用してください"],
    };
  }

  async recognizeImage(imageBytes: Uint8Array | number[]): Promise<OcrMatchDraft> {
    const bytes = Array.from(imageBytes);
    const result = await invoke<OcrCommandResult>("ocr_match_screenshot", {
      imageBytes: bytes,
    });
    return parseOcrText(result.text);
  }
}
