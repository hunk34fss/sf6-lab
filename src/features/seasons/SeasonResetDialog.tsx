import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Season } from "@/domain/season";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  current: Season | null;
  onReset: (next: Season) => void;
  onOpenReport?: () => void;
}

export function SeasonResetDialog({
  open,
  onOpenChange,
  current,
  onReset,
  onOpenReport,
}: Props) {
  const [name, setName] = useState("");
  const [startingMr, setStartingMr] = useState("1500");
  const [matchCount, setMatchCount] = useState(0);
  const [latestMr, setLatestMr] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !current) return;
    setName("");
    setStartingMr(String(current.starting_mr || 1500));
    setError("");
    void (async () => {
      try {
        const summary = await invoke<{ match_count: number; latest_mr: number | null }>(
          "get_season_summary",
          { season_id: current.id },
        );
        setMatchCount(summary.match_count);
        setLatestMr(summary.latest_mr);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [open, current]);

  async function handleReset() {
    if (!current) return;
    setBusy(true);
    setError("");
    try {
      const mr = Number(startingMr);
      if (!startingMr || Number.isNaN(mr) || mr < 0) {
        setError("開始 MR を正しく入力してください");
        return;
      }
      const next = await invoke<Season>("reset_season", {
        input: {
          name: name.trim() || null,
          starting_mr: mr,
        },
      });
      onReset(next);
      onOpenChange(false);
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>シーズンをリセット</DialogTitle>
          <DialogDescription>
            現行シーズンを閉じ、新しいシーズンを開始します。過去の対戦は削除されません。
          </DialogDescription>
        </DialogHeader>

        {current && (
          <div className="space-y-3 text-sm">
            <p>
              閉じるシーズン: <span className="font-medium">{current.name}</span>
            </p>
            <p>
              対戦数: {matchCount} / 最終 MR:{" "}
              {latestMr != null ? latestMr : "—"}
            </p>
            {onOpenReport && matchCount > 0 && (
              <Button type="button" variant="link" className="h-auto p-0" onClick={onOpenReport}>
                閉じる前にレポートを開く
              </Button>
            )}
            <div className="grid gap-2">
              <Label htmlFor="new-season-name">新しいシーズン名（任意）</Label>
              <Input
                id="new-season-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="自動採番（Season N）"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="starting-mr">開始 MR</Label>
              <Input
                id="starting-mr"
                type="number"
                min={0}
                className="mr-input"
                value={startingMr}
                onChange={(e) => setStartingMr(e.target.value)}
              />
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button type="button" onClick={() => void handleReset()} disabled={busy || !current}>
            {busy ? "リセット中..." : "リセットする"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
