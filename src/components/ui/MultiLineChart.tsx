import { useMemo, useState } from 'preact/hooks'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export type MultiLineSeries = {
  key: string
  name: string
  color: string
  data: { date: string; value: number }[]
}

type Props = {
  series: MultiLineSeries[]
  height?: number
  yLabel?: string
}

/** Graphique multi-courbes : tooltip natif Recharts + légende interactive (toggle). */
export function MultiLineChart({ series, height = 280, yLabel }: Props) {
  const [hidden, setHidden] = useState<Set<string>>(new Set())

  const merged = useMemo(() => {
    const dateMap = new Map<string, Record<string, number | string>>()
    for (const s of series) {
      for (const pt of s.data) {
        const row = dateMap.get(pt.date) ?? { date: pt.date }
        row[s.key] = pt.value
        dateMap.set(pt.date, row)
      }
    }
    return Array.from(dateMap.values()).sort((a, b) =>
      String(a.date).localeCompare(String(b.date))
    )
  }, [series])

  const toggle = (key: string) => {
    setHidden((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  if (series.length === 0) {
    return (
      <div className="flex items-center justify-center text-neutral-500 dark:text-neutral-400 text-sm" style={{ height }}>
        Aucune série à afficher.
      </div>
    )
  }

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <LineChart data={merged} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
          <CartesianGrid stroke="currentColor" strokeOpacity={0.1} />
          <XAxis dataKey="date" stroke="currentColor" tick={{ fontSize: 11 }} />
          <YAxis
            stroke="currentColor"
            tick={{ fontSize: 11 }}
            label={yLabel ? { value: yLabel, angle: -90, position: 'insideLeft', fontSize: 11 } : undefined}
          />
          <Tooltip
            contentStyle={{
              background: 'rgba(255,255,255,0.95)',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              fontSize: 12,
            }}
            wrapperClassName="text-neutral-800"
          />
          <Legend
            onClick={(e: any) => toggle(e.dataKey as string)}
            wrapperStyle={{ fontSize: 12, cursor: 'pointer' }}
          />
          {series.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color}
              strokeWidth={2}
              dot={false}
              hide={hidden.has(s.key)}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}