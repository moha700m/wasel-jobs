# واصل | Wasel

Upload your CV, connect your email, and apply to Saudi jobs by email with tailored Arabic/English messages. Arabic-first RTL UI with an English toggle.

## Run
`npm i && npm start` (port 3000)

## Env vars
| var | purpose |
|---|---|
| `SESSION_SECRET` | cookie signing (required in prod) |
| `ENC_KEY` | AES-256-GCM key material for stored mail credentials (required in prod) |
| `BASE_URL` | public URL, e.g. https://wasel.onrender.com (needed for the OAuth redirect) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | enables one-click Gmail (scope `gmail.send`). Redirect URI: `$BASE_URL/api/mail/google/callback` |
| `ADMIN_TOKEN` | enables `POST /api/admin/jobs` (header `x-admin-token`) |
| `DRY_RUN=1` | never send for real; mark applications `dry-run` |
| `DATA_DIR` | where `db.json` and CVs are stored (mount a persistent disk here) |

## Add a job (admin)
```
curl -X POST $BASE_URL/api/admin/jobs -H "x-admin-token: $ADMIN_TOKEN" -H 'Content-Type: application/json' \
 -d '{"company":"X","title":"Accountant","title_ar":"محاسب","city":"Riyadh","email":"hr@x.sa","source":"https://...","skills":["accounting"],"subject_format":"{title} – {name}"}'
```

## Safety
Review mode is the default. Auto mode runs hourly with a daily cap of 20 or less and random 4–8 s spacing. The tool never emails the same address twice, and secrets are encrypted at rest and never logged. Research notes are in RESEARCH.md.
