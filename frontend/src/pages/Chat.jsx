import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../auth'
import { sendChat, textToSpeech, DEMO_MODE } from '../utils/api'
import { speak, stopSpeaking } from '../utils/speech'
import ReactMarkdown from 'react-markdown'
import Icon from '../components/Icon'

const SUGGESTIONS = [
  'What is an emergency fund and how much do I need?',
  'What does renters insurance actually cover?',
  'Do I need life insurance?',
  'How does the 50/30/20 budget rule work?',
  'What is disability insurance?',
]

export default function Chat({ profile }) {
  const { getAccessTokenSilently, user } = useAuth()
  const getToken = () => getAccessTokenSilently({ authorizationParams: { audience: import.meta.env.VITE_AUTH0_AUDIENCE } })

  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: `Hi ${user?.given_name || 'there'}! I'm your FinGuard AI financial wellness coach.\n\nAsk me anything about budgeting, insurance, emergency funds, or financial planning in plain English. I'm here to help!`,
  }])
  const [input,      setInput]      = useState('')
  const [loading,    setLoading]    = useState(false)
  const [playingIdx, setPlayingIdx] = useState(null)
  const bottomRef = useRef(null)
  const audioRef  = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function send(text) {
    const msg = text || input.trim()
    if (!msg) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: msg }])
    setLoading(true)
    try {
      const data = await sendChat(msg, profile, getToken)
      setMessages(prev => [...prev, { role: 'assistant', content: data.response, source: data.source }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong while answering. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  async function handleListen(text, idx) {
    // Stop if already playing this message
    if (playingIdx === idx) {
      audioRef.current?.pause()
      stopSpeaking()
      setPlayingIdx(null)
      return
    }
    try {
      setPlayingIdx(idx)
      const blob = await textToSpeech(text, getToken)
      if (!blob) {               // no ElevenLabs: use the browser's built-in voice
        await speak(text)
        setPlayingIdx(null)
        return
      }
      const url  = URL.createObjectURL(blob)
      if (audioRef.current) { audioRef.current.pause(); URL.revokeObjectURL(audioRef.current.src) }
      audioRef.current = new Audio(url)
      audioRef.current.play()
      audioRef.current.onended = () => setPlayingIdx(null)
    } catch (e) {
      console.error('TTS error:', e)
      setPlayingIdx(null)
      alert('Could not play audio in this browser.')
    }
  }

  const lastIdx = messages.length - 1

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', maxWidth: 760, margin: '0 auto', padding: '0 1rem' }}>

      {/* Header */}
      <header style={{ padding: '1rem 0 0.9rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Avatar size={42} />
        <div style={{ minWidth: 0 }}>
          <h1 style={{ fontFamily: 'var(--font-body)', fontSize: '1.02rem', fontWeight: 600, color: 'var(--navy)' }}>FinGuard AI coach</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--emerald-dark)' }}>
            <span aria-hidden="true" style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--emerald)' }} />
            {DEMO_MODE ? 'Offline coach · browser voice' : 'Powered by Google Gemini · voice by ElevenLabs'}
          </div>
        </div>
      </header>

      {/* Messages */}
      <div role="log" aria-live="polite" style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {messages.map((msg, i) => (
          <div key={i} className="fade-up" style={{ display: 'flex', gap: 10, justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', alignItems: 'flex-start' }}>
            {msg.role === 'assistant' && <Avatar size={30} />}
            <div style={{ maxWidth: 'min(82%, 560px)' }}>
              <div style={{
                padding: '11px 15px', fontSize: '0.92rem', lineHeight: 1.65,
                borderRadius: msg.role === 'user' ? '18px 18px 6px 18px' : '6px 18px 18px 18px',
                background: msg.role === 'user' ? 'var(--emerald)' : 'var(--white)',
                color: msg.role === 'user' ? '#fff' : 'var(--navy)',
                border: msg.role === 'assistant' ? '1px solid var(--border)' : 'none',
                boxShadow: msg.role === 'user' ? '0 6px 18px -10px rgba(5,150,105,0.8)' : 'var(--shadow)',
              }}>
                {msg.role === 'assistant' ? (
                  <ReactMarkdown components={{
                    p:      ({ children }) => <p style={{ margin: '0 0 0.5rem', color: 'var(--navy)' }}>{children}</p>,
                    strong: ({ children }) => <strong style={{ color: 'var(--navy)', fontWeight: 600 }}>{children}</strong>,
                    ul:     ({ children }) => <ul style={{ paddingLeft: '1.2rem', margin: '0.4rem 0 0.5rem' }}>{children}</ul>,
                    ol:     ({ children }) => <ol style={{ paddingLeft: '1.2rem', margin: '0.4rem 0 0.5rem' }}>{children}</ol>,
                    li:     ({ children }) => <li style={{ color: 'var(--slate)', marginBottom: 4 }}>{children}</li>,
                  }}>
                    {msg.content}
                  </ReactMarkdown>
                ) : msg.content}
              </div>

              {msg.role === 'assistant' && i > 0 && (
                <button
                  className="btn btn-quiet btn-sm"
                  onClick={() => handleListen(msg.content, i)}
                  aria-pressed={playingIdx === i}
                  style={{ marginTop: 6, padding: '5px 11px', gap: 6, fontWeight: 500, ...(playingIdx === i ? { background: 'var(--emerald-light)', color: 'var(--emerald-dark)', borderColor: 'transparent' } : {}) }}
                >
                  <Icon name={playingIdx === i ? 'stop' : 'volume'} size={14} />
                  {playingIdx === i ? 'Stop' : 'Listen'}
                  <span style={{ fontSize: '0.68rem', color: 'var(--muted)', fontWeight: 400 }}>{DEMO_MODE ? 'browser voice' : 'ElevenLabs'}</span>
                </button>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }} role="status" aria-label="Coach is typing">
            <Avatar size={30} />
            <div style={{ padding: '12px 16px', background: 'var(--white)', border: '1px solid var(--border)', borderRadius: '6px 18px 18px 18px', display: 'flex', gap: 5 }}>
              {[0, 1, 2].map(d => <span key={d} style={{ width: 7, height: 7, background: 'var(--muted)', borderRadius: '50%', animation: 'blink 1.2s ease-in-out infinite', animationDelay: `${d * 0.18}s` }} />)}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {lastIdx < 1 && (
        <div style={{ padding: '0.25rem 0 0.75rem' }}>
          <p style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="sparkles" size={14} /> Try asking
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {SUGGESTIONS.map(s => (
              <button key={s} className="btn btn-secondary btn-sm" onClick={() => send(s)} style={{ fontWeight: 500, whiteSpace: 'normal', textAlign: 'left' }}>{s}</button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={e => { e.preventDefault(); send() }}
        style={{ padding: '0.75rem 0 1rem', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, alignItems: 'center' }}
      >
        <label htmlFor="chat-input" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>Message the coach</label>
        <input
          id="chat-input" className="input" value={input} onChange={e => setInput(e.target.value)}
          placeholder="Ask about budgeting, insurance, emergency funds…" disabled={loading} autoComplete="off"
          style={{ flex: 1, borderRadius: 999, padding: '12px 18px' }}
        />
        <button
          type="submit" aria-label="Send message" disabled={loading || !input.trim()}
          className="btn btn-primary" style={{ width: 46, height: 46, padding: 0, borderRadius: '50%', flex: 'none' }}
        >
          <Icon name="send" size={18} />
        </button>
      </form>
    </div>
  )
}

function Avatar({ size }) {
  return (
    <span aria-hidden="true" style={{ width: size, height: size, borderRadius: '50%', background: 'var(--emerald)', color: '#fff', display: 'grid', placeItems: 'center', flex: 'none', boxShadow: '0 4px 12px -6px rgba(5,150,105,0.9)' }}>
      <Icon name="shieldCheck" size={Math.round(size * 0.55)} strokeWidth={2} />
    </span>
  )
}
