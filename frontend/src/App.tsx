import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import OAuthCallback from './pages/OAuthCallback'
import Dashboard from './pages/Dashboard'
import Quiz from './pages/Quiz'
import Materials from './pages/Materials'
import Stats from './pages/Stats'
import Badges from './pages/Badges'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore(s => s.token)
  return token ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  const { token, fetchMe, theme } = useAuthStore()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    if (token) fetchMe()
  }, [token])

  return (
    <Routes>
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/oauth/callback" element={<OAuthCallback />} />
      <Route path="/auth/callback/:provider" element={<OAuthCallback />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index          element={<Dashboard />} />
        <Route path="quiz"      element={<Quiz />} />
        <Route path="materials" element={<Materials />} />
        <Route path="stats"     element={<Stats />} />
        <Route path="badges"    element={<Badges />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}