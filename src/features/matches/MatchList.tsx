import { invoke } from "@tauri-apps/api/core";
import type { Match } from "@/domain/match";
import { characterDisplayName } from "@/domain/match";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
    return (
      <Card>
        <CardContent className="text-muted-foreground py-10 text-center">
          対戦データがありません
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>対戦履歴</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>日時</TableHead>
              <TableHead>自キャラ</TableHead>
              <TableHead>相手キャラ</TableHead>
              <TableHead>結果</TableHead>
              <TableHead>MR</TableHead>
              <TableHead>差分</TableHead>
              <TableHead>メモ</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {matches.map((m) => {
              const delta = m.mr_after - m.mr_before;
              return (
                <TableRow key={m.id} className={m.result === "win" ? "border-l-3 border-l-green-500" : "border-l-3 border-l-red-500"}>
                  <TableCell>{new Date(m.played_at).toLocaleString("ja-JP")}</TableCell>
                  <TableCell>{characterDisplayName(m.my_character)}</TableCell>
                  <TableCell>{characterDisplayName(m.opponent_character)}</TableCell>
                  <TableCell>
                    <Badge variant={m.result === "win" ? "default" : "destructive"}>
                      {m.result === "win" ? "勝ち" : "負け"}
                    </Badge>
                  </TableCell>
                  <TableCell>{m.mr_after}</TableCell>
                  <TableCell className={delta >= 0 ? "text-green-600" : "text-red-600"}>
                    {delta >= 0 ? "+" : ""}{delta}
                  </TableCell>
                  <TableCell>{m.memo}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive border-destructive/40"
                      onClick={() => m.id && void handleDelete(m.id)}
                    >
                      削除
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
