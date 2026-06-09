import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { getJwt } from "./api";
import Dashboard from "./pages/Dashboard";
import TokenGate from "./pages/TokenGate";

function ProtectedRoute({ children }: { children: JSX.Element }) {
  return getJwt() ? children : <Navigate to="/" replace />;
}

export default function App() {
  const hasToken = new URLSearchParams(window.location.search).has("token");

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            hasToken ? (
              <TokenGate />
            ) : (
              <div className="no-session">
                <h2>No active session</h2>
                <p>Start the server and open the URL printed in the terminal.</p>
              </div>
            )
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
