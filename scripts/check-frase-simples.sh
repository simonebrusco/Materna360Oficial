#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:3011}"
COOKIE_JAR="$(mktemp)"
trap 'rm -f "$COOKIE_JAR"' EXIT

# 1) health
code="$(curl -sS -o /dev/null -w "%{http_code}" "$BASE_URL/api/ping")"
[ "$code" = "200" ] || { echo "FAIL: /api/ping $code"; exit 1; }

# 2) cria cookie de profile
curl -sS -i -c "$COOKIE_JAR" \
  -X POST "$BASE_URL/api/profile" \
  -H "Content-Type: application/json" \
  --data-raw '{"motherName":"Simone","children":["Filho 1"]}' > /dev/null

# 3) pega 1 item
resp1="$(curl -sS -b "$COOKIE_JAR" \
  -X POST "$BASE_URL/api/ai/meu-dia-leve/frase-simples" \
  -H "Content-Type: application/json" \
  --data-raw '{"slot":"3","focus":"filho","count":1}')"

id1="$(printf '%s' "$resp1" | python -c 'import json,sys; d=json.load(sys.stdin); print(d["items"][0]["id"])')"

# 4) pega outro item evitando o primeiro
resp2="$(curl -sS -b "$COOKIE_JAR" \
  -X POST "$BASE_URL/api/ai/meu-dia-leve/frase-simples" \
  -H "Content-Type: application/json" \
  --data-raw "{\"slot\":\"3\",\"focus\":\"filho\",\"avoidIds\":[\"$id1\"],\"count\":1}")"

id2="$(printf '%s' "$resp2" | python -c 'import json,sys; d=json.load(sys.stdin); print(d["items"][0]["id"])')"

if [ "$id1" = "$id2" ]; then
  echo "FAIL: anti-repetição não funcionou (id repetiu: $id1)"
  echo "resp1=$resp1"
  echo "resp2=$resp2"
  exit 1
fi

echo "OK: anti-repetição (id1=$id1, id2=$id2)"
