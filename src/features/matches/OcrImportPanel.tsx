import { useCallback, useEffect, useRef, useState } from "react";
import { characterDisplayName } from "../../domain/match";
import type { OcrMatchDraft } from "../../domain/ocrParse";
import { OcrSource } from "../../infrastructure/import/OcrSource";
import type { MatchFormPrefill } from "./MatchForm";

interface Props {
  onApply: (prefill: MatchFormPrefill) => void;
}

const ocrSource = new OcrSource();

async function readFileAsBytes(file: File): Promise<Uint8Array> {
  const buffer = await file.arrayBuffer();
  return new Uint8Array(buffer);
}

async function readClipboardImage(): Promise<Uint8Array | null> {
  if (!navigator.clipboard?.read) {
    throw new Error("この環境ではクリップボード画像の読み取りに対応していません");
  }
  const items = await navigator.clipboard.read();
  for (const item of items) {
    const type = item.types.find((t) => t.startsWith("image/"));
    if (!type) continue;
    const blob = await item.getType(type);
    const buffer = await blob.arrayBuffer();
    return new Uint8Array(buffer);
  }
  return null;
}

export function OcrImportPanel({ onApply }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [draft, setDraft] = useState<OcrMatchDraft | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("画像ファイルを選択するか、クリップボードから貼り付けてください");

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const runOcr = useCallback(async (bytes: Uint8Array, previewBlob: Blob) => {
    setBusy(true);
    setError("");
    setDraft(null);
    setStatus("OCR実行中...");

    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(previewBlob);
    });

    try {
      const result = await ocrSource.recognizeImage(bytes);
      setDraft(result);
      setStatus("OCR完了。内容を確認してフォームへ反映してください");
    } catch (err) {
      setError(String(err));
      setStatus("OCRに失敗しました");
    } finally {
      setBusy(false);
    }
  }, []);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const bytes = await readFileAsBytes(file);
    await runOcr(bytes, file);
  }

  async function handlePasteClipboard() {
    setError("");
    try {
      const bytes = await readClipboardImage();
      if (!bytes) {
        setError("クリップボードに画像が見つかりませんでした");
        return;
      }
      await runOcr(bytes, new Blob([bytes], { type: "image/png" }));
    } catch (err) {
      setError(String(err));
    }
  }

  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (!item.type.startsWith("image/")) continue;
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) return;
        void (async () => {
          const bytes = await readFileAsBytes(file);
          await runOcr(bytes, file);
        })();
        return;
      }
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [runOcr]);

  function handleApply() {
    if (!draft) return;
    onApply({
      my_character: draft.my_character,
      opponent_character: draft.opponent_character,
      result: draft.result,
      mr_before: draft.mr_before,
      mr_after: draft.mr_after,
    });
    setStatus("フォームへ反映しました。内容を確認して登録してください");
  }

  return (
    <section className="ocr-panel">
      <div className="ocr-header">
        <h2>OCR取込</h2>
        <p className="ocr-desc">ランクマッチ結果画面のスクショから自動入力します（確認後に登録）</p>
      </div>

      <div className="ocr-actions">
        <button type="button" className="btn-secondary" disabled={busy} onClick={() => fileInputRef.current?.click()}>
          画像ファイルを選択
        </button>
        <button type="button" className="btn-secondary" disabled={busy} onClick={() => void handlePasteClipboard()}>
          クリップボードから貼り付け
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/bmp"
          hidden
          onChange={(e) => void handleFileChange(e)}
        />
      </div>

      <p className="ocr-hint">Ctrl+V でも画像を貼り付けできます</p>
      <p className="ocr-status">{status}</p>
      {error && <p className="error">{error}</p>}

      {previewUrl && (
        <div className="ocr-preview">
          <img src={previewUrl} alt="OCR対象プレビュー" />
        </div>
      )}

      {draft && (
        <div className="ocr-draft">
          <h3>解析結果</h3>
          <ul>
            <li>自キャラ: {draft.my_character ? characterDisplayName(draft.my_character) : "未検出"}</li>
            <li>相手キャラ: {draft.opponent_character ? characterDisplayName(draft.opponent_character) : "未検出"}</li>
            <li>結果: {draft.result === "win" ? "勝ち" : draft.result === "loss" ? "負け" : "未検出"}</li>
            <li>MR: {draft.mr_before ?? "?"} → {draft.mr_after ?? "?"}</li>
          </ul>
          {draft.notes.length > 0 && (
            <ul className="ocr-notes">
              {draft.notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          )}
          <details className="ocr-raw">
            <summary>OCR生テキスト</summary>
            <pre>{draft.raw_text}</pre>
          </details>
          <button type="button" className="btn-submit" disabled={busy} onClick={handleApply}>
            フォームに反映
          </button>
        </div>
      )}
    </section>
  );
}
