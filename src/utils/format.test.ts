import { describe, expect, it } from 'vitest'

import { formatCurrency, formatDate, formatPercent } from './format'

describe('format utils', () => {
  it('formats currency', () => {
    expect(formatCurrency(1234.5, 'EUR')).toContain('1')
    expect(formatCurrency(1234.5, 'EUR')).toContain('€')
  })

  it('formats percent', () => {
    expect(formatPercent(12.34)).toContain('%')
  })

  it('formats date', () => {
    expect(formatDate('2026-06-02')).toBe('02/06/2026')
  })
})

