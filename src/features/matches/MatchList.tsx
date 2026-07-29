import { invoke } from "@tauri-apps/api/core";
import type { Match } from "../../domain/match";
import { characterDisplayName } from "../../domain/match";

interface Props {
  matches: Match[];
  onDeleted: () => void;
}

export function MatchList({ matches, onDeleted }: Props) {
  async function handleDelete(id: number) {
    try {
      await invoke("delete_match", { id });
      onDeleted();
    } catch (err) {
      console.error(err);
    }
  }

  if (matches.length === 0) {
    return <p className="empty">対戦データがありません</p>;
  }

  return (
    <div className="match-list">
      <h2>対戦履歴</h2>
      <table>
        <thead>
          <tr>
            <th>日時</th>
            <th>自キャラ</th>
            <th>相手キャラ</th>
            <th>結果</th>
            <th>MR</th>
            <th>差分</th>
            <th>メモ</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {matches.map((m) => (
            <tr key={m.id} className={m.result === "win" ? "row-win" : "row-loss"}>
              <td>{new Date(m.played_at).toLocaleString("ja-JP")}</td>
              <td>{characterDisplayName(m.my_character)}</td>
              <td>{characterDisplayName(m.opponent_character)}</td>
              <td>{m.result === "win" ? "勝ち" : "負け"}</td>
              <td>{m.mr_after}</td>
              <td className={m.mr_after - m.mr_before >= 0 ? "positive" : "negative"}>
                {m.mr_after - m.mr_before >= 0 ? "+" : ""}{m.mr_after - m.mr_before}
              </td>
              <td>{m.memo}</td>
              <td>
                <button className="btn-delete" onClick={() => m.id && handleDelete(m.id)}>削除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
