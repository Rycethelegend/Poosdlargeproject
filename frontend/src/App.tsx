import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { isLoggedIn } from './api';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MainMenuPage from './pages/MainMenuPage';
import ComingSoonPage from './pages/ComingSoonPage';

// Sends logged-out users to the login page
function RequireLogin({ children }: { children: ReactNode }) {
  return isLoggedIn() ? children : <Navigate to="/login" replace />;
}

// Sends logged-in users straight to the main menu
function RedirectIfLoggedIn({ children }: { children: ReactNode }) {
  return isLoggedIn() ? <Navigate to="/menu" replace /> : children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<RedirectIfLoggedIn><LoginPage /></RedirectIfLoggedIn>} />
      <Route path="/register" element={<RedirectIfLoggedIn><RegisterPage /></RedirectIfLoggedIn>} />
      <Route path="/menu" element={<RequireLogin><MainMenuPage /></RequireLogin>} />
      <Route path="/play" element={<RequireLogin><ComingSoonPage title="Game" /></RequireLogin>} />
      <Route path="/profile" element={<RequireLogin><ComingSoonPage title="Your Profile" /></RequireLogin>} />
      <Route path="/leaderboard" element={<RequireLogin><ComingSoonPage title="Leaderboard" /></RequireLogin>} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
