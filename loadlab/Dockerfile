FROM oven/bun:1.1.8

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install

COPY src ./src

EXPOSE 3001

CMD ["bun", "run", "src/server.ts"]