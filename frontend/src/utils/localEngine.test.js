// Parity tests: the in-browser engine must produce exactly what the Python backend produces.
// Fixtures come from backend/scripts/export_engine_fixtures.py.
import { describe, expect, it } from 'vitest'
import fixtures from './__fixtures__/engine_cases.json'
import {
  analyzeProfile, calculateRiskScores, buildActionPlan, getInsuranceRecommendations,
  simulateProfile, fallbackChat, getFloodRisk, insuranceReadiness, pyRound,
} from './localEngine.js'

// Python floats like 2.0 serialize as 2 in JSON; compare numbers with a tiny tolerance.
function expectDeepClose(actual, expected, path = '') {
  if (typeof expected === 'number') {
    expect(typeof actual, path).toBe('number')
    expect(Math.abs(actual - expected), `${path}: ${actual} vs ${expected}`).toBeLessThan(1e-6)
  } else if (Array.isArray(expected)) {
    expect(Array.isArray(actual), path).toBe(true)
    expect(actual.length, path).toBe(expected.length)
    expected.forEach((v, i) => expectDeepClose(actual[i], v, `${path}[${i}]`))
  } else if (expected && typeof expected === 'object') {
    expect(Object.keys(actual).sort(), path).toEqual(Object.keys(expected).sort())
    for (const k of Object.keys(expected)) expectDeepClose(actual[k], expected[k], `${path}.${k}`)
  } else {
    expect(actual, path).toEqual(expected)
  }
}

describe('pyRound matches Python round()', () => {
  it.each([[0.5, 0], [1.5, 2], [2.5, 2], [3.5, 4], [-0.5, 0], [-1.5, -2], [2.675, 3], [7.4, 7], [7.6, 8]])('round(%f) = %f', (x, r) => {
    expect(pyRound(x)).toBe(r)
  })
  it('rounds to 2 decimals', () => {
    expect(pyRound(1.234, 2)).toBeCloseTo(1.23)
    expect(pyRound(9.999, 2)).toBeCloseTo(10)
  })
})

describe('analyze parity with Python', () => {
  it.each(fixtures.analyze.map((c, i) => [i, c]))('case %i', (_i, { input, output }) => {
    const scores = calculateRiskScores(input)
    expectDeepClose(scores, output.scores, 'scores')
    expectDeepClose(buildActionPlan(input, scores), output.action_plan, 'action_plan')
    expectDeepClose(getInsuranceRecommendations(input), output.insurance_recommendations, 'insurance')
  })
})

describe('simulate parity with Python', () => {
  it.each(fixtures.simulate.map((c, i) => [i, c]))('case %i', (_i, { input, output }) => {
    const { source, ...result } = simulateProfile(input)
    expect(source).toBe('local')
    expectDeepClose(result, output)
  })
})

describe('offline coach + flood lookup parity', () => {
  it.each(fixtures.chat.map((c) => [c.input, c.output]))('%s', (msg, expected) => {
    expect(fallbackChat(msg)).toBe(expected)
  })
  it('flood risk by ZIP', () => {
    for (const [zip, risk] of Object.entries(fixtures.flood)) expect(getFloodRisk(zip)).toBe(risk)
  })
})

describe('behaviour', () => {
  const base = { age: 32, annual_income: 72000, monthly_expenses: 3200, dependents: 0, housing_type: 'rent', zip_code: '85281', employment: 'employed', has_savings: true, savings_months: 2 }

  it('is deterministic (insurance score used to be random)', () => {
    expect(analyzeProfile(base)).toEqual(analyzeProfile(base))
  })
  it('insurance readiness stays within 20..90', () => {
    // 75 - (8 + 4*3 dependents) - 10 rent - 12 no employer benefits = 33
    expect(insuranceReadiness({ ...base, dependents: 9, employment: 'unemployed' })).toBe(33)
    expect(insuranceReadiness({ ...base, housing_type: 'other', annual_income: 150000, savings_months: 6 })).toBe(90)
    for (const dependents of [0, 1, 5]) for (const housing_type of ['rent', 'own', 'other']) for (const employment of ['employed', 'self_employed', 'unemployed', 'retired']) {
      const s = insuranceReadiness({ ...base, dependents, housing_type, employment })
      expect(s).toBeGreaterThanOrEqual(20)
      expect(s).toBeLessThanOrEqual(90)
    }
  })
  it('flags the result as computed locally', () => {
    expect(analyzeProfile(base).source).toBe('local')
  })
})
