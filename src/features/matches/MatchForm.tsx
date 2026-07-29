import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Match } from "../../domain/match";
import { SF6_CHARACTERS } from "../../domain/match";

interface Props {
  onCreated: () => void;
}

export function MatchForm({ onCreated }: Props) {
  const now = new Date();
  const localIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}T${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const [playedAt, setPlayedAt] = useState(localIso);
  const [myChar, setMyChar] = useState<string>(SF6_CHARACTERS[0]);
  const [oppChar, setOppChar] = useState<string>(SF6_CHARACTERS[1]);
  const [result, setResult] = useState<"win" | "loss">("win");
  const [mrBefore, setMrBefore] = useState("");
  const [mrAfter, setMrAfter] = useState("");
  const [memo, setMemo] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

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
      setMrAfter("");
      setMemo("");
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

      <label>
        日時
        <input
          type="datetime-local"
          value={playedAt}
          onChange={(e) => setPlayedAt(e.target.value)}
          required
        />
      </label>

      <label>
        自キャラ
        <select value={myChar} onChange={(e) => setMyChar(e.target.value)}>
          {SF6_CHARACTERS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </label>

      <label>
        相手キャラ
        <select value={oppChar} onChange={(e) => setOppChar(e.target.value)}>
          {SF6_CHARACTERS.map((c) => (
            <option key={c} value={c}>{c}</option>
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
        <input type="number" value={mrBefore} onChange={(e) => setMrBefore(e.target.value)} required min={0} />
      </label>

      <label>
        MR（変動後）
        <input type="number" value={mrAfter} onChange={(e) => setMrAfter(e.target.value)} required min={0} />
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
