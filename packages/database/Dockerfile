FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache openssl
RUN corepack enable

COPY package.json pnpm-workspace.yaml turbo.json ./
COPY packages/database/package.json ./packages/database/package.json

RUN pnpm install --frozen-lockfile --filter=database...

COPY packages/database ./packages/database
RUN cd packages/database && pnpm exec prisma generate

EXPOSE 5555
CMD ["npx", "prisma", "studio", "--host", "0.0.0.0"]
