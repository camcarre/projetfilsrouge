import type { ComponentChildren } from 'preact'
import { useLocation } from 'react-router-dom'

interface PageTransitionProps {
  children: ComponentChildren
}

export function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation()
  return (
    <div key={location.pathname} className="page-enter">
      {children}
    </div>
  )
}
