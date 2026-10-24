#!/usr/bin/env bash
# Pre-generates the optimized variants of every property photo so no visitor
# waits for the first resize (~0.6 s per variant from ~3 MB phone photos).
# Already-cached variants answer in a few ms, so running it often is cheap.
# Runs on the server: after each deploy (deploy/build.sh) and from cron, e.g.
#   */30 * * * * bash $HOME/ucci/deploy/warm-images.sh >> /tmp/warm-images.log 2>&1
set -euo pipefail
cd "$(dirname "$0")/.."

domain="$(grep -E '^DOMAIN=' .env.production | cut -d= -f2- | tr -d '"')"
base="https://$domain"
# Hit Caddy on this machine, not the public IP round trip.
resolve=(--resolve "$domain:443:127.0.0.1")

# Widths browsers pick for the gallery (64/128 backdrop, 96/256 thumbnails,
# 1080/1920 main photo), the listing cards (640/1080) and the lightbox.
widths=(64 96 128 256 640 1080 1920)

# Right after a deploy the site may still be starting.
for _ in $(seq 1 30); do
  sitemap="$(curl -fsS "${resolve[@]}" "$base/sitemap.xml" 2>/dev/null)" && break
  sleep 2
done
fichas="$(echo "${sitemap:-}" | grep -oE "$base/propiedades/[0-9a-f-]{36}" | sort -u || true)"

photos="$(for page in $fichas; do
  curl -fsS "${resolve[@]}" "$page" | grep -oE 'url=https%3A%2F%2F[^&"]+' || true
done | sort -u)"

total=0
cold=0
for photo in $photos; do
  for w in "${widths[@]}"; do
    t="$(curl -sS -o /dev/null "${resolve[@]}" -H 'Accept: image/webp,image/*' \
      -w '%{time_total}' "$base/_next/image?$photo&w=$w&q=75" || echo 0)"
    total=$((total + 1))
    if awk "BEGIN { exit !($t > 0.3) }"; then cold=$((cold + 1)); fi
  done
done

echo "$(date '+%F %T') warm-images: $(echo "$fichas" | grep -c . || true) fichas, $(echo "$photos" | grep -c . || true) photos, $total variants, $cold generated now"
