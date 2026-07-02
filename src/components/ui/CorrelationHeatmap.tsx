const CELL_CLASSES = {
  positiveStrong: 'bg-emerald-600 dark:bg-emerald-600/50 text-white',
  positiveMedium: 'bg-emerald-300 dark:bg-emerald-300/40 text-emerald-900 dark:text-emerald-100',
  neutral: 'bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300',
  negativeMedium: 'bg-red-300 dark:bg-red-300/40 text-red-900 dark:text-red-100',
  negativeStrong: 'bg-red-600 dark:bg-red-600/50 text-white',
}

function cellColorClass(coefficient: number): string {
  const magnitude = Math.abs(coefficient)
  if (magnitude < 0.4) return CELL_CLASSES.neutral
  if (coefficient >= 0) return magnitude >= 0.7 ? CELL_CLASSES.positiveStrong : CELL_CLASSES.positiveMedium
  return magnitude >= 0.7 ? CELL_CLASSES.negativeStrong : CELL_CLASSES.negativeMedium
}

export function CorrelationHeatmap({
  tickers,
  matrix,
  className = '',
}: {
  tickers: string[]
  matrix: number[][]
  className?: string
}) {
  if (tickers.length === 0 || matrix.length === 0) return null

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table
        className="border-collapse text-[11px]"
        role="img"
        aria-label="Matrice de corrélation entre les actifs du portefeuille"
      >
        <thead>
          <tr>
            <th className="p-1.5" />
            {tickers.map((ticker) => (
              <th key={ticker} className="p-1.5 font-medium text-neutral-600 dark:text-neutral-400 tabular-nums whitespace-nowrap">
                {ticker}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tickers.map((rowTicker, i) => (
            <tr key={rowTicker}>
              <th className="p-1.5 font-medium text-neutral-600 dark:text-neutral-400 whitespace-nowrap text-right">
                {rowTicker}
              </th>
              {matrix[i].map((coefficient, j) => (
                <td
                  key={tickers[j]}
                  className={`p-1.5 text-center tabular-nums rounded ${cellColorClass(coefficient)}`}
                >
                  {coefficient.toFixed(2)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
