import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Match } from "@/domain/match";
import { SF6_CHARACTERS } from "@/domain/match";
import { OcrImportPanel } from "./OcrImportPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export interface MatchFormPrefill {
  my_character?: string;
  opponent_character?: string;
  result?: "win" | "loss";
  mr_before?: number;
  mr_after?: number;
}

interface Props {
  onCreated: () => void;
}

function formatLocalDateTime(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}T${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}:${String(date.getSeconds()).padStart(2, "0")}`;
}

export function MatchForm({ onCreated }: Props) {
  const [playedAt, setPlayedAt] = useState(() => formatLocalDateTime(new Date()));
  const [syncNow, setSyncNow] = useState(true);
  const [myChar, setMyChar] = useState<string>(SF6_CHARACTERS[0].id);
  const [oppChar, setOppChar] = useState<string>(SF6_CHARACTERS[1].id);
  const [result, setResult] = useState<"win" | "loss">("win");
  const [mrBefore, setMrBefore] = useState("1500");
  const [mrAfter, setMrAfter] = useState("1500");
  const [memo, setMemo] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [ocrOpen, setOcrOpen] = useState(false);

  useEffect(() => {
    if (!syncNow) return;
    const tick = () => setPlayedAt(formatLocalDateTime(new Date()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [syncNow]);

  const resumeSync = useCallback(() => {
    setPlayedAt(formatLocalDateTime(new Date()));
    setSyncNow(true);
  }, []);

  function applyPrefill(prefill: MatchFormPrefill) {
    if (prefill.my_character) setMyChar(prefill.my_character);
    if (prefill.opponent_character) setOppChar(prefill.opponent_character);
    if (prefill.result) setResult(prefill.result);
    if (prefill.mr_before != null) {
      setMrBefore(String(prefill.mr_before));
      if (prefill.mr_after == null) setMrAfter(String(prefill.mr_before));
    }
    if (prefill.mr_after != null) setMrAfter(String(prefill.mr_after));
    setOcrOpen(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const before = Number(mrBefore);
    const after = Number(mrAfter);
    if (!mrBefore || !mrAfter || isNaN(before) || isNaN(after)) {
      setError("MR（変動前・変動後）を正しく入力してください");
      return;
    }
    if (before < 0 || after < 0) {
      setError("MRは0以上で入力してください");
      return;
    }

    const m: Match = {
      played_at: playedAt,
      my_character: myChar,
      opponent_character: oppChar,
      result,
      mr_before: before,
      mr_after: after,
      memo,
    };

    setSaving(true);
    try {
      await invoke("create_match", { m });
      setMrBefore(mrAfter);
      setMrAfter(mrAfter);
      setMemo("");
      resumeSync();
      onCreated();
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>対戦結果を登録</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="played-at">日時</Label>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input
                  id="played-at"
                  type="datetime-local"
                  step="1"
                  value={playedAt}
                  onChange={(e) => {
                    setSyncNow(false);
                    setPlayedAt(e.target.value);
                  }}
                  required
                  className="flex-1"
                />
                <Button type="button" variant="outline" onClick={resumeSync} disabled={syncNow}>
                  {syncNow ? "同期中" : "現在時刻に同期"}
                </Button>
              </div>
              <p className="text-muted-foreground text-xs">
                {syncNow ? "PC時刻とリアルタイム同期中（手動編集も可能）" : "手動編集中"}
              </p>
            </div>

            <div className="grid gap-2">
              <Label>自キャラ</Label>
              <Select value={myChar} onValueChange={setMyChar}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SF6_CHARACTERS.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.ja}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>相手キャラ</Label>
              <Select value={oppChar} onValueChange={setOppChar}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SF6_CHARACTERS.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.ja}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2 sm:col-span-2">
              <Label>結果</Label>
              <ToggleGroup
                type="single"
                value={result}
                onValueChange={(value) => {
                  if (value === "win" || value === "loss") setResult(value);
                }}
                variant="outline"
                className="w-full"
              >
                <ToggleGroupItem value="win" className="flex-1 data-[state=on]:border-green-500 data-[state=on]:text-green-600">
                  勝ち
                </ToggleGroupItem>
                <ToggleGroupItem value="loss" className="flex-1 data-[state=on]:border-red-500 data-[state=on]:text-red-600">
                  負け
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="mr-before">MR（変動前）</Label>
              <Input
                id="mr-before"
                type="number"
                className="mr-input"
                value={mrBefore}
                onChange={(e) => {
                  const next = e.target.value;
                  setMrBefore(next);
                  setMrAfter(next);
                }}
                required
                min={0}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="mr-after">MR（変動後）</Label>
              <Input
                id="mr-after"
                type="number"
                className="mr-input"
                value={mrAfter}
                onChange={(e) => setMrAfter(e.target.value)}
                required
                min={0}
              />
            </div>

            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="memo">メモ</Label>
              <Input
                id="memo"
                type="text"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="任意メモ"
              />
            </div>

            {error && <p className="text-destructive text-sm sm:col-span-2">{error}</p>}

            <div className="grid gap-2 sm:col-span-2">
              <Button type="button" variant="outline" onClick={() => setOcrOpen(true)}>
                OCR取込
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "保存中..." : "登録"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Dialog open={ocrOpen} onOpenChange={setOcrOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>OCR取込</DialogTitle>
            <DialogDescription>
              ランクマッチ結果画面のスクショから自動入力します（確認後に登録）
            </DialogDescription>
          </DialogHeader>
          <OcrImportPanel
            active={ocrOpen}
            onApply={applyPrefill}
            onClose={() => setOcrOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
