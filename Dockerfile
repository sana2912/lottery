###################
# DEPS STAGE
###################

FROM oven/bun:1.3.13 AS deps

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --ignore-scripts

COPY . .

###################
# BUILD STAGE
###################

FROM deps AS build-stage

ARG NODE_ENV=production

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=${NODE_ENV}

RUN DATABASE_URL="postgresql://prisma:prisma@localhost:5432/prisma" bun run prisma:generate

RUN bun next build && \
    if [ ! -f ".next/BUILD_ID" ]; then \
        echo "Error: Next.js build failed - .next/BUILD_ID not found!" && exit 1; \
    fi

###################
# PRODUCTION STAGE
# Uses Next.js standalone output - no node_modules copy needed
###################

FROM oven/bun:1.3.13-slim AS production

ARG NODE_ENV=production

ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=${NODE_ENV}
ENV PORT=3000

WORKDIR /app

# Standalone server + static assets
COPY --from=build-stage --chown=bun:bun /app/.next/standalone ./
COPY --from=build-stage --chown=bun:bun /app/.next/static ./.next/static
COPY --from=build-stage --chown=bun:bun /app/public ./public

USER bun

EXPOSE 3000

CMD ["bun", "server.js"]



