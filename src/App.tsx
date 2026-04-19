import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import CoachPage from './pages/CoachPage'
import AddAgentPage from './pages/AddAgentPage'
import CohortsPage from './pages/CohortsPage'
import LeaderboardPage from './pages/LeaderboardPage'
import GoalsPage from './pages/GoalsPage'
import MarketingPage from './pages/MarketingPage'
import CoachMarketingPage from './pages/CoachMarketingPage'

function RequireAuth({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" /></div>
  if (!user) return <Navigate to="/login" replace />
  return children
}

function RequireCoach({ children }: { children: JSX.Element }) {
  const { profile, loading } = useAuth()
  if (loading) return null
  if (profile?.role !== 'coach') return <Navigate to="/dashboard" replace />
  return children
}

function AppRoutes() {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" /></div>

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route element={<RequireAuth><Layout /></RequireAuth>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/marketing" element={<MarketingPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/goals" element={<GoalsPage />} />
        <Route path="/coach" element={<RequireCoach><CoachPage /></RequireCoach>} />
        <Route path="/coach/add-agent" element={<RequireCoach><AddAgentPage /></RequireCoach>} />
        <Route path="/coach/cohorts" element={<RequireCoach><CohortsPage /></RequireCoach>} />
        <Route path="/coach/marketing" element={<RequireCoach><CoachMarketingPage /></RequireCoach>} />
      </Route>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
