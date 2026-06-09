# Plan: Secure One-Time Token Web App (FastAPI + React)

## Context

Build a proof-of-concept web application modeled on Jupyter Notebook's startup security: the server generates a cryptographically random one-time token on startup, prints a URL containing it to the terminal, and auto-opens that URL in the browser. The frontend captures the token, exchanges it for a short-lived JWT, then discards the raw token. All subsequent API calls use the JWT as a Bearer token. This gives secure, zero-configuration local access without any user/password management.

---

## Directory Layout

```
launcher-poc/
├── pyproject.toml              # add fastapi, uvicorn, python-jose, pydantic-settings
├── main.py                     # entry point: mint token → print URL → open browser → uvicorn
├── backend/
│   ├── __init__.py
│   ├── app.py                  # FastAPI factory: CORS, routers, static file serving
│   ├── auth.py                 # one-time token state, /auth/token exchange, JWT helpers
│   ├── routes.py               # protected /api routes (dashboard endpoint)
│   └── config.py               # Settings: jwt_secret, cors_origins
├── frontend/                   # Vite + React + TypeScript (npm create vite@latest)
│   ├── package.json
│   ├── vite.config.ts          # proxy /auth and /api to localhost:8000
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx             # route: TokenGate if ?token present, else Dashboard guard
│       ├── api.ts              # fetch wrapper + JWT sessionStorage helpers
│       └── pages/
│           ├── TokenGate.tsx   # on mount: exchange token → store JWT → navigate away
│           └── Dashboard.tsx   # protected page; calls /api/dashboard
└── static/                     # git-ignored; populated by: npm run build -- --outDir ../static
```

---

## Token Lifecycle

```
python main.py
  1. secrets.token_urlsafe(32) → TOKEN  (256-bit, URL-safe)
  2. set_pending_token(TOKEN)            (stored in-process memory)
  3. print URL to terminal
  4. threading.Timer(1.5s) → webbrowser.open(http://localhost:8000?token=TOKEN)
  5. uvicorn.run()

Browser opens /?token=TOKEN
  App.tsx → detects ?token → renders <TokenGate>
  TokenGate.useEffect:
    window.history.replaceState()       (strips token from URL/history immediately)
    POST /auth/token  {token: TOKEN}
      backend: secrets.compare_digest, set _pending_token=None (consumed)
      returns {access_token: JWT}       (HS256, exp = now + 60 min)
    sessionStorage.setItem("launcher_jwt", JWT)
    navigate("/dashboard")

GET /api/dashboard
  Authorization: Bearer JWT
  backend: jose.jwt.decode → OK → returns data

Second POST /auth/token attempt → 401 (token already None)
```

---

## Critical Files

### `main.py`
- Generate token with `secrets.token_urlsafe(32)`
- Call `backend.auth.set_pending_token(token)`
- Print URL, schedule `webbrowser.open` via `threading.Timer(1.5, ...)`
- `uvicorn.run("backend.app:app", host="127.0.0.1", port=8000, reload=False)`

### `backend/auth.py`
- `_pending_token: Optional[str]` guarded by `threading.Lock()`
- `set_pending_token(token)` — called from `main.py`
- `_consume_pending_token(candidate)` — compare_digest + clear in one lock acquisition
- `POST /auth/token` — calls consume, returns JWT on success, 401 on failure
- `verify_jwt(token)` — used by protected routes

### `backend/config.py`
- `jwt_secret = secrets.token_hex(32)` (fresh per process; invalidates old JWTs on restart)
- `cors_origins = ["http://localhost:5173"]`

### `backend/app.py`
- `CORSMiddleware` with `settings.cors_origins`
- Include `auth_router` (`/auth`) and `api_router` (`/api`)
- If `static/` exists: mount `/assets` → `static/assets/`, then catch-all `/{path}` → `index.html`
- Routers must be registered **before** the catch-all

### `backend/routes.py`
- `HTTPBearer` security scheme + `Depends(require_auth)` that calls `verify_jwt`
- `GET /api/dashboard` — returns a simple JSON payload

### `frontend/vite.config.ts`
- Proxy `/auth` and `/api` to `http://localhost:8000`

### `frontend/src/api.ts`
- `storeJwt / getJwt / clearJwt` using `sessionStorage`
- `exchangeToken(rawToken)` — POST /auth/token, no auth header
- `apiFetch(path)` — injects `Authorization: Bearer <jwt>`, redirects to `/` on 401
- `getDashboard()` — uses `apiFetch`

### `frontend/src/pages/TokenGate.tsx`
- `useEffect` on mount: read `?token`, call `window.history.replaceState()`, exchange, store JWT, navigate
- Show error if token missing or exchange fails

### `frontend/src/App.tsx`
- If `?token` in URL → `<TokenGate />`
- `/dashboard` wrapped in `<ProtectedRoute>` (checks `getJwt()`)

---

## Verification

1. `python main.py` → token URL printed, browser opens
2. Browser navigates to `/dashboard` automatically after exchange
3. `/api/dashboard` returns JSON (proves JWT works)
4. Reloading `/dashboard` still works (JWT in sessionStorage)
5. Second browser tab with same URL → 401 (token consumed)
6. Raw token absent from URL bar after page loads (replaceState worked)
7. `python main.py` again → old JWT invalid (new secret), must re-authenticate
