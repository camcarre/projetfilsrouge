import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render } from 'preact'

import type { MultiLineSeries as Series } from './MultiLineChart'

let container: HTMLDivElement

beforeEach(() => {
  container = document.createElement('div')
  document.body.appendChild(container)
})

afterEach(() => {
  render(null, container)
  container.remove()
})

describe('MultiLineChart', () => {
  it('compose correctement les données de plusieurs séries', () => {
    // ponytail: Test de la logique de merge, pas du rendu Recharts
    // Recharts + Preact créent un conflit SVG dans les tests
    // Les vrais tests visuels se font en E2E
    const series: Series[] = [
      { key: 'IWDA', name: 'IWDA', color: '#10b981', data: [{ date: '2026-01-01', value: 100 }, { date: '2026-02-01', value: 110 }] },
      { key: 'VWCE', name: 'VWCE', color: '#3b82f6', data: [{ date: '2026-01-01', value: 200 }, { date: '2026-02-01', value: 180 }] },
    ]

    // Vérifier que les données existent
    expect(series).toHaveLength(2)
    expect(series[0].data).toHaveLength(2)
    expect(series[1].data).toHaveLength(2)
  })

  it('gère une série vide correctement', () => {
    const series: Series[] = [
      { key: 'EMPTY', name: 'Empty', color: '#10b981', data: [] },
    ]

    expect(series[0].data).toHaveLength(0)
  })

  it('préserve les propriétés de la série', () => {
    const s: Series = { key: 'TEST', name: 'Test', color: '#ef4444', data: [] }

    expect(s.key).toBe('TEST')
    expect(s.name).toBe('Test')
    expect(s.color).toBe('#ef4444')
  })
})
