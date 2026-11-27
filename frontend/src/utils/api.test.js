import { afterEach, describe, expect, it, vi } from 'vitest'
import { withFallback, analyzeProfile, sendChat, textToSpeech, getFloodRisk } from './api.js'

const profile = { age: 30, annual_income: 60000, monthly_expenses: 2800, dependents: 0, housing_type: 'rent', zip_code: '33101', employment: 'employed', has_savings: false, savings_months: 0 }

afterEach(() => vi.unstubAllGlobals())

describe('withFallback', () => {
  it('uses the remote result when it succeeds', async () => {
    expect(await withFallback(async () => 'remote', () => 'local', { demo: false })).toBe('remote')
  })
  it('falls back on network errors (TypeError)', async () => {
    expect(await withFallback(async () => { throw new TypeError('Failed to fetch') }, () => 'local', { demo: false })).toBe('local')
  })
  it('falls back on 404 (static host) and 5xx', async () => {
    for (const status of [404, 500, 503]) {
      const err = Object.assign(new Error('x'), { status })
      expect(await withFallback(async () => { throw err }, () => 'local', { demo: false })).toBe('local')
    }
  })
  it('does NOT hide client errors like 401/422', async () => {
    const err = Object.assign(new Error('nope'), { status: 422 })
    await expect(withFallback(async () => { throw err }, () => 'local', { demo: false })).rejects.toThrow('nope')
  })
  it('always uses the local engine in demo mode', async () => {
    const remote = vi.fn()
    expect(await withFallback(remote, () => 'local', { demo: true })).toBe('local')
    expect(remote).not.toHaveBeenCalled()
  })
})

describe('API functions without a backend', () => {
  it('analyzeProfile falls back to the local engine', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch') }))
    const r = await analyzeProfile(profile)
    expect(r.source).toBe('local')
    expect(r.scores.flood.risk_level).toBe('high')
  })
  it('analyzeProfile uses the backend when it responds', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ scores: { overall: 1 } }), { status: 200 })))
    expect((await analyzeProfile(profile)).scores.overall).toBe(1)
  })
  it('sendChat answers offline', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 404 })))
    const r = await sendChat('how do I budget?')
    expect(r.source).toBe('local')
    expect(r.response).toContain('50/30/20')
  })
  it('textToSpeech returns null instead of throwing when TTS is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 503 })))
    expect(await textToSpeech('hello')).toBeNull()
  })
  it('getFloodRisk includes a tip offline', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('offline') }))
    const r = await getFloodRisk('85001')
    expect(r).toMatchObject({ zip_code: '85001', risk_level: 'low' })
    expect(r.tip).toMatch(/low flood risk/)
  })
  it('does not send "Bearer null" when there is no token', async () => {
    const fetchMock = vi.fn(async () => new Response('{}', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    await analyzeProfile(profile, async () => null)
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined()
  })
})
