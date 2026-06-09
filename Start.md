# Running the App

## Production (single command)

Build the frontend once, then start the server:

```bash
cd frontend && npm run build -- --outDir ../static && cd ..
python main.py
```

The terminal will print a URL and open it in your browser automatically:

```
============================================================
  Open your browser to:
  http://localhost:8000?token=<TOKEN>
============================================================
```

The browser authenticates and lands on the dashboard. No further steps needed.

## Development (hot reload)

Run the backend and Vite dev server in separate terminals:

```bash
# Terminal 1 — FastAPI backend
python main.py
```

```bash
# Terminal 2 — Vite dev server (port 5173)
cd frontend && npm run dev
```

Copy the token from the Terminal 1 output and navigate to:

```
http://localhost:5173?token=<TOKEN>
```

Vite proxies `/auth` and `/api` requests to the FastAPI server on port 8000.

## Notes

- The token is one-time use — a second browser tab with the same URL will get a 401.
- Restarting `python main.py` invalidates all previous JWTs (new secret generated on each start).
- The JWT expires after 60 minutes; refresh the session by restarting the server.
