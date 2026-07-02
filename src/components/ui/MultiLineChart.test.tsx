import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { h, render } from 'preact'

import { MultiLineChart, type Series } from './MultiLineChart'

let container: HTMLDivElement

beforeEach(() => {
  container = document.createElement('div')
  document.body.appendChild(container)
})

afterEach(() => {
  render(null, container)
  container.remove()
})

function renderChart(series: Series[]) {
  render(h(MultiLineChart, { series }), container)
}

describe('MultiLineChart', () => {
  it('affiche une entrée de légende par série réussie avec sa performance normalisée à base 100', () => {
    renderChart([
      { label: 'IWDA', data: [{ date: '2026-01-01', value: 100 }, { date: '2026-02-01', value: 110 }] },
      { label: 'VWCE', data: [{ date: '2026-01-01', value: 200 }, { date: '2026-02-01', value: 180 }] },
    ])

    const legendItems = container.querySelectorAll('ul.mt-3 li')
    expect(legendItems).toHaveLength(2)
    expect(container.textContent).toContain('IWDA')
    expect(container.textContent).toContain('+10.0 %')
    expect(container.textContent).toContain('VWCE')
    expect(container.textContent).toContain('-10.0 %')
  })

  it('marque une série en échec comme "Données indisponibles" sans bloquer les autres séries', () => {
    renderChart([
      { label: 'IWDA', data: [{ date: '2026-01-01', value: 100 }, { date: '2026-02-01', value: 110 }] },
      { label: 'VWCE', data: [], failed: true },
    ])

    expect(container.textContent).toContain('IWDA')
    expect(container.textContent).toContain('+10.0 %')
    expect(container.textContent).toContain('VWCE')
    expect(container.textContent).toContain('Données indisponibles')
    expect(container.querySelector('svg')).not.toBeNull()
  })

  it("ne rend rien quand aucune série n'a de données exploitables", () => {
    renderChart([
      { label: 'IWDA', data: [], failed: true },
      { label: 'VWCE', data: [{ date: '2026-01-01', value: 100 }] },
    ])

    expect(container.innerHTML).toBe('')
  })
})
