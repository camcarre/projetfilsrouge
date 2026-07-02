import type { MonteCarloStep } from '@/types/montecarlo'

const W = 560
const H = 240
const PAD = { top: 16, right: 16, bottom: 28, left: 52 }

/**
 * Cône de percentiles Monte Carlo : bande p5–p95 (claire), bande p25–p75 (foncée),
 * ligne médiane p50, ligne de base (valeur initiale). SVG pur, style neutral/emerald.
 */
export function MonteCarloChart({
  steps,
  initialValue,
  currency = 'EUR',
  height = H,
}: {
  steps: MonteCarloStep[]
  initialValue: number
  currency?: string
  height?: number
}) {
  if (steps.length === 0) return null

  const innerW = W - PAD.left - PAD.right
  const innerH = height - PAD.top - PAD.bottom

  const allVals = steps.flatMap((s) => [s.p5, s.p95])
  allVals.push(initialValue)
  const min = Math.min(...allVals)
  const max = Math.max(...allVals)
  const range = max - min || 1

  const n = steps.length
  const x = (i: number) => PAD.left + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW)
  const y = (v: number) => PAD.top + innerH - ((v - min) / range) * innerH

  // Bande = aire fermée entre une courbe haute (aller) et une basse (retour)
  const band = (hi: (s: MonteCarloStep) => number, lo: (s: MonteCarloStep) => number) => {
    const up = steps.map((s, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(hi(s))}`).join(' ')
    const down = steps
      .map((_, i) => `L${x(n - 1 - i)},${y(lo(steps[n - 1 - i]))}`)
      .join(' ')
    return `${up} ${down} Z`
  }

  const line = (get: (s: MonteCarloStep) => number) =>
    steps.map((s, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(get(s))}`).join(' ')

  const fmt = (v: number) =>
    v.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + (currency === 'EUR' ? ' €' : '')

  const baselineY = y(initialValue)
  const gridVals = [max, (max + min) / 2, min]

  return (
    <svg
      viewBox={`0 0 ${W} ${height}`}
      class="w-full h-auto"
      role="img"
      aria-label="Cône de projection Monte Carlo du portefeuille"
    >
      {/* Grille + labels Y */}
      {gridVals.map((v) => (
        <g>
          <line
            x1={PAD.left}
            y1={y(v)}
            x2={W - PAD.right}
            y2={y(v)}
            class="stroke-neutral-200 dark:stroke-neutral-800"
            stroke-width="1"
          />
          <text
            x={PAD.left - 8}
            y={y(v) + 3}
            text-anchor="end"
            class="fill-neutral-400 dark:fill-neutral-500 tabular-nums"
            font-size="10"
          >
            {fmt(v)}
          </text>
        </g>
      ))}

      {/* Bandes de percentiles */}
      <path d={band((s) => s.p95, (s) => s.p5)} class="fill-emerald-500/10" />
      <path d={band((s) => s.p75, (s) => s.p25)} class="fill-emerald-500/20" />

      {/* Ligne de base (valeur initiale) */}
      <line
        x1={PAD.left}
        y1={baselineY}
        x2={W - PAD.right}
        y2={baselineY}
        class="stroke-neutral-400 dark:stroke-neutral-500"
        stroke-width="1"
        stroke-dasharray="4 3"
      />

      {/* Médiane */}
      <path d={line((s) => s.p50)} fill="none" class="stroke-emerald-600" stroke-width="2" />

      {/* Labels X (début / fin) */}
      <text
        x={PAD.left}
        y={height - 8}
        text-anchor="start"
        class="fill-neutral-400 dark:fill-neutral-500"
        font-size="10"
      >
        J+0
      </text>
      <text
        x={W - PAD.right}
        y={height - 8}
        text-anchor="end"
        class="fill-neutral-400 dark:fill-neutral-500"
        font-size="10"
      >
        J+{steps[n - 1].day}
      </text>
    </svg>
  )
}
