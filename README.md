# SF6 Lab

ストリートファイター6のランクマッチ分析ツール。対戦結果を記録し、MR推移やキャラ別勝率を可視化します。

## 機能

- 対戦結果の手動入力・一覧表示
- MR推移の折れ線グラフ
- 自キャラ / 相手キャラ別の勝率表示
- 直近N戦フィルタ
- ローカルSQLiteによるデータ永続化

## 技術スタック

- **Frontend**: React + TypeScript + Vite
- **Desktop**: Tauri (Rust)
- **Storage**: SQLite (rusqlite)
- **Chart**: Recharts
- **State**: Zustand + TanStack Query

## セットアップ

### 前提条件

- [Node.js](https://nodejs.org/) v20以上
- [Rust](https://rustup.rs/) stable
- [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)（WindowsでのRustビルドに必要）

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

## 開発ルール

- **ブランチ**: Issueからブランチを切る（例: `feat/#12-match-crud`）
- **コミット**: Conventional Commits（`feat:`, `fix:`, `chore:`）
- **PR**: 対応Issueをリンク（`Closes #XX`）、PRテンプレートに従う
- **CI**: push / PR時にTypeScriptチェック・Rustチェックが自動実行

## 将来の拡張予定

- スクリーンショット / OCRによる自動入力
- リプレイファイル解析
- 入力デバイスログ連携（技使用頻度の分析）
