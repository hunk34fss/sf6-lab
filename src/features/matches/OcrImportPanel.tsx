import { useCallback, useEffect, useRef, useState } from "react";
import { characterDisplayName } from "@/domain/match";
import type { OcrMatchDraft } from "@/domain/ocrParse";
import { OcrSource } from "@/infrastructure/import/OcrSource";
import type { MatchFormPrefill } from "./MatchForm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface Props {
  onApply: (prefill: MatchFormPrefill) => void;
  onClose: () => void;
  /** When false, ignore Ctrl+V paste (dialog closed) */
  active?: boolean;
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

export function OcrImportPanel({ onApply, onClose, active = true }: Props) {
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
    if (!active) return;
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
  }, [runOcr, active]);

  function handleApply() {
    if (!draft) return;
    onApply({
      my_character: draft.my_character,
      opponent_character: draft.opponent_character,
      result: draft.result,
      mr_before: draft.mr_before,
      mr_after: draft.mr_after,
    });
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => fileInputRef.current?.click()}
        >
          画像ファイルを選択
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => void handlePasteClipboard()}
        >
          クリップボードから貼り付け
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/bmp"
          hidden
          onChange={(e) => void handleFileChange(e)}
        />
      </div>

      <p className="text-muted-foreground text-xs">Ctrl+V でも画像を貼り付けできます</p>
      <p className="text-muted-foreground text-sm">{status}</p>
      {error && <p className="text-destructive text-sm">{error}</p>}

      {previewUrl && (
        <div className="overflow-hidden rounded-lg border bg-muted/30">
          <img src={previewUrl} alt="OCR対象プレビュー" className="max-h-70 w-full object-contain" />
        </div>
      )}

      {draft && (
        <div className="grid gap-3">
          <Separator />
          <h3 className="font-medium">解析結果</h3>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">
              自キャラ: {draft.my_character ? characterDisplayName(draft.my_character) : "未検出"}
            </Badge>
            <Badge variant="secondary">
              相手: {draft.opponent_character ? characterDisplayName(draft.opponent_character) : "未検出"}
            </Badge>
            <Badge variant="secondary">
              結果: {draft.result === "win" ? "勝ち" : draft.result === "loss" ? "負け" : "未検出"}
            </Badge>
            <Badge variant="secondary">
              MR: {draft.mr_before ?? "?"} → {draft.mr_after ?? "?"}
            </Badge>
          </div>
          {draft.notes.length > 0 && (
            <ul className="text-muted-foreground list-inside list-disc text-xs">
              {draft.notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          )}
          <details>
            <summary className="text-muted-foreground cursor-pointer text-sm">OCR生テキスト</summary>
            <pre className="mt-2 max-h-40 overflow-auto rounded-md border bg-muted/40 p-3 text-xs whitespace-pre-wrap">
              {draft.raw_text}
            </pre>
          </details>
        </div>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onClose}>
          閉じる
        </Button>
        <Button type="button" disabled={busy || !draft} onClick={handleApply}>
          フォームに反映
        </Button>
      </div>
    </div>
  );
}
