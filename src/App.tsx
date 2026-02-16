import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { Layout } from '@/components/layout/Layout'
import { setUser } from '@/store/slices/authSlice'
import { getSession } from '@/services/authService'
import { isCustomApiConfigured } from '@/services/api/client'

import { DashboardPage } from '@/pages/Dashboard/DashboardPage'
import { PortfolioPage } from '@/pages/Portfolio/PortfolioPage'
import { AuthPage } from '@/pages/Auth/AuthPage'
import { AnalysisPage } from '@/pages/Analysis/AnalysisPage'
import { EtfPage } from '@/pages/Etf/EtfPage'
import { EducationPage } from '@/pages/Education/EducationPage'

function App() {
  const dispatch = useDispatch()

  useEffect(() => {
    if (isCustomApiConfigured()) {
      getSession().then(({ user }) => dispatch(setUser(user)))
    }
  }, [dispatch])

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/portfolio" element={<PortfolioPage />} />
        <Route path="/analysis" element={<AnalysisPage />} />
        <Route path="/etf" element={<EtfPage />} />
        <Route path="/education" element={<EducationPage />} />
      </Routes>
    </Layout>
  )
}

export default App
