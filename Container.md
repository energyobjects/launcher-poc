# Container

## Build

```bash
podman build -t launcher-poc .
```

## Run

```bash
./run.sh
```

This picks a random free port on the host, starts the container, and prints the URL with that port. Open the printed URL to authenticate.

To use a fixed port instead:

```bash
podman run --rm -p 8000:8000 -e HOST_PORT=8000 launcher-poc
```

## Notes

- `NO_BROWSER=1` is set in the container — the browser does not open automatically. Copy the printed URL and open it manually.
- The server binds to `0.0.0.0:8000` inside the container; `run.sh` maps a random host port to it.
- The token is one-time use. Restart the container to get a new session.
