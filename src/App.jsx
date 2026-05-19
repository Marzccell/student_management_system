/**
 * App.jsx
 * =========
 * Root component that sets up:
 * - AuthProvider for authentication state
 * - React Router with protected and public routes
 * - Layout structure with Sidebar for authenticated pages
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import AppLayout from './components/layout/AppLayout'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import DashboardPage from './pages/DashboardPage'
import AssignmentsPage from './pages/AssignmentsPage'
import PlannerPage from './pages/PlannerPage'
import LoadingSpinner from './components/ui/LoadingSpinner'
import { AlertTriangle } from 'lucide-react'

function ConfigErrorScreen({ message }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-canvas)] px-4">
      <div className="w-full max-w-lg rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-red-50">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Deployment configuration missing</h1>
            <p className="mt-2 text-sm text-gray-600">{message}</p>
            <p className="mt-3 text-sm text-gray-600">
              Add these variables in Vercel Project Settings, then redeploy:
            </p>
            <div className="mt-3 rounded-xl bg-gray-50 px-3 py-2 font-mono text-xs text-gray-700">
              VITE_SUPABASE_URL<br />
              VITE_SUPABASE_ANON_KEY
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * ProtectedRoute — redirects to /login if user is not authenticated
 */
function ProtectedRoute({ children }) {
  const { user, loading, configError } = useAuth()

  if (configError) {
    return <ConfigErrorScreen message={configError} />
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-canvas)]">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

/**
 * PublicRoute — redirects to / if user is already authenticated
 */
function PublicRoute({ children }) {
  const { user, loading, configError } = useAuth()

  if (configError) {
    return <ConfigErrorScreen message={configError} />
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-canvas)]">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    )
  }

  if (user) {
    return <Navigate to="/" replace />
  }

  return children
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes — login and signup */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicRoute>
                <SignupPage />
              </PublicRoute>
            }
          />

          {/* Protected routes — wrapped in AppLayout */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<DashboardPage />} />
            <Route path="/assignments" element={<AssignmentsPage />} />
            <Route path="/planner" element={<PlannerPage />} />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
