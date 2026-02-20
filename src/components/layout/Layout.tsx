import type { ComponentChildren } from 'preact'
import { createPortal } from 'preact/compat'
import { useState, useEffect } from 'preact/hooks'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { useTheme } from '@/contexts/ThemeContext'
import { logout } from '@/store/slices/authSlice'
import { signOut } from '@/services/authService'
import type { RootState } from '@/store'

const NAV_ITEMS = [
  { path: '/', label: 'Tableau de bord', shortLabel: 'Accueil', icon: 'home' },
  { path: '/portfolio', label: 'Portefeuille', shortLabel: 'Portefeuille', icon: 'wallet' },
  { path: '/analysis', label: 'Analyse', shortLabel: 'Analyse', icon: 'chart' },
  { path: '/etf', label: 'ETF', shortLabel: 'ETF', icon: 'pie' },
  { path: '/education', label: 'Éducation', shortLabel: 'Éducation', icon: 'book' },
] as const

function NavIcon({ name }: { name: string }) {
  const className = 'w-5 h-5 flex-shrink-0'
  switch (name) {
    case 'home':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    case 'wallet':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    case 'chart':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    case 'pie':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
        </svg>
      )
    case 'book':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    default:
      return null
  }
}

interface LayoutProps {
  children: ComponentChildren
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const user = useSelector((s: RootState) => s.auth.user)
  const { theme, toggleTheme } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)
  const [drawerEntered, setDrawerEntered] = useState(false)

  useEffect(() => {
    if (!menuOpen) {
      setDrawerEntered(false)
      return
    }
    // Petit délai pour que le navigateur peigne d'abord translate-x-full, puis on anime vers 0
    const t = setTimeout(() => setDrawerEntered(true), 20)
    return () => clearTimeout(t)
  }, [menuOpen])

  useEffect(() => {
    if (!menuOpen) return
    const onEscape = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false)
    document.addEventListener('keydown', onEscape)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onEscape)
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  const handleLogout = () => {
    signOut()
    dispatch(logout())
    navigate('/', { replace: true })
  }

  const isActive = (path: string) =>
    path === '/education' ? location.pathname.startsWith('/education') : location.pathname === path

  const closeMenu = () => setMenuOpen(false)

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950 transition-colors">
      <a href="#main-content" className="skip-link">
        Aller au contenu principal
      </a>
      <header className="bg-white/95 dark:bg-neutral-950/95 backdrop-blur-sm border-b border-neutral-200/70 dark:border-neutral-800/50 transition-colors duration-200 safe-area-padding-top">
        <div className="max-w-4xl mx-auto px-4 sm:px-5 py-3 flex items-center justify-between gap-2">
          <Link
            to="/"
            className="text-[15px] font-semibold text-neutral-800 dark:text-neutral-100 tracking-tight rounded-lg py-2 px-2 -ml-2 min-h-[44px] flex items-center transition-all duration-200 hover:opacity-80 hover:bg-neutral-100/80 dark:hover:bg-neutral-800/40 active:scale-[0.99]"
          >
            Finance PWA
          </Link>

          {/* Desktop nav: liens + user + actions */}
          <nav className="hidden lg:flex items-center gap-0.5" aria-label="Navigation principale">
            {NAV_ITEMS.map(({ path, label }) => (
              <Link
                key={path}
                to={path}
                className={`px-3 py-2 rounded-lg text-[13px] font-medium tracking-tight transition-all duration-200 ease-out min-h-[44px] flex items-center ${
                  isActive(path)
                    ? 'bg-neutral-200/80 text-neutral-800 dark:bg-neutral-700/80 dark:text-neutral-100'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800/50 active:scale-[0.98]'
                }`}
              >
                {label}
              </Link>
            ))}
            {user ? (
              <>
                <span className="px-3 py-2 text-[13px] text-neutral-500 dark:text-neutral-400 truncate max-w-[140px] rounded-lg min-h-[44px] flex items-center" title={user.email}>
                  {user.email}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-3 py-2 rounded-lg text-[13px] font-medium tracking-tight text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800/50 transition-all duration-200 ease-out active:scale-[0.98] min-h-[44px] flex items-center"
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                className="px-3 py-2 rounded-lg text-[13px] font-medium tracking-tight text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800/50 transition-all duration-200 ease-out active:scale-[0.98] min-h-[44px] flex items-center"
              >
                Connexion
              </Link>
            )}
            <Link
              to="/settings"
              className="p-2 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/50 transition-all duration-200 ease-out min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Paramètres"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </Link>
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/50 transition-all duration-200 ease-out hover:scale-105 active:scale-95 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label={theme === 'light' ? 'Mode sombre' : 'Mode clair'}
            >
              {theme === 'light' ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
            </button>
          </nav>

          {/* Mobile: menu burger */}
          <div className="flex lg:hidden items-center">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="p-2.5 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/50 active:scale-[0.98] min-h-[44px] min-w-[44px] flex items-center justify-center transition-all duration-200 ease-out"
              aria-label="Ouvrir le menu"
              aria-expanded={menuOpen}
              aria-haspopup="dialog"
              aria-controls="drawer-menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Drawer menu mobile — rendu en portail pour passer au-dessus de la bottom nav */}
          {menuOpen &&
            createPortal(
              <>
                <div
                  className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-[2px] lg:hidden cursor-pointer transition-opacity duration-200"
                  aria-hidden
                  onClick={closeMenu}
                />
                <aside
                  id="drawer-menu"
                  role="dialog"
                  className={`fixed top-0 right-0 bottom-0 z-[101] w-full max-w-[280px] bg-white dark:bg-neutral-900 shadow-2xl border-l border-neutral-200/50 dark:border-neutral-800/50 lg:hidden flex flex-col safe-area-padding-top transition-transform duration-300 ease-out ${drawerEntered ? 'translate-x-0' : 'translate-x-full'}`}
                  aria-modal="true"
                  aria-label="Menu de navigation"
                  onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
                  <span className="text-[15px] font-semibold text-neutral-800 dark:text-neutral-100">Menu</span>
                  <button
                    type="button"
                    onClick={closeMenu}
                    className="p-2 rounded-lg text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 active:scale-95 min-h-[44px] min-w-[44px] flex items-center justify-center transition-all duration-200 ease-out"
                    aria-label="Fermer le menu"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <nav className="flex-1 overflow-y-auto py-4" aria-label="Navigation menu">
                  <div className="px-4 space-y-1.5">
                    {NAV_ITEMS.map(({ path, label, icon }) => (
                      <Link
                        key={path}
                        to={path}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-medium min-h-[48px] transition-all duration-200 ease-out border border-transparent hover:scale-[1.02] active:scale-[0.98] ${
                          isActive(path)
                            ? 'bg-emerald-50 dark:bg-emerald-900/25 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-700/40 shadow-sm'
                            : 'text-neutral-700 dark:text-neutral-200 bg-neutral-50/50 dark:bg-neutral-800/30 hover:bg-neutral-100 dark:hover:bg-neutral-700/50 hover:shadow-md hover:border-neutral-200/80 dark:hover:border-neutral-600/50'
                        }`}
                      >
                        <NavIcon name={icon} />
                        {label}
                      </Link>
                    ))}
                  </div>
                  <div className="my-4 border-t border-neutral-200 dark:border-neutral-800" />
                  <div className="px-4 space-y-1">
                    {user ? (
                      <p className="px-4 py-2 text-[12px] text-neutral-500 dark:text-neutral-400 truncate" title={user.email}>
                        {user.email}
                      </p>
                    ) : null}
                    {user ? (
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-[14px] font-medium text-red-600 dark:text-red-400 bg-red-50/30 dark:bg-red-900/10 hover:bg-red-50 dark:hover:bg-red-900/25 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] min-h-[48px] transition-all duration-200 ease-out border border-transparent hover:border-red-200/60 dark:hover:border-red-800/50 text-left"
                      >
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Déconnexion
                      </button>
                    ) : (
                      <Link
                        to="/auth"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-medium text-neutral-700 dark:text-neutral-200 bg-neutral-50/50 dark:bg-neutral-800/30 hover:bg-neutral-100 dark:hover:bg-neutral-700/50 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] min-h-[48px] transition-all duration-200 ease-out border border-transparent hover:border-neutral-200/80 dark:hover:border-neutral-600/50"
                      >
                        Connexion
                      </Link>
                    )}
                    <Link
                      to="/settings"
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-medium text-neutral-700 dark:text-neutral-200 bg-neutral-50/50 dark:bg-neutral-800/30 hover:bg-neutral-100 dark:hover:bg-neutral-700/50 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] min-h-[48px] transition-all duration-200 ease-out border border-transparent hover:border-neutral-200/80 dark:hover:border-neutral-600/50"
                    >
                      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Paramètres
                    </Link>
                    <button
                      type="button"
                      onClick={toggleTheme}
                      className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-[14px] font-medium text-neutral-700 dark:text-neutral-200 bg-neutral-50/50 dark:bg-neutral-800/30 hover:bg-neutral-100 dark:hover:bg-neutral-700/50 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] min-h-[48px] transition-all duration-200 ease-out border border-transparent hover:border-neutral-200/80 dark:hover:border-neutral-600/50 text-left"
                    >
                      {theme === 'light' ? (
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      )}
                      {theme === 'light' ? 'Mode sombre' : 'Mode clair'}
                    </button>
                  </div>
                </nav>
              </aside>
              </>,
              document.body
            )}
        </div>
      </header>

      <main id="main-content" className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-5 py-6 sm:py-8 pb-24 lg:pb-8" tabIndex={-1}>
        {children}
      </main>

      {/* Bottom navigation — mobile only */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-sm border-t border-neutral-200/70 dark:border-neutral-800/50 safe-area-inset-bottom"
        aria-label="Navigation mobile"
      >
        <div className="max-w-4xl mx-auto flex items-stretch justify-around safe-area-inset-bottom">
          {NAV_ITEMS.map(({ path, shortLabel, icon }) => {
            const active = isActive(path)
            return (
              <Link
                key={path}
                to={path}
                className={`flex flex-col items-center justify-center flex-1 min-h-[56px] pt-2 gap-0.5 transition-colors duration-200 ${
                  active
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-neutral-500 dark:text-neutral-400 active:bg-neutral-100 dark:active:bg-neutral-800/50'
                }`}
              >
                <NavIcon name={icon} />
                <span className="text-[10px] font-medium tracking-tight">{shortLabel}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      <footer className="border-t border-neutral-200/70 dark:border-neutral-800/50 py-4 text-center text-[12px] text-neutral-500 dark:text-neutral-400 bg-white/80 dark:bg-transparent transition-colors duration-200 pb-20 lg:pb-4">
        <div className="max-w-4xl mx-auto tracking-tight px-4">
          Finance PWA – Visualisation Financière & Recommandations ETF
        </div>
      </footer>
    </div>
  )
}
