#!/usr/bin/env bash
# 逐一檢查 index.html 裡所有外部連結的 HTTP 狀態。任一不是 200 就 exit 1。
# 用 /usr/bin/curl 絕對路徑，避免被 rtk hook 改寫。
set -u
cd "$(dirname "$0")/.."
fail=0
while IFS= read -r url; do
  case "$url" in
    https://www.mopmtaiwan.com/*)
      # 這個站在 Cloudflare 後面，會擋 curl（403）。要用瀏覽器確認。
      echo "SKIP $url"; continue ;;
  esac
  code=$(/usr/bin/curl -sL -o /dev/null -m 30 -A 'Mozilla/5.0 (mopm-portal link check)' -w '%{http_code}' "$url")
  echo "$code $url"
  [ "$code" = "200" ] || fail=1
done < <(/usr/bin/grep -oE 'href="https?://[^"]+"' index.html | /usr/bin/sed -E 's/^href="//; s/"$//' | /usr/bin/sort -u)
exit $fail
