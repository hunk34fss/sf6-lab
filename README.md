# SF6 Lab

ストリートファイター6のランクマッチ分析ツール。対戦結果を記録し、MR推移やキャラ別勝率を可視化します。

## 機能

- 対戦結果の手動入力・一覧表示
- **スクリーンショット / OCR による自動入力**（ファイル選択・クリップボード・**F8でSF6ウィンドウ自動キャプチャ**）
- OCR解析結果のフォーム反映（確認後に登録）
- **シーズン管理**（ランクリセット時に現行を閉じて新規開始。過去戦績は保持）
- シーズン別の MR 推移・キャラ別勝率
- シーズン戦績の**印刷 / PDF 保存**
- 直近N戦フィルタ
- ローカルSQLiteによるデータ永続化

## 技術スタック

- **Frontend**: React + TypeScript + Vite
- **UI**: shadcn/ui + Tailwind CSS v4
- **Desktop**: Tauri (Rust)
- **Storage**: SQLite (rusqlite)
- **OCR**: Windows.Media.Ocr（WinRT）
- **Chart**: Recharts
- **State**: Zustand + TanStack Query

## セットアップ

### 前提条件

- [Node.js](https://nodejs.org/) v20以上
- [Rust](https://rustup.rs/) stable
- [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)（WindowsでのRustビルドに必要）
- Windows OCR 言語パック（日本語/英語。設定 → 時刻と言語 → 言語と地域）

### インストール

```bash
git clone https://github.com/hunk34fss/sf6-lab.git
cd sf6-lab
npm install
```

### 開発サーバー起動

```bash
npm run tauri dev
```

### プロダクションビルド

```bash
npm run tauri build
```

## OCR取込の使い方

1. アプリの「対戦入力」タブを開く
2. 次のいずれかで画像を取り込む
   - フォーム下部の「OCR取込」ボタン → ファイル選択 / クリップボード貼り付け
   - **グローバルホットキー `F8`**: Street Fighter 6 ウィンドウを自動キャプチャ → OCR → ダイアログ表示
3. 解析結果を確認し、「フォームに反映」（ダイアログは自動で閉じます）
4. 必要なら手動修正して「登録」

「閉じる」ボタンでもダイアログを閉じられます。

### F8 キャプチャの注意

- SF6 を起動した状態で押してください（ウィンドウタイトルに Street Fighter 6 を含むもの）
- 排他フルスクリーンでは黒画面になる場合があります。ウィンドウ / ボーダレス推奨
- アプリが最小化されていても F8 は有効です

## シーズン / ランクリセット

1. ヘッダーの「シーズンをリセット」で現行シーズンを閉じ、新しいシーズンを開始します
2. 過去の対戦は削除されず、ダッシュボードのシーズン選択から閲覧できます
3. 「印刷 / PDF」でシーズンレポートを開き、OS の印刷ダイアログから PDF に保存できます

入力タブの一覧・新規登録は常に**現行シーズン**のみが対象です。

## 開発ルール

- **ブランチ**: Issueからブランチを切る（例: `feat/#12-match-crud`）
- **統合ブランチ**: 大きな機能は `develop-*` に集約し、完了後に `master` へPR
- **コミット**: Conventional Commits（`feat:`, `fix:`, `chore:`）
- **PR**: 対応Issueをリンク（`Closes #XX`）、PRテンプレートに従う。`master` へのマージは GitHub Web で承認
- **CI**: push / PR時にTypeScriptチェック・Rustチェックが自動実行

## 将来の拡張予定

- OCR精度向上（領域切り出し・解像度対応）
- リプレイファイル解析
- 入力デバイスログ連携（技使用頻度の分析）
- ホットキーのカスタマイズ UI
