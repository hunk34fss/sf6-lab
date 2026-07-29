import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Match } from "../../domain/match";
import { SF6_CHARACTERS } from "../../domain/match";

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
    <form onSubmit={handleSubmit} className="match-form">
      <h2>対戦結果を登録</h2>

      <label className="datetime-field">
        日時
        <div className="datetime-row">
          <input
            type="datetime-local"
            step="1"
            value={playedAt}
            onChange={(e) => {
              setSyncNow(false);
              setPlayedAt(e.target.value);
            }}
            required
          />
          <button type="button" className="btn-sync" onClick={resumeSync} disabled={syncNow}>
            {syncNow ? "同期中" : "現在時刻に同期"}
          </button>
        </div>
        <span className="datetime-hint">
          {syncNow ? "PC時刻とリアルタイム同期中（手動編集も可能）" : "手動編集中"}
        </span>
      </label>

      <label>
        自キャラ
        <select value={myChar} onChange={(e) => setMyChar(e.target.value)}>
          {SF6_CHARACTERS.map((c) => (
            <option key={c.id} value={c.id}>{c.ja}</option>
          ))}
        </select>
      </label>

      <label>
        相手キャラ
        <select value={oppChar} onChange={(e) => setOppChar(e.target.value)}>
          {SF6_CHARACTERS.map((c) => (
            <option key={c.id} value={c.id}>{c.ja}</option>
          ))}
        </select>
      </label>

      <label>
        結果
        <select value={result} onChange={(e) => setResult(e.target.value as "win" | "loss")}>
          <option value="win">勝ち</option>
          <option value="loss">負け</option>
        </select>
      </label>

      <label>
        MR（変動前）
        <input
          className="mr-input"
          type="number"
          value={mrBefore}
          onChange={(e) => {
            const next = e.target.value;
            setMrBefore(next);
            setMrAfter(next);
          }}
          required
          min={0}
        />
      </label>

      <label>
        MR（変動後）
        <input
          className="mr-input"
          type="number"
          value={mrAfter}
          onChange={(e) => setMrAfter(e.target.value)}
          required
          min={0}
        />
      </label>

      <label>
        メモ
        <input type="text" value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="任意メモ" />
      </label>

      {error && <p className="error">{error}</p>}
      <button type="submit" disabled={saving}>{saving ? "保存中..." : "登録"}</button>
    </form>
  );
}
