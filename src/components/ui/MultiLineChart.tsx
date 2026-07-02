const CHART_W = 560
const CHART_H = 240
const CHART_PADDING = { top: 20, right: 20, bottom: 20, left: 44 }

const STROKE_DASHARRAYS = ['0', '6 4', '2 3']

export interface Series {
  label: string
  data: { date: string; value: number }[]
  failed?: boolean
}

function normalizeToBase100(data: { date: string; value: number }[]) {
  if (data.length === 0) return []
  const base = data[0].value
  if (!base) return []
  return data.map((point) => ({ date: point.date, value: (point.value / base) * 100 }))
}

export function MultiLineChart({
  series,
  className = '',
  height = 240,
}: {
  series: Series[]
  className?: string
  height?: number | string
}) {
  const normalizedSeries = series.map((s) => ({
    ...s,
    normalized: normalizeToBase100(s.data),
  }))

  const rawValidSeries = normalizedSeries.filter((s) => !s.failed && s.normalized.length >= 2)
  const failedSeries = normalizedSeries.filter((s) => s.failed || s.normalized.length < 2)

  if (rawValidSeries.length === 0) return null

  const validSeries = rawValidSeries.map((s, seriesIndex) => {
    const totalPerf = ((s.normalized[s.normalized.length - 1].value - 100) / 100) * 100
    return {
      ...s,
      totalPerf,
      colorClass: totalPerf < 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400',
      dasharray: STROKE_DASHARRAYS[seriesIndex % STROKE_DASHARRAYS.length],
    }
  })

  const allValues = validSeries.flatMap((s) => s.normalized.map((p) => p.value))
  const min = Math.min(...allValues)
  const max = Math.max(...allValues)
  const range = max - min || 1

  const { top: padT, right: padR, bottom: padB, left: padL } = CHART_PADDING
  const chartW = CHART_W - padL - padR
  const chartH = CHART_H - padT - padB

  const toY = (v: number) => padT + chartH - ((v - min) / range) * chartH
  const toX = (i: number, n: number) => (n <= 1 ? padL : padL + (i / (n - 1)) * chartW)

  const gridLines = Array.from({ length: 5 }, (_, i) => padT + (chartH / 4) * i)

  return (
    <div className={`multi-line-chart ${className}`} style={{ width: '100%', maxWidth: CHART_W, height }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${CHART_W} ${CHART_H}`} className="block" preserveAspectRatio="none" role="img" aria-label="Comparaison de performance ETF">
        <g>
          {gridLines.map((y) => (
            <line key={y} x1={padL} y1={y} x2={padL + chartW} y2={y} stroke="currentColor" strokeWidth="0.5" className="text-neutral-200 dark:text-neutral-700" />
          ))}
        </g>

        {gridLines.map((y, i) => {
          const val = i === 4 ? min : max - (i / 4) * range
          return (
            <text key={y} x={padL - 6} y={y + 4} textAnchor="end" className="fill-neutral-400 dark:fill-neutral-500 text-[10px] tabular-nums">
              {val.toFixed(0)}
            </text>
          )
        })}

        {validSeries.map((s) => {
          const n = s.normalized.length
          const points = s.normalized.map((p, i) => ({ x: toX(i, n), y: toY(p.value) }))
          const linePath = `M ${points.map((p) => `${p.x},${p.y}`).join(' L ')}`
          return (
            <path
              key={s.label}
              d={linePath}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray={s.dasharray}
              className={s.colorClass}
            />
          )
        })}
      </svg>

      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
        {validSeries.map((s) => (
          <li key={s.label} className="flex items-center gap-2 text-[12px]">
            <svg width="16" height="8" aria-hidden>
              <line x1="0" y1="4" x2="16" y2="4" stroke="currentColor" strokeWidth="2" strokeDasharray={s.dasharray} className={s.colorClass} />
            </svg>
            <span className="text-neutral-700 dark:text-neutral-300">{s.label}</span>
            <span className={`tabular-nums font-medium ${s.colorClass}`}>{s.totalPerf >= 0 ? '+' : ''}{s.totalPerf.toFixed(1)} %</span>
          </li>
        ))}
        {failedSeries.map((s) => (
          <li key={s.label} className="flex items-center gap-2 text-[12px]">
            <span className="text-neutral-700 dark:text-neutral-300">{s.label}</span>
            <span className="text-red-600 dark:text-red-400">Données indisponibles</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
