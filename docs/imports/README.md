# ADM Seeds — Supabase (Base Curada)

Esta pasta contém os CSVs oficiais (seed) da Base Curada do ADM para o Materna360.

Arquivos:
- `materna360_adm_ideas_seed_plan_now.csv`
- `materna360_adm_editorial_texts_seed_plan_now.csv`

## Pré-requisitos
- `psql` instalado
- `DATABASE_URL` configurada (idealmente via Pooler do Supabase, com `sslmode=require`)

## Verificar conexão
```bash
psql "$DATABASE_URL" -c "select now();"
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "\
\\copy public.adm_ideas (id, hub, title, short_description, steps, duration_minutes, age_band, environment, tags, status, created_at, updated_at) \
from 'docs/imports/materna360_adm_ideas_seed_plan_now.csv' \
with (format csv, header true, encoding 'UTF8') \
"
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "\
\\copy public.adm_editorial_texts (id, hub, key, context, title, body, status, created_at, updated_at) \
from 'docs/imports/materna360_adm_editorial_texts_seed_plan_now.csv' \
with (format csv, header true, encoding 'UTF8') \
"
psql "$DATABASE_URL" -c "select hub, status, count(*) from public.adm_ideas group by 1,2 order by 1,2;"
psql "$DATABASE_URL" -c "select hub, \"key\", status, left(body,80) as preview, updated_at from public.adm_editorial_texts order by updated_at desc;"

