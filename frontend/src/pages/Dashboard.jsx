import { useNavigate } from 'react-router-dom'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts'
import ScoreRing, { scoreTone } from '../components/ScoreRing'
import CardHead from '../components/CardHead'
import Icon from '../components/Icon'
import { ANIMATE } from '../utils/motion'

const TONE_BADGE = { good: 'badge-green', warn: 'badge-amber', bad: 'badge-red' }
const TONE_LABEL = { good: 'Good', warn: 'Needs work', bad: 'At risk' }
const TONE_COLOR = { good: 'var(--emerald)', warn: 'var(--amber)', bad: 'var(--red)' }

const IMPORTANCE = {
  critical: { label: 'Critical', badge: 'badge-red', rank: 0 },
  high: { label: 'High priority', badge: 'badge-amber', rank: 1 },
  medium: { label: 'Recommended', badge: 'badge-blue', rank: 2 },
  low: { label: 'Optional', badge: 'badge-slate', rank: 3 },
}
const FLOOD = {
  high: { tile: 'red', title: 'High flood risk' },
  medium: { tile: 'amber', title: 'Moderate flood risk' },
  low: { tile: '', title: 'Low flood risk' },
}

function StatusBadge({ score }) {
  const t = scoreTone(score)
  return <span className={`badge ${TONE_BADGE[t]}`}>{TONE_LABEL[t]}</span>
}

export default function Dashboard({ profile, results }) {
  const nav = useNavigate()
  const { scores, action_plan, insurance_recommendations } = results
  const fund = scores.emergency_fund
  const flood = FLOOD[scores.flood.risk_level] || FLOOD.low
  const insurance = [...insurance_recommendations].sort((a, b) => (IMPORTANCE[a.importance]?.rank ?? 9) - (IMPORTANCE[b.importance]?.rank ?? 9))
  const priorityGaps = insurance.filter(i => i.importance === 'critical' || i.importance === 'high').length

  const areas = [
    { key: 'fund', icon: 'wallet', label: 'Emergency fund', score: fund.score, detail: `${fund.current_months} of ${fund.target_months} months saved`, why: `${fund.current_months} of ${fund.target_months} months saved` },
    { key: 'ins', icon: 'umbrella', label: 'Insurance coverage', score: scores.insurance.score, detail: priorityGaps ? `${priorityGaps} priority gap${priorityGaps > 1 ? 's' : ''} to close` : 'No priority gaps', why: priorityGaps ? `${priorityGaps} priority policy gap${priorityGaps > 1 ? 's' : ''}` : 'no priority gaps' },
    { key: 'flood', icon: 'waves', label: 'Disaster readiness', score: scores.flood.score, detail: `${flood.title} · ZIP ${profile?.zip_code ?? '—'}`, why: `${flood.title.toLowerCase()} where you live` },
  ]
  const weakest = [...areas].sort((a, b) => a.score - b.score)[0]

  const radarData = [
    { subject: 'Emergency fund', A: fund.score },
    { subject: 'Insurance', A: scores.insurance.score },
    { subject: 'Disaster prep', A: scores.flood.score },
    { subject: 'Income security', A: profile?.employment === 'employed' ? 75 : 45 },
    { subject: 'Future planning', A: profile?.age < 40 ? 60 : 70 },
  ]
  const fundPct = Math.min(100, (fund.current_months / Math.max(fund.target_months, 0.1)) * 100)
  const overallTone = scoreTone(scores.overall)

  return (
    <div className="page">
      <div className="container stack">

        {/* Summary */}
        <section className="card fade-up" style={{ padding: 'clamp(1.25rem, 4vw, 2rem)', display: 'flex', alignItems: 'center', gap: 'clamp(1.25rem, 4vw, 2.5rem)', flexWrap: 'wrap' }}>
          <ScoreRing score={scores.overall} size={136} stroke={10} />
          <div style={{ flex: '1 1 320px' }}>
            <span className="badge badge-green" style={{ marginBottom: 10 }}><Icon name="clipboard" size={13} /> Your financial health report</span>
            <h1 style={{ fontSize: 'clamp(1.7rem, 3.6vw, 2.4rem)', marginBottom: 8 }}>
              Overall score <span style={{ color: TONE_COLOR[overallTone] }}>{scores.overall}</span><span style={{ color: 'var(--muted)', fontSize: '0.6em' }}> / 100</span>
            </h1>
            <p style={{ fontSize: '0.98rem', maxWidth: 560 }}>
              <StatusBadge score={scores.overall} />{' '}
              Your weakest area is <strong style={{ color: 'var(--navy)' }}>{weakest.label.toLowerCase()}</strong> ({weakest.why}). The plan below starts there.
            </p>
          </div>
        </section>

        {/* Area scores */}
        <section className="grid-3" aria-label="Scores by area">
          {areas.map(a => (
            <div key={a.key} className="card card-pad" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <ScoreRing score={a.score} size={84} stroke={7} />
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: 'var(--navy)', marginBottom: 4 }}>
                  <Icon name={a.icon} size={16} style={{ color: 'var(--muted)' }} />{a.label}
                </div>
                <StatusBadge score={a.score} />
                <p style={{ fontSize: '0.82rem', marginTop: 6 }}>{a.detail}</p>
              </div>
            </div>
          ))}
        </section>

        {/* Detail row */}
        <section className="grid-3">
          <div className="card card-pad">
            <CardHead icon="wallet" title="Emergency fund" sub="Months of essential expenses you could cover" />
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', lineHeight: 1, color: 'var(--navy)' }}>{fund.current_months}</span>
              <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>of {fund.target_months} months</span>
            </div>
            <div className="meter" role="progressbar" aria-label="Emergency fund progress" aria-valuemin={0} aria-valuemax={fund.target_months} aria-valuenow={fund.current_months}>
              <i style={{ width: `${fundPct}%`, background: TONE_COLOR[scoreTone(fund.score)] }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--muted)', marginTop: 6, marginBottom: '1rem' }}>
              <span>0</span><span>{fund.target_months}-month target</span>
            </div>
            {fund.gap_months > 0 ? (
              <div className="callout callout-amber">
                <Icon name="target" size={16} style={{ marginTop: 2 }} />
                <p><strong>${fund.gap_amount.toLocaleString()}</strong> to go, about {fund.gap_months} more months of expenses.</p>
              </div>
            ) : (
              <div className="callout callout-green"><Icon name="check" size={16} style={{ marginTop: 2 }} /><p>You have reached your target.</p></div>
            )}
          </div>

          <div className="card card-pad">
            <CardHead icon="waves" tone={flood.tile} title="Disaster risk" sub={`Flood exposure for ZIP ${profile?.zip_code ?? '—'}`} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.9rem' }}>
              <span className={`badge ${scores.flood.risk_level === 'high' ? 'badge-red' : scores.flood.risk_level === 'medium' ? 'badge-amber' : 'badge-green'}`} style={{ fontSize: '0.82rem', padding: '5px 12px' }}>
                <Icon name={scores.flood.risk_level === 'low' ? 'check' : 'alert'} size={14} /> {flood.title}
              </span>
            </div>
            <p style={{ fontSize: '0.88rem', lineHeight: 1.6 }}>
              {scores.flood.risk_level === 'low'
                ? 'Your area has relatively low flood risk. Standard renters or homeowners coverage should handle most weather events.'
                : <>Standard renters and homeowners insurance usually does <strong style={{ color: 'var(--navy)' }}>not</strong> cover flooding. Consider a separate policy through FEMA&apos;s NFIP program.</>}
            </p>
          </div>

          <div className="card card-pad">
            <CardHead icon="target" tone="violet" title="Health radar" sub="All five areas at a glance (0–100)" />
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData} outerRadius="62%" margin={{ top: 4, right: 46, bottom: 4, left: 46 }}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: 'var(--muted)' }} />
                <Radar name="Score" dataKey="A" stroke="var(--emerald)" fill="var(--emerald)" fillOpacity={0.18} strokeWidth={2} isAnimationActive={ANIMATE} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Insurance */}
        <section className="card card-pad">
          <CardHead icon="umbrella" tone="blue" title="Recommended insurance" sub="Sorted by how much each policy matters for your situation" />
          <div className="grid-fit" style={{ '--min': '240px' }}>
            {insurance.map(ins => {
              const imp = IMPORTANCE[ins.importance] || IMPORTANCE.low
              return (
                <article key={ins.id} style={{ border: '1px solid var(--border)', borderRadius: 14, padding: '1rem 1.1rem', display: 'flex', flexDirection: 'column', gap: 8, background: ins.importance === 'critical' ? '#fff7f7' : 'var(--white)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                    <strong style={{ color: 'var(--navy)', fontSize: '0.95rem' }}>{ins.name}</strong>
                    <span style={{ whiteSpace: 'nowrap', fontWeight: 700, color: 'var(--emerald-dark)' }}>~${ins.avg_cost}<span style={{ fontWeight: 500, fontSize: '0.75rem', color: 'var(--muted)' }}>/mo</span></span>
                  </div>
                  <span className={`badge ${imp.badge}`} style={{ alignSelf: 'flex-start' }}>{imp.label}</span>
                  <p style={{ fontSize: '0.83rem', lineHeight: 1.5 }}>{ins.description}</p>
                </article>
              )
            })}
          </div>
        </section>

        {/* Action plan */}
        <section className="card" style={{ padding: 'clamp(1.25rem, 4vw, 2rem)' }}>
          <CardHead as="h2" icon="calendar" title="Your 90-day action plan" sub="Personalized steps to close your gaps, in order." />
          <div className="plan">
            {action_plan.map((item, idx) => (
              <div key={idx} className={`plan-item${idx === 0 ? ' first' : ''}`}>
                <div>
                  <div className={`plan-num${item.priority === 'high' ? ' high' : ''}`}>{idx + 1}</div>
                  <span className="plan-week">Week {item.week}</span>
                </div>
                <div>
                  <div className="plan-title">
                    <h3>{item.title}</h3>
                    <span className={`badge ${item.priority === 'high' ? 'badge-red' : 'badge-amber'}`}>{item.priority === 'high' ? 'High priority' : 'Medium'}</span>
                    <span className="plan-time"><Icon name="clock" size={14} />{item.time_estimate}</span>
                  </div>
                  <ul>{item.tasks.map((task, ti) => <li key={ti}>{task}</li>)}</ul>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: '0.5rem' }}>
          <button className="btn btn-primary btn-lg" onClick={() => nav('/chat')}><Icon name="chat" size={18} /> Ask the AI coach</button>
          <button className="btn btn-secondary btn-lg" onClick={() => nav('/onboarding')}><Icon name="refresh" size={18} /> Retake assessment</button>
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.75rem' }}>
          For educational purposes only. Consult a licensed financial advisor or insurance professional.
        </p>
      </div>
    </div>
  )
}
