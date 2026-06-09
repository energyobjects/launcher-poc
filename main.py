import os
import secrets
import threading
import webbrowser

import uvicorn

from backend.auth import set_pending_token

TOKEN_BYTES = 32


def main():
    host = os.environ.get("HOST", "127.0.0.1")
    port = int(os.environ.get("PORT", "8000"))
    no_browser = os.environ.get("NO_BROWSER", "").lower() in ("1", "true", "yes")

    token = secrets.token_urlsafe(TOKEN_BYTES)
    set_pending_token(token)

    host_port = int(os.environ.get("HOST_PORT", port))
    url = f"http://localhost:{host_port}?token={token}"
    print()
    print("=" * 60)
    print("  Open your browser to:")
    print(f"  {url}")
    print("=" * 60)
    print()

    if not no_browser:
        threading.Timer(1.5, webbrowser.open, args=[url]).start()

    uvicorn.run("backend.app:app", host=host, port=port, reload=False)


if __name__ == "__main__":
    main()
