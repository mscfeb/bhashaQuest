import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import LoginPage from "../pages/LoginPage.jsx";
import DashboardPage from "../pages/DashboardPage.jsx";
import ChallengePage from "../pages/ChallengePage.jsx";
import ResultsPage from "../pages/ResultsPage.jsx";
import ProgressPage from "../pages/ProgressPage.jsx";
import LeaderboardPage from "../pages/LeaderboardPage.jsx";
import { getStoredUserProfile } from "../services/auth.js";

function RequireAuth() {
  const user = getStoredUserProfile();

  return user && Object.keys(user).length > 0 ? (
    <Outlet />
  ) : (
    <Navigate to="/login" replace />
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route element={<RequireAuth />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/challenge" element={<ChallengePage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/results/:submissionId" element={<ResultsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
