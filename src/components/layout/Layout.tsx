import { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'

const navItems = [
  { path: '/', label: 'Tableau de bord' },
  { path: '/portfolio', label: 'Portefeuille' },
  { path: '/analysis', label: 'Analyse' },
  { path: '/etf', label: 'Recommandations ETF' },
  { path: '/education', label: 'Éducation' },
]

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation()

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-primary-500 text-white shadow">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="font-semibold text-lg">
            Finance PWA
          </Link>
          <nav className="flex gap-4" aria-label="Navigation principale">
            {navItems.map(({ path, label }) => (
              <Link
                key={path}
                to={path}
                className={`px-3 py-1 rounded ${
                  location.pathname === path ? 'bg-primary-600' : 'hover:bg-primary-600/80'
                }`}
              >
                {label}
              </Link>
            ))}
            <Link
              to="/auth"
              className="px-3 py-1 rounded hover:bg-primary-600/80"
            >
              Connexion
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 py-6">
        {children}
      </main>
      <footer className="bg-primary-500 text-white py-4 text-center text-sm">
        Finance PWA – Visualisation Financière & Recommandations ETF
      </footer>
    </div>
  )
}
