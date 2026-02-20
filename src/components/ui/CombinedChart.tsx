import { useState, useRef, useEffect, useLayoutEffect } from 'preact/hooks'
import gsap from 'gsap'

const CHART_W = 560
const CHART_H = 240
const CHART_PADDING = { top: 20, right: 20, bottom: 36, left: 44 }

/**
 * Graphique pro : évolution + prédiction (optionnelle), grille, crosshair animé (GSAP), tooltip flottant.
 * Style "Trade Republic" / "Clean Steel".
 */
export function CombinedChart({
  historical,
  prediction = [],
  onHover,
  className = '',
  currency = 'EUR',
  height = 240,
  minimal = false,
}: {
  historical: number[]
  prediction?: number[]
  onHover?: (value: number | null) => void
  className?: string
  currency?: string
  height?: number | string
  minimal?: boolean
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const crosshairRef = useRef<SVGGElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const isFirstPositionRef = useRef(true)
  const histLineRef = useRef<SVGPathElement>(null)
  const predLineRef = useRef<SVGPathElement>(null)
  const histAreaRef = useRef<SVGPathElement>(null)
  const predAreaRef = useRef<SVGPathElement>(null)
  const gridRef = useRef<SVGGElement>(null)
  const crosshairAnimatedInRef = useRef(false)
  
  const all = [...historical, ...prediction]
  if (all.length < 2) return null
  
  const min = Math.min(...all)
  const max = Math.max(...all)
  const range = max - min || 1
  
  // Padding réduit en mode minimal
  const { top: padT, right: padR, bottom: padB, left: padL } = minimal 
    ? { top: 5, right: 5, bottom: 5, left: 5 }
    : CHART_PADDING
    
  const chartW = CHART_W - padL - padR
  const chartH = CHART_H - padT - padB
  
  const nHistorical = historical.length
  const nPrediction = prediction.length
  const nTotal = nHistorical + nPrediction
  
  // Si pas de prédiction, l'historique prend toute la largeur
  const splitX = nPrediction > 0 
    ? padL + (nHistorical / Math.max(nTotal, 1)) * chartW
    : padL + chartW

  const toY = (v: number) => padT + chartH - ((v - min) / range) * chartH
  
  const histPoints = historical.map((v, i) => ({
    x: nHistorical <= 1 ? padL : padL + (i / (Math.max(nTotal - 1, 1))) * chartW,
    y: toY(v),
  }))
  
  // Correction pour aligner parfaitement la fin de l'historique et le début de la prédiction
  if (nPrediction > 0 && histPoints.length > 0) {
      // Recalculer les positions X si on a une prédiction pour que ça corresponde au splitX
      const historicalWidth = splitX - padL
      histPoints.forEach((p, i) => {
          p.x = padL + (i / (nHistorical - 1)) * historicalWidth
      })
  } else if (nPrediction === 0) {
      // Pleine largeur
      histPoints.forEach((p, i) => {
          p.x = padL + (i / (nHistorical - 1)) * chartW
      })
  }

  const predPoints = prediction.map((v, i) => ({
    x: splitX + (i / (nPrediction - 1)) * (padL + chartW - splitX),
    y: toY(v),
  }))
  
  // Si prédiction, on ajoute le dernier point historique comme premier point de prédiction pour la continuité visuelle
  // (Sauf si on veut un gap, mais pour une courbe continue c'est mieux)
  // Ici on assume que `prediction` est la suite directe.
  
  const allPoints = [...histPoints, ...predPoints]
  
  const histPoly = histPoints.map((p) => `${p.x},${p.y}`).join(' ')
  const joinPoint = histPoints[histPoints.length - 1]
  const bottomY = padT + chartH
  
  const histAreaPath = histPoints.length
    ? `M ${histPoints[0].x},${histPoints[0].y} L ${histPoly} L ${histPoints[histPoints.length - 1].x},${bottomY} L ${padL},${bottomY} Z`
    : ''
    
  const predAreaPath = (nPrediction > 0 && joinPoint)
    ? `M ${joinPoint.x},${joinPoint.y} L ${[joinPoint, ...predPoints].map((p) => `${p.x},${p.y}`).join(' L ')} L ${predPoints[predPoints.length - 1].x},${bottomY} L ${joinPoint.x},${bottomY} Z`
    : ''
    
  const histLinePath = `M ${histPoints.map((p) => `${p.x},${p.y}`).join(' L ')}`
  const predLinePath = (nPrediction > 0 && joinPoint)
    ? `M ${[joinPoint, ...predPoints].map((p) => `${p.x},${p.y}`).join(' L ')}`
    : ''

  // Grille horizontale (4 lignes) - masquée en minimal
  const gridLines = minimal ? [] : Array.from({ length: 5 }, (_, i) => padT + (chartH / 4) * i)

  const handleMouseMove = (e: MouseEvent) => {
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * CHART_W
    if (x < padL || x > padL + chartW) {
      setHoveredIndex(null)
      onHover?.(null)
      return
    }
    // Trouver le point le plus proche en X
    // Approximation linéaire
    const relativeX = x - padL
    let index = 0
    
    // Recherche simple du point le plus proche
    let minDist = Infinity
    allPoints.forEach((p, i) => {
        const dist = Math.abs(p.x - x)
        if (dist < minDist) {
            minDist = dist
            index = i
        }
    })
    
    setHoveredIndex(index)
    onHover?.(all[index])
  }
  
  const handleMouseLeave = () => {
    setHoveredIndex(null)
    onHover?.(null)
    isFirstPositionRef.current = true
    crosshairAnimatedInRef.current = false
  }

  const cursorPoint = hoveredIndex != null ? allPoints[hoveredIndex] : null
  const hoverValue = hoveredIndex != null ? all[hoveredIndex] : null

  // Entrée fluide : courbes qui se dessinent, zones en fondu, grille
  useEffect(() => {
    const ctx = gsap.context(() => {
      const histLine = histLineRef.current
      const predLine = predLineRef.current
      const histArea = histAreaRef.current
      const predArea = predAreaRef.current
      const grid = gridRef.current
      if (histLine) {
        const len = histLine.getTotalLength()
        gsap.set(histLine, { strokeDasharray: len, strokeDashoffset: len })
        gsap.to(histLine, { strokeDashoffset: 0, duration: 0.9, ease: 'power2.inOut' })
      }
      if (predLine && nPrediction > 0) {
        const len = predLine.getTotalLength()
        gsap.set(predLine, { strokeDasharray: len, strokeDashoffset: len })
        gsap.to(predLine, {
          strokeDashoffset: 0,
          duration: 0.9,
          delay: 0.15,
          ease: 'power2.inOut',
          onComplete: () => {
            predLine.setAttribute('stroke-dasharray', '6 4')
            predLine.setAttribute('stroke-dashoffset', '0')
          },
        })
      }
      if (histArea) gsap.fromTo(histArea, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: 'power2.out' })
      if (predArea && nPrediction > 0) gsap.fromTo(predArea, { opacity: 0 }, { opacity: 1, duration: 0.6, delay: 0.2, ease: 'power2.out' })
      if (grid) gsap.fromTo(grid, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power2.out' })
    })
    return () => ctx.revert()
  }, [historical.length, prediction.length])

  // Crosshair : position initiale puis animation GSAP
  useLayoutEffect(() => {
    if (!cursorPoint || !crosshairRef.current) return
    if (!isFirstPositionRef.current) return
    gsap.set(crosshairRef.current, { x: cursorPoint.x, y: cursorPoint.y })
    isFirstPositionRef.current = false
  }, [cursorPoint?.x, cursorPoint?.y])
  
  useEffect(() => {
    if (!cursorPoint || !crosshairRef.current) return
    if (isFirstPositionRef.current) return
    gsap.to(crosshairRef.current, {
      x: cursorPoint.x,
      y: cursorPoint.y,
      duration: 0.22,
      ease: 'power3.out',
      overwrite: 'auto',
    })
  }, [cursorPoint?.x, cursorPoint?.y])

  // Apparition en fondu du crosshair (pro)
  useEffect(() => {
    const g = crosshairRef.current
    if (!cursorPoint || !g || crosshairAnimatedInRef.current) return
    crosshairAnimatedInRef.current = true
    gsap.fromTo(g, { opacity: 0 }, { opacity: 1, duration: 0.16, ease: 'power2.out' })
  }, [cursorPoint?.x, cursorPoint?.y])

  // Tooltip : apparition / disparition + suivi fluide
  const TOOLTIP_OFFSET = 56
  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))
  const wasVisibleRef = useRef(false)
  
  useEffect(() => {
    const el = tooltipRef.current
    if (!el) return
    const visible = cursorPoint != null && hoverValue != null
    if (!visible) {
      wasVisibleRef.current = false
      gsap.to(el, { opacity: 0, scale: 0.98, duration: 0.1, ease: 'power2.in', onComplete: () => { el.style.visibility = 'hidden' } })
      return
    }
    const left = clamp(cursorPoint!.x, padL + TOOLTIP_OFFSET, padL + chartW - TOOLTIP_OFFSET)
    const top = Math.max(padT + 16, cursorPoint!.y)
    el.style.visibility = 'visible'
    el.style.left = `${left}px`
    el.style.top = `${top}px`
    if (!wasVisibleRef.current) {
      wasVisibleRef.current = true
      gsap.fromTo(el, { opacity: 0, scale: 0.98 }, { opacity: 1, scale: 1, duration: 0.2, ease: 'power2.out' })
    } else {
      gsap.to(el, { left, top, duration: 0.2, ease: 'power2.out', overwrite: 'auto' })
    }
  }, [cursorPoint?.x, cursorPoint?.y, hoverValue])

  // Date factice pour le tooltip (style fiche)
  const tooltipDate = hoveredIndex != null ? (() => {
    const d = new Date()
    d.setDate(d.getDate() - (nTotal - 1 - hoveredIndex))
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  })() : ''

  return (
    <div
      className={`chart-wrapper relative select-none ${className}`}
      style={{ width: '100%', maxWidth: minimal ? 'none' : CHART_W, height: height, cursor: 'crosshair' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      role="img"
      aria-label="Graphique cours"
    >
      <svg width="100%" height="100%" viewBox={`0 0 ${CHART_W} ${CHART_H}`} className="block rounded-lg overflow-hidden" preserveAspectRatio="none">
        <defs>
          <linearGradient id="chartHistGrad" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#64748b" stopOpacity="0" />
            <stop offset="100%" stopColor="#64748b" stopOpacity="0.14" />
          </linearGradient>
          <linearGradient id="chartPredGrad" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.22" />
          </linearGradient>
        </defs>
        
        {/* Zones */}
        {histAreaPath && <path ref={histAreaRef} d={histAreaPath} fill="url(#chartHistGrad)" />}
        {predAreaPath && <path ref={predAreaRef} d={predAreaPath} fill="url(#chartPredGrad)" />}
        
        {/* Grille */}
        <g ref={gridRef}>
          {gridLines.map((y) => (
            <line key={y} x1={padL} y1={y} x2={padL + chartW} y2={y} stroke="currentColor" strokeWidth="0.5" className="text-neutral-200 dark:text-neutral-700" />
          ))}
          {nPrediction > 0 && (
            <line x1={splitX} y1={padT} x2={splitX} y2={padT + chartH} stroke="currentColor" strokeWidth="1" strokeDasharray="5 4" className="text-neutral-300 dark:text-neutral-600" />
          )}
        </g>
        
        {/* Courbes */}
        <path ref={histLineRef} d={histLinePath} fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-600 dark:text-slate-400" />
        {nPrediction > 0 && (
          <path ref={predLineRef} d={predLinePath} fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="6 4" className="text-emerald-500 dark:text-emerald-400" />
        )}
        
        {/* Crosshair */}
        {cursorPoint && (
          <g ref={crosshairRef} className="chart-crosshair">
            <line x1={0} y1={-(cursorPoint.y - padT)} x2={0} y2={padT + chartH - cursorPoint.y} stroke="currentColor" strokeWidth="0.5" className="text-neutral-300 dark:text-neutral-600" />
            <circle cx={0} cy={0} r={4.5} fill="white" stroke="currentColor" strokeWidth="1.5" className="stroke-neutral-400 dark:stroke-neutral-500 dark:fill-neutral-800" />
          </g>
        )}
        
        {/* Axe Y Labels - masqués en minimal */}
        {!minimal && gridLines.map((y, i) => {
          const val = i === 4 ? min : max - (i / 4) * range
          return (
            <text key={y} x={padL - 6} y={y + 4} textAnchor="end" className="fill-neutral-400 dark:fill-neutral-500 text-[10px] tabular-nums">
              {val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val.toFixed(0)}
            </text>
          )
        })}
        
        {/* Légendes - masquées en minimal */}
        {!minimal && (
          nPrediction > 0 ? (
            <>
              <text x={padL + (splitX - padL) / 2 - 28} y={CHART_H - 8} className="fill-neutral-400 dark:fill-neutral-500 text-[11px] font-medium">Historique</text>
              <text x={splitX + 10} y={CHART_H - 8} className="fill-emerald-500 dark:fill-emerald-500 text-[11px] font-medium">Prédiction</text>
            </>
          ) : (
            <text x={padL + chartW / 2 - 20} y={CHART_H - 8} className="fill-neutral-400 dark:fill-neutral-500 text-[11px] font-medium">Historique</text>
          )
        )}
      </svg>
      
      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="chart-tooltip pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-xl border border-neutral-200/90 dark:border-neutral-600 bg-white/95 dark:bg-neutral-800/95 backdrop-blur-sm shadow-xl px-3.5 py-2.5 min-w-[128px] ring-1 ring-neutral-900/5 dark:ring-white/5"
        style={{ marginTop: -8, visibility: 'hidden', willChange: 'transform' }}
        aria-hidden
      >
        <p className="text-[11px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">{tooltipDate}</p>
        <p className="text-[15px] font-semibold tabular-nums text-neutral-800 dark:text-neutral-100 leading-tight">
          {hoverValue != null ? hoverValue.toFixed(2) : '–'} <span className="text-xs font-normal text-neutral-500 dark:text-neutral-400">{currency}</span>
        </p>
        <span className="chart-tooltip-arrow" aria-hidden />
      </div>
    </div>
  )
}
