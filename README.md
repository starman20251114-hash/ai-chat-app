# AI Chat

汎用AIアシスタントとの対話ができるWebチャットアプリケーション。

## 技術スタック

| レイヤー | 技術 |
|---|---|
| フロントエンド | Next.js 16 (App Router) / Tailwind CSS |
| API | Hono |
| AI | Mastra + Claude (claude-sonnet-4-6) |
| ORM | Prisma 6 |
| データベース | MongoDB |
| ホスティング | Google Cloud Run |

## セットアップ

```bash
# 依存パッケージのインストール + .env.local の雛形作成
make setup
```

`.env.local` を編集して以下を設定してください：

```env
ANTHROPIC_API_KEY=sk-ant-...
DATABASE_URL=mongodb+srv://...
```

## 開発

```bash
make dev   # 開発サーバー起動 (localhost:3000)
make build # 本番ビルド
make lint  # Lint
```

## デプロイ

Google Cloud Run へデプロイします。`gcloud` CLI の認証が必要です。

```bash
make deploy
```

デプロイ先: https://ai-chat-app-1083012423443.asia-northeast1.run.app

## 環境変数

| 変数 | 説明 |
|---|---|
| `ANTHROPIC_API_KEY` | Anthropic API キー |
| `DATABASE_URL` | MongoDB 接続文字列 |
| `GCP_PROJECT_ID` | GCP プロジェクト ID |
| `GCP_REGION` | GCP リージョン（デフォルト: asia-northeast1） |
| `AR_REPO` | Artifact Registry リポジトリ名 |
| `IMAGE_NAME` | Docker イメージ名 |
| `SERVICE_NAME` | Cloud Run サービス名 |

GCP 変数は `.env.local` に記載することで `make deploy` 時に自動で読み込まれます（`.env.example` 参照）。
