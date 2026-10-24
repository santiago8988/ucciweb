#!/usr/bin/env bash
# Builds ucci-web on the server from .env.production and restarts the site.
# Run from the repo folder on the instance (~/ucci): bash deploy/build.sh
# Tags each build with the date so the previous image stays available for
# rollback (see DEPLOY.md, "Actualizar y volver atrás").
set -euo pipefail
cd "$(dirname "$0")/.."

env_value() { grep -E "^$1=" .env.production | head -1 | cut -d= -f2- | sed -E 's/^"(.*)"$/\1/'; }

tag="ucci-web:$(date +%Y%m%d-%H%M)"
secret_file="$(mktemp)"
trap 'rm -f "$secret_file"' EXIT
printf '%s' "$(env_value DATABASE_URL)" > "$secret_file"

docker build \
  --secret id=database_url,src="$secret_file" \
  --build-arg NEXT_PUBLIC_SITE_URL="$(env_value NEXT_PUBLIC_SITE_URL)" \
  --build-arg NEXT_PUBLIC_GA_ID="$(env_value NEXT_PUBLIC_GA_ID)" \
  --build-arg ORGANIZATION_ID="$(env_value ORGANIZATION_ID)" \
  --build-arg SUPABASE_STORAGE_HOST="$(env_value SUPABASE_STORAGE_HOST)" \
  -t "$tag" -t ucci-web:latest .

docker compose --env-file .env.production up -d web
docker image ls ucci-web
echo "Deployed $tag"
