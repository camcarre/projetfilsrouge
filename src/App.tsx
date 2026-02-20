import { useEffect } from 'preact/hooks'
import { Routes, Route } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { lazy, Suspense } from 'preact/compat'
import { Layout } from '@/components/layout/Layout'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { PageLoadingFallback } from '@/components/PageLoadingFallback'
import { setUser } from '@/store/slices/authSlice'
import { getSession } from '@/services/authService'
import { isCustomApiConfigured } from '@/services/api/client'

const DashboardPage = lazy(() => import('@/pages/Dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })))
const PortfolioPage = lazy(() => import('@/pages/Portfolio/PortfolioPage').then((m) => ({ default: m.PortfolioPage })))
const AuthPage = lazy(() => import('@/pages/Auth/AuthPage').then((m) => ({ default: m.AuthPage })))
const AnalysisPage = lazy(() => import('@/pages/Analysis/AnalysisPage').then((m) => ({ default: m.AnalysisPage })))
const EtfPage = lazy(() => import('@/pages/Etf/EtfPage').then((m) => ({ default: m.EtfPage })))
const EducationPage = lazy(() => import('@/pages/Education/EducationPage').then((m) => ({ default: m.EducationPage })))
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })))

function App() {
  const dispatch = useDispatch()

  useEffect(() => {
    if (!isCustomApiConfigured()) return
    getSession().then(({ user }) => dispatch(setUser(user)))
    const on401 = () => dispatch(setUser(null))
    window.addEventListener('auth:401', on401)
    return () => window.removeEventListener('auth:401', on401)
  }, [dispatch])

  return (
    <Layout>
      <ErrorBoundary>
        <Suspense fallback={<PageLoadingFallback />}>
          <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
          <Route path="/analysis" element={<AnalysisPage />} />
          <Route path="/etf" element={<EtfPage />} />
          <Route path="/education/*" element={<EducationPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </Layout>
  )
}

export default App
