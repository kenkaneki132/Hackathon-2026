import { useNavigate } from 'react-router-dom'
import ScoreRing from '../components/ScoreRing'
import Icon from '../components/Icon'
import PortfolioBadge from '../components/PortfolioBadge'

const STEPS = [
  { icon: 'clipboard', title: '5-minute assessment', desc: 'Tell us about your income, family, housing and savings. No Social Security number needed.' },
  { icon: 'chart', title: 'See your risk scores', desc: 'A clear picture of your emergency-fund gap, insurance gaps and flood risk for your ZIP code.' },
  { icon: 'calendar', title: 'Your 90-day plan', desc: 'A week-by-week plan with specific, affordable steps, starting with your weakest area.' },
]

const SAMPLE = [
  { label: 'Emergency fund', value: 58, color: 'var(--amber)' },
  { label: 'Insurance', value: 81, color: 'var(--emerald)' },
  { label: 'Disaster readiness', value: 74, color: 'var(--emerald)' },
]

function SamplePreview() {
  return (
    <figure className="card" aria-label="Sample report preview" style={{ maxWidth: 560, margin: '3rem auto 0', padding: '1.25rem 1.4rem', textAlign: 'left', boxShadow: 'var(--shadow-lg)', display: 'flex', gap: '1.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
      <ScoreRing score={72} size={104} stroke={9} />
      <div style={{ flex: '1 1 240px', display: 'grid', gap: 10 }}>
        <figcaption className="eyebrow" style={{ color: 'var(--muted)' }}>Sample report</figcaption>
        {SAMPLE.map(s => (
          <div key={s.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 4 }}>
              <span style={{ color: 'var(--slate)', fontWeight: 500 }}>{s.label}</span>
              <span style={{ color: 'var(--navy)', fontWeight: 700 }}>{s.value}</span>
            </div>
            <div className="meter thin"><i style={{ width: `${s.value}%`, background: s.color }} /></div>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: 'var(--emerald-dark)', background: 'var(--emerald-50)', borderRadius: 10, padding: '7px 10px' }}>
          <Icon name="check" size={14} /> Week 1: list your monthly expenses and current coverage
        </div>
      </div>
    </figure>
  )
}

export default function Landing() {
  const nav = useNavigate()

  return (
    <div>
      {/* Hero */}
      <section style={{ padding: 'clamp(3rem, 8vw, 5rem) 1.25rem 4rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 70% 55% at 50% 0%, rgba(5,150,105,0.10) 0%, transparent 70%), radial-gradient(ellipse 40% 40% at 85% 70%, rgba(217,119,6,0.06) 0%, transparent 70%)',
        }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 760, margin: '0 auto' }}>
          <div className="badge badge-green fade-up" style={{ marginBottom: '1.5rem', fontSize: '0.8rem', padding: '5px 12px' }}>
            <Icon name="shieldCheck" size={14} /> State Farm Financial Wellness Track
          </div>
          <h1 className="fade-up" style={{ animationDelay: '0.05s', marginBottom: '1.25rem', letterSpacing: '-0.01em' }}>
            Your personal<br />
            <em style={{ color: 'var(--emerald)', fontStyle: 'italic' }}>financial safety net</em>
          </h1>
          <p className="fade-up" style={{ fontSize: '1.1rem', animationDelay: '0.1s', maxWidth: 540, margin: '0 auto 2.25rem' }}>
            FinGuard AI helps you understand your financial risks, close insurance gaps and build an emergency fund, in plain English.
          </p>
          <div className="fade-up" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', animationDelay: '0.15s' }}>
            <button className="btn btn-primary btn-lg" onClick={() => nav('/onboarding')}>Get my free assessment <Icon name="arrowRight" size={18} /></button>
            <button className="btn btn-secondary btn-lg" onClick={() => nav('/chat')}><Icon name="chat" size={18} /> Ask the AI coach</button>
          </div>
          <div className="fade-up" style={{ animationDelay: '0.2s' }}><SamplePreview /></div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ background: 'var(--white)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '2.25rem 1.25rem' }}>
        <div className="container grid-fit" style={{ '--min': '180px', textAlign: 'center', gap: '1.5rem' }}>
          {[
            { stat: '56%', label: "of Americans can't cover a $1,000 emergency" },
            { stat: '40M+', label: 'renters lack renters insurance' },
            { stat: '~$15/mo', label: 'average cost of renters insurance' },
            { stat: '6 mo', label: 'recommended emergency fund size' },
          ].map(({ stat, label }) => (
            <div key={stat}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.1rem', color: 'var(--emerald)', lineHeight: 1.1 }}>{stat}</div>
              <p style={{ fontSize: '0.86rem', marginTop: 6 }}>{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: '4.5rem 1.25rem' }}>
        <div className="container">
          <p className="eyebrow" style={{ textAlign: 'center', color: 'var(--emerald)', marginBottom: 8 }}>How it works</p>
          <h2 style={{ textAlign: 'center', marginBottom: '0.6rem' }}>Three steps to financial peace of mind</h2>
          <p style={{ textAlign: 'center', marginBottom: '2.75rem' }}>Free, private, and done in about five minutes.</p>
          <div className="grid-fit" style={{ '--min': '260px', gap: '1.25rem' }}>
            {STEPS.map(({ icon, title, desc }, i) => (
              <div key={title} className="card" style={{ padding: '1.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.1rem' }}>
                  <span className="icon-tile lg"><Icon name={icon} size={22} /></span>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--border-strong)', lineHeight: 1 }}>0{i + 1}</span>
                </div>
                <h3 style={{ marginBottom: '0.5rem' }}>{title}</h3>
                <p style={{ fontSize: '0.92rem' }}>{desc}</p>
              </div>
            ))}
          </div>

          <div className="grid-fit" style={{ '--min': '300px', gap: '1.25rem', marginTop: '1.25rem' }}>
            <button onClick={() => nav('/simulator')} className="card" style={{ padding: '1.5rem', textAlign: 'left', display: 'flex', gap: 14, alignItems: 'flex-start', background: 'linear-gradient(135deg, #fffbeb, var(--white) 60%)' }}>
              <span className="icon-tile amber"><Icon name="bolt" size={20} /></span>
              <span>
                <strong style={{ display: 'block', fontSize: '1.02rem', color: 'var(--navy)', marginBottom: 4 }}>Life Impact Simulator</strong>
                <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Thinking about a car, a move, a loan or a new job? Compare safe, balanced and risky paths before you commit.</span>
              </span>
              <Icon name="arrowRight" size={18} style={{ marginLeft: 'auto', color: 'var(--muted)', alignSelf: 'center' }} />
            </button>
            <button onClick={() => nav('/chat')} className="card" style={{ padding: '1.5rem', textAlign: 'left', display: 'flex', gap: 14, alignItems: 'flex-start', background: 'linear-gradient(135deg, var(--emerald-50), var(--white) 60%)' }}>
              <span className="icon-tile"><Icon name="chat" size={20} /></span>
              <span>
                <strong style={{ display: 'block', fontSize: '1.02rem', color: 'var(--navy)', marginBottom: 4 }}>AI coach with voice</strong>
                <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Ask about budgeting, insurance or emergency funds and get answers in plain English. Tap Listen to hear them.</span>
              </span>
              <Icon name="arrowRight" size={18} style={{ marginLeft: 'auto', color: 'var(--muted)', alignSelf: 'center' }} />
            </button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: 'radial-gradient(ellipse 80% 120% at 50% 0%, #065f46 0%, var(--emerald-dark) 70%)', padding: '4.5rem 1.25rem', textAlign: 'center' }}>
        <h2 style={{ color: '#fff', marginBottom: '0.9rem' }}>Ready to protect your future?</h2>
        <p style={{ color: 'rgba(255,255,255,0.75)', marginBottom: '2rem' }}>Free, private, and takes under five minutes.</p>
        <button className="btn btn-lg" onClick={() => nav('/onboarding')} style={{ background: '#fff', color: 'var(--emerald-dark)' }}>
          Start my assessment <Icon name="arrowRight" size={18} />
        </button>
      </section>

      <footer style={{ padding: '2rem 1.25rem', textAlign: 'center', borderTop: '1px solid var(--border)' }}>
        <p style={{ fontSize: '0.8rem' }}>
          FinGuard AI · Built for the State Farm Financial Wellness Track ·{' '}
          <span style={{ color: 'var(--emerald-dark)', fontWeight: 600 }}>Not financial advice</span>. Always consult a licensed professional.
        </p>
        <div style={{ marginTop: 14, color: 'var(--slate)' }}><PortfolioBadge /></div>
      </footer>
    </div>
  )
}
