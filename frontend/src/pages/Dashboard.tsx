import { useEffect, useState } from "react";
import { getDashboard, clearJwt } from "../api";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const [data, setData] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    getDashboard()
      .then(setData)
      .catch(() => setError("Failed to load dashboard data."));
  }, []);

  function handleLogout() {
    clearJwt();
    navigate("/", { replace: true });
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <button onClick={handleLogout}>Logout</button>
      </div>
      {error && <p className="error">{error}</p>}
      {data ? (
        <pre className="data-block">{JSON.stringify(data, null, 2)}</pre>
      ) : (
        !error && <p>Loading&hellip;</p>
      )}
    </div>
  );
}
