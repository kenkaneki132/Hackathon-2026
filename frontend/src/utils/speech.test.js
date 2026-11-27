import { describe, expect, it } from 'vitest'
import { toSpeakable, speak, browserSpeechAvailable } from './speech.js'

describe('toSpeakable', () => {
  it('strips markdown so the voice does not read symbols', () => {
    expect(toSpeakable('**Emergency Fund**\n\n- Save *first*\n- [FEMA](https://fema.gov) maps')).toBe('Emergency Fund Save first FEMA maps')
  })
  it('caps length at 1000 characters', () => {
    expect(toSpeakable('a '.repeat(2000)).length).toBeLessThanOrEqual(1000)
  })
})

describe('speak', () => {
  it('rejects gracefully when speech synthesis is unavailable (node)', async () => {
    expect(browserSpeechAvailable()).toBe(false)
    await expect(speak('hi')).rejects.toThrow(/not supported/)
  })
})
