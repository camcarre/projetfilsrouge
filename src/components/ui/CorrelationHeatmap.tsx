type Props = {
  /** Étiquettes de colonnes (et de lignes, mêmes noms). */
  labels: string[]
  /** Matrice carrée de coefficients (symétrique). */
  matrix: number[][]
  caption?: string
}

function colorFor(v: number): string {
  // -1 (rouge) → 0 (neutre) → +1 (émeraude)
  const clamped = Math.max(-1, Math.min(1, v))
  if (clamped >= 0) {
    // emerald-500 #10b981
    const a = 0.15 + clamped * 0.55
    return `rgba(16, 185, 129, ${a.toFixed(2)})`
  }
  // red-500 #ef4444
  const a = 0.15 + Math.abs(clamped) * 0.55
  return `rgba(239, 68, 68, ${a.toFixed(2)})`
}

export function CorrelationHeatmap({ labels, matrix, caption = 'Matrice de corrélation des actifs' }: Props) {
  return (
    <figure className="w-full">
      <figcaption className="text-sm font-medium text-neutral-800 dark:text-neutral-100 mb-2">
        {caption}
      </figcaption>
      <table className="text-xs border-collapse w-full" role="table">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            <th scope="col" className="p-2 text-neutral-600 dark:text-neutral-400 text-left" />
            {labels.map((l) => (
              <th key={l} scope="col" className="p-2 text-neutral-600 dark:text-neutral-400 font-medium">
                {l}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {labels.map((row, i) => (
            <tr key={row}>
              <th scope="row" className="p-2 text-neutral-600 dark:text-neutral-400 font-medium text-left">
                {row}
              </th>
              {labels.map((col, j) => {
                const v = matrix[i]?.[j] ?? 0
                return (
                  <td
                    key={col}
                    aria-label={`Corrélation ${row} / ${col} : ${v.toFixed(2)}`}
                    title={`${row} ↔ ${col} : ${v.toFixed(2)}`}
                    className="p-2 text-center tabular-nums text-neutral-800 dark:text-neutral-100 border border-white/40 dark:border-neutral-900/40"
                    style={{ backgroundColor: colorFor(v) }}
                  >
                    {v.toFixed(2)}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-[11px] text-neutral-500 dark:text-neutral-400">
        Rouge = corrélation négative, Neutre = 0, Émeraude = corrélation positive.
      </p>
    </figure>
  )
}