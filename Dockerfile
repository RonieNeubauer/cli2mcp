FROM node:22-alpine AS build

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY src ./src
COPY tsconfig.json tsup.config.ts ./
RUN pnpm build && pnpm prune --prod

FROM node:22-alpine

ENV NODE_ENV=production

RUN apk add --no-cache ripgrep \
  && addgroup -S app \
  && adduser -S -G app app

WORKDIR /app

COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

RUN mkdir -p /workspace \
  && chown -R app:app /app /workspace

USER app
WORKDIR /workspace

ENTRYPOINT ["node", "/app/dist/index.js", "rg", "--name", "ripgrep", "--description", "Search files under /workspace with ripgrep. Use this tool for fast read-only text search, regex matching, filename filtering, and codebase discovery. Prefer specific patterns and globs to narrow results. Inputs map directly to ripgrep flags and positional arguments. This tool does not modify files and returns plain-text ripgrep output, including matches, file paths, and error text on failure.", "--cwd", "/workspace"]
