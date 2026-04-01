.PHONY: install setup dev build start lint docker-build deploy

# ── デプロイ変数（.env.local に設定するか、コマンド実行時に上書き可能） ──
# 例: make deploy GCP_PROJECT_ID=your-project-id
-include .env.local
export

GCP_PROJECT_ID ?= your-project-id
GCP_REGION     ?= asia-northeast1
AR_REPO        ?= ai-chat
IMAGE_NAME     ?= ai-chat-app
SERVICE_NAME   ?= ai-chat-app
IMAGE_TAG      ?= $(GCP_REGION)-docker.pkg.dev/$(GCP_PROJECT_ID)/$(AR_REPO)/$(IMAGE_NAME)
# ─────────────────────────────────────────────────────────────────────────

# 依存パッケージのインストール + Prisma クライアント生成
install:
	npm install
	npx prisma generate

# 初回セットアップ（install + .env.local の雛形作成）
setup: install
	@if [ ! -f .env.local ]; then \
		cp .env.example .env.local 2>/dev/null || \
		printf 'ANTHROPIC_API_KEY=sk-ant-...\nDATABASE_URL=mongodb+srv://...\n' > .env.local; \
		echo ".env.local を作成しました。APIキーを設定してください。"; \
	else \
		echo ".env.local はすでに存在します。"; \
	fi

# 開発サーバー起動
dev:
	npm run dev

# 本番ビルド
build:
	npm run build

# 本番サーバー起動（build 後に実行）
start:
	npm run start

# Lint
lint:
	npm run lint

# Docker イメージをローカルでビルドして動作確認
docker-build:
	docker build -t $(IMAGE_NAME):local .
	docker run --rm -p 3000:3000 \
		--env-file .env.local \
		$(IMAGE_NAME):local

# Cloud Run へデプロイ（gcloud CLI が必要）
deploy:
	gcloud builds submit --tag $(IMAGE_TAG) --project $(GCP_PROJECT_ID)
	gcloud run deploy $(SERVICE_NAME) \
		--image $(IMAGE_TAG) \
		--region $(GCP_REGION) \
		--platform managed \
		--allow-unauthenticated \
		--min-instances=0 \
		--max-instances=10 \
		--timeout=60 \
		--startup-probe=httpGet.path=/api/health,initialDelaySeconds=5,timeoutSeconds=5,periodSeconds=10,failureThreshold=3 \
		--set-secrets=ANTHROPIC_API_KEY=ANTHROPIC_API_KEY:latest,DATABASE_URL=DATABASE_URL:latest \
		--project $(GCP_PROJECT_ID)
