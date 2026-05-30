FROM oven/bun:latest AS base

WORKDIR /app

ARG DATABASE_URL=postgresql://fynman:fynman@postgres:5432/fynmanai?schema=public
ENV DATABASE_URL=${DATABASE_URL}

RUN apt-get update \
	&& apt-get install -y --no-install-recommends \
		bash \
		build-essential \
		ca-certificates \
		curl \
		git \
		python3 \
		python3-pip \
		python3-venv \
	&& rm -rf /var/lib/apt/lists/*

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

FROM base AS deps

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --no-cache --backend=copyfile

FROM deps AS build

COPY . .

RUN bunx prisma generate

ENV MARKITDOWN_REPO_DIR=/app/.markitdown-src
ENV MARKITDOWN_VENV_DIR=/app/.venv-markitdown

RUN sed -i 's/\r$//' /app/scripts/docker-setup-markitdown.sh /app/scripts/docker-start.sh \
	&& chmod +x /app/scripts/docker-setup-markitdown.sh /app/scripts/docker-start.sh \
	&& bash /app/scripts/docker-setup-markitdown.sh

FROM base AS runner

ENV NODE_ENV=production
ENV PORT=8000
ENV MARKITDOWN_REPO_DIR=/app/.markitdown-src
ENV MARKITDOWN_VENV_DIR=/app/.venv-markitdown
ENV DOC_PARSER_PYTHON_PATH=/app/.venv-markitdown/bin/python
ENV DOC_PARSER_SCRIPT_PATH=/app/src/services/python/parse_document.py
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/.venv-markitdown ./.venv-markitdown
COPY --from=build /app/.markitdown-src ./.markitdown-src
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/bun.lock ./bun.lock
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
COPY --from=build /app/modifiedprompt.ts ./modifiedprompt.ts
COPY --from=build /app/prompts.ts ./prompts.ts
COPY --from=build /app/src ./src
COPY --from=build /app/scripts ./scripts

RUN chmod +x /app/scripts/docker-start.sh

EXPOSE 8000

CMD ["/app/scripts/docker-start.sh"]
