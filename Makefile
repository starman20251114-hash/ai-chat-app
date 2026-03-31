.PHONY: install setup dev build start lint deploy

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

# Vercel へデプロイ（vercel CLI が必要）
deploy:
	npx vercel --prod
