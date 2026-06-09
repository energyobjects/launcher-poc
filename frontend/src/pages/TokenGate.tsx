import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { exchangeToken, storeJwt } from "../api";

export default function TokenGate() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const rawToken = params.get("token");

    if (!rawToken) {
      setError("No token provided. Start the server and use the printed URL.");
      return;
    }

    // Strip token from URL so it doesn't live in browser history
    window.history.replaceState({}, "", window.location.pathname);

    exchangeToken(rawToken)
      .then((jwt) => {
        storeJwt(jwt);
        navigate("/dashboard", { replace: true });
      })
      .catch(() => {
        setError("Token invalid or already used. Restart the server.");
      });
  }, [navigate]);

  if (error) {
    return (
      <div className="gate-error">
        <h2>Authentication Failed</h2>
        <p>{error}</p>
      </div>
    );
  }

  return <div className="gate-loading">Authenticating&hellip;</div>;
}
