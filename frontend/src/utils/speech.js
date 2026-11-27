// Browser text-to-speech fallback (Web Speech API) used when ElevenLabs isn't available.

export function toSpeakable(markdown) {
  return markdown
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/^#+\s+/gm, '')
    .replace(/^\s*[-*]\s+/gm, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 1000)
}

export const browserSpeechAvailable = () => typeof window !== 'undefined' && 'speechSynthesis' in window

// Speaks text; resolves when finished or cancelled.
export function speak(text) {
  return new Promise((resolve, reject) => {
    if (!browserSpeechAvailable()) return reject(new Error('Speech synthesis not supported in this browser'))
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(toSpeakable(text))
    u.rate = 1.02
    u.onend = () => resolve()
    u.onerror = () => resolve()
    window.speechSynthesis.speak(u)
  })
}

export function stopSpeaking() {
  if (browserSpeechAvailable()) window.speechSynthesis.cancel()
}
