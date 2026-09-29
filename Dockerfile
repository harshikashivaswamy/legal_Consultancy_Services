# syntax=docker/dockerfile:1
# Production image for AWS (ECS Fargate / ECS Express Mode). Serves the website AND the /api/* routes
# from one Node process (TanStack Start + Nitro "node-server" build).

# ---------- build stage ----------
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .

# VITE_* values are baked into the browser bundle at BUILD time, so pass them as build args.
# (They are public values: the Supabase URL and the *anon* key. Never pass secret keys here.)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_RAZORPAY_KEY_ID
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY \
    VITE_RAZORPAY_KEY_ID=$VITE_RAZORPAY_KEY_ID \
    NITRO_PRESET=node-server

RUN npm run build \
 && (test -f .output/server/index.mjs || { \
      echo "ERROR: expected .output/server/index.mjs but it was not produced."; \
      echo "The build did not use the Node preset. See DEPLOYMENT_AWS.md > Troubleshooting."; \
      ls -la . .output 2>/dev/null; \
      exit 1; })

# ---------- runtime stage ----------
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    PORT=8080 \
    HOST=0.0.0.0

COPY --from=build --chown=node:node /app/.output ./.output

USER node
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8080)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", ".output/server/index.mjs"]
