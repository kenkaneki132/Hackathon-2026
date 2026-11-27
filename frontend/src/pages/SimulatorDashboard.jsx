import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AreaChart, Area, BarChart, Bar, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, ResponsiveContainer,
  CartesianGrid, XAxis, YAxis, Tooltip, Legend, Cell,
} from 'recharts'
import ScoreRing from '../components/ScoreRing'
import CardHead from '../components/CardHead'
import Icon from '../components/Icon'
import { ANIMATE } from '../utils/motion'

const SCENARIO_COLOR = { safe: '#059669', balanced: '#d97706', risky: '#dc2626' }
const SHOCK_COLOR    = { holds: '#059669', 'under pressure': '#d97706', fails: '#dc2626' }
const AXIS_TICK = { fontSize: 12, fill: 'var(--muted)' }
const TOOLTIP = { contentStyle: { borderRadius: 10, border: '1px solid var(--border)', boxShadow: 'var(--shadow)', fontSize: 13 } }
const LEGEND = { wrapperStyle: { fontSize: 13, paddingTop: 8 }, iconType: 'circle', iconSize: 9 }

export default function SimulatorDashboard({ simResults }) {
  const nav = useNavigate()
  const { metrics, scenarios, shock_test: shockTest, coach_nudges: nudges, action_plan: actionPlan, headline, decision, goal, base_math: baseMath } = simResults

  const radarData = useMemo(() => {
    const balanced = scenarios.find(s => s.id === 'balanced') || scenarios[0]
    return [
      { subject: 'Financial',  value: balanced.financial_score },
      { subject: 'Stress',     value: balanced.stress_score },
      { subject: 'Risk',       value: balanced.risk_score },
      { subject: 'Goal',       value: balanced.goal_score },
      { subject: 'Resilience', value: balanced.resilience_score },
    ]
  }, [scenarios])

  const comparisonData = scenarios.map(s => ({
    name: s.title.replace(' choice', ''),
    Financial: s.financial_score, Stress: s.stress_score,
    Risk: s.risk_score, Goal: s.goal_score,
  }))

  const timelineData = scenarios[0].timeline.map((point, i) => {
    const row = { month: `M${point.month}` }
    scenarios.forEach(s => { row[s.id] = s.timeline[i]?.savings ?? 0 })
    return row
  })

  const shockData = shockTest.results.map(e => ({
    name: e.scenario_title.replace(' choice', ''),
    Resilience: e.shock.resilience_score, status: e.shock.status,
  }))

  const money = v => `$${Number(v).toLocaleString()}`
  const baseTiles = [
    ['dollar', 'Monthly income', money(baseMath.monthly_income)],
    ['home', 'Essential expenses', money(baseMath.essential_expenses)],
    ['piggy', 'Starting savings', money(baseMath.starting_savings)],
    ['wallet', 'Free cash before', money(baseMath.free_cash_before_decision)],
    ['briefcase', 'Employment stability', `${Math.round(baseMath.employment_stability * 100)}%`],
  ]

  return (
    <div className="page">
      <div className="container stack">

        {/* Header */}
        <section className="card fade-up" style={{ padding: 'clamp(1.25rem, 4vw, 2rem)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 480px' }}>
            <span className="badge badge-amber" style={{ marginBottom: 10 }}><Icon name="bolt" size={13} /> Life Impact Simulator</span>
            <h1 style={{ fontSize: 'clamp(1.45rem, 3vw, 2.05rem)', maxWidth: 760 }}>{headline}</h1>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: '0.9rem' }}>
              <span className="badge badge-slate" style={{ padding: '5px 11px' }}>Decision: {decision.label}</span>
              <span className="badge badge-slate" style={{ padding: '5px 11px' }}>Goal: {goal.label}</span>
              <span className="badge badge-slate" style={{ padding: '5px 11px' }}>Horizon: {decision.time_horizon} months</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => nav('/chat')}><Icon name="chat" size={17} /> Ask the AI coach</button>
            <button className="btn btn-secondary" onClick={() => nav('/simulator')}><Icon name="refresh" size={17} /> New simulation</button>
          </div>
        </section>

        {/* Score rings */}
        <section className="grid-fit" style={{ '--min': '180px' }} aria-label="Simulation scores">
          {[
            ['Life impact',      metrics.life_impact_score],
            ['Stress readiness', metrics.stress_readiness],
            ['Risk exposure',    metrics.risk_exposure],
            ['Goal protection',  metrics.goal_protection],
          ].map(([label, score]) => (
            <div key={label} className="card" style={{ padding: '1.4rem', display: 'flex', justifyContent: 'center' }}>
              <ScoreRing score={score} label={label} size={96} />
            </div>
          ))}
        </section>

        {/* Comparison + radar */}
        <section className="grid-2">
          <div className="card card-pad">
            <CardHead icon="chart" title="Parallel futures" sub="Safe, balanced and risky paths compared on every score (0–100)." />
            <ResponsiveContainer width="100%" height={270}>
              <BarChart data={comparisonData} barGap={3} barCategoryGap="22%">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={AXIS_TICK} />
                <YAxis tickLine={false} axisLine={false} domain={[0, 100]} tick={{ ...AXIS_TICK, fontSize: 11 }} width={32} />
                <Tooltip cursor={{ fill: 'rgba(15,23,42,0.04)' }} {...TOOLTIP} />
                <Legend {...LEGEND} />
                <Bar dataKey="Financial" fill="#059669" radius={[5, 5, 0, 0]} isAnimationActive={ANIMATE} />
                <Bar dataKey="Stress"    fill="#d97706" radius={[5, 5, 0, 0]} isAnimationActive={ANIMATE} />
                <Bar dataKey="Risk"      fill="#64748b" radius={[5, 5, 0, 0]} isAnimationActive={ANIMATE} />
                <Bar dataKey="Goal"      fill="#7c3aed" radius={[5, 5, 0, 0]} isAnimationActive={ANIMATE} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card card-pad">
            <CardHead icon="target" tone="violet" title="Life impact radar" sub="The balanced scenario, score by score." />
            <ResponsiveContainer width="100%" height={270}>
              <RadarChart data={radarData} outerRadius="62%" margin={{ top: 4, right: 40, bottom: 4, left: 40 }}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="subject" tick={AXIS_TICK} />
                <Radar dataKey="value" stroke="var(--emerald)" fill="var(--emerald)" fillOpacity={0.18} strokeWidth={2} isAnimationActive={ANIMATE} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Cash buffer */}
        <section className="card card-pad">
          <CardHead icon="trending" title="Cash buffer over time" sub={`How your savings evolve over ${decision.time_horizon} months in each scenario.`} />
          <ResponsiveContainer width="100%" height={270}>
            <AreaChart data={timelineData} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
              <defs>
                {Object.entries(SCENARIO_COLOR).map(([id, c]) => (
                  <linearGradient key={id} id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={c} stopOpacity={0.08} />
                    <stop offset="95%" stopColor={c} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tick={AXIS_TICK} />
              <YAxis tickLine={false} axisLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ ...AXIS_TICK, fontSize: 11 }} width={44} />
              <Tooltip formatter={v => money(v)} {...TOOLTIP} />
              <Legend {...LEGEND} />
              {Object.keys(SCENARIO_COLOR).map(id => (
                <Area key={id} type="monotone" dataKey={id} stroke={SCENARIO_COLOR[id]} fill={`url(#grad-${id})`} strokeWidth={2}
                  name={id.charAt(0).toUpperCase() + id.slice(1)} isAnimationActive={ANIMATE} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </section>

        {/* Scenario cards */}
        <section className="grid-fit" style={{ '--min': '250px' }} aria-label="Scenarios">
          {scenarios.map(s => (
            <article key={s.id} className="card" style={{ padding: '1.4rem', borderTop: `4px solid ${SCENARIO_COLOR[s.id]}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: '0.75rem' }}>
                <div>
                  <span className="eyebrow" style={{ color: SCENARIO_COLOR[s.id] }}>{s.title}</span>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--navy)', lineHeight: 1.2, marginTop: 4 }}>
                    ${s.monthly_impact}<span style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>/mo</span>
                  </div>
                </div>
                {s.goal_delay_months > 0
                  ? <span className="badge badge-amber"><Icon name="clock" size={12} /> +{s.goal_delay_months} mo goal delay</span>
                  : <span className="badge badge-green"><Icon name="check" size={12} /> No goal delay</span>}
              </div>
              <p style={{ fontSize: '0.86rem', marginBottom: '1rem' }}>{s.summary}</p>
              <div style={{ display: 'grid', gap: 9 }}>
                {[['Financial', s.financial_score], ['Stress', s.stress_score], ['Risk', s.risk_score], ['Goal', s.goal_score], ['Resilience', s.resilience_score]].map(([label, val]) => (
                  <div key={label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 4 }}>
                      <span style={{ color: 'var(--muted)' }}>{label}</span>
                      <strong style={{ color: 'var(--navy)' }}>{val}</strong>
                    </div>
                    <div className="meter thin"><i style={{ width: `${val}%`, background: SCENARIO_COLOR[s.id] }} /></div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </section>

        {/* Base math */}
        <section className="grid-fit" style={{ '--min': '150px' }} aria-label="Your numbers">
          {baseTiles.map(([icon, label, val]) => (
            <div key={label} className="card" style={{ padding: '1.1rem 1.2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', fontWeight: 600, color: 'var(--muted)', marginBottom: 6 }}>
                <Icon name={icon} size={15} /> {label}
              </div>
              <div style={{ fontSize: '1.45rem', color: 'var(--navy)', fontFamily: 'var(--font-display)', lineHeight: 1.2 }}>{val}</div>
            </div>
          ))}
        </section>

        {/* Shock test + nudges */}
        <section className="grid-2">
          <div className="card card-pad">
            <CardHead icon="bolt" tone="red" title="Shock test: job loss" sub="Resilience score left in each path if income stops." />
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={shockData} barCategoryGap="35%">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={AXIS_TICK} />
                <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tick={{ ...AXIS_TICK, fontSize: 11 }} width={32} />
                <Tooltip cursor={{ fill: 'rgba(15,23,42,0.04)' }} {...TOOLTIP} />
                <Bar dataKey="Resilience" radius={[6, 6, 0, 0]} isAnimationActive={ANIMATE}>
                  {shockData.map(e => <Cell key={e.name} fill={SHOCK_COLOR[e.status]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="callout callout-red" style={{ marginTop: '1rem' }}>
              <Icon name="alert" size={16} style={{ marginTop: 2 }} />
              <p><strong>Weakest path.</strong> {shockTest.weakest_path.shock.insight}</p>
            </div>
          </div>

          <div className="card card-pad">
            <CardHead icon="sparkles" title="Coach nudges" sub="What the numbers are telling you." />
            <div style={{ display: 'grid', gap: 12 }}>
              {nudges.map(nudge => (
                <div key={nudge.title} style={{ padding: '0.95rem 1rem', borderRadius: 12, background: 'var(--bg)', border: '1px solid var(--border)' }}>
                  <p className="eyebrow" style={{ color: 'var(--emerald)', marginBottom: 5 }}>{nudge.title}</p>
                  <p style={{ fontSize: '0.88rem', color: 'var(--navy)', lineHeight: 1.55 }}>{nudge.message}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Action plan */}
        <section className="card" style={{ padding: 'clamp(1.25rem, 4vw, 2rem)' }}>
          <CardHead as="h2" icon="calendar" title="Action plan" sub="Steps to protect your position before you commit to the decision." />
          <div className="plan">
            {actionPlan.map((item, i) => (
              <div key={i} className={`plan-item${i === 0 ? ' first' : ''}`}>
                <div>
                  <div className={`plan-num${item.priority === 'high' ? ' high' : ''}`}>{i + 1}</div>
                  <span className="plan-week">{item.week}</span>
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
          <button className="btn btn-primary btn-lg" onClick={() => nav('/chat')}><Icon name="chat" size={18} /> Chat with the AI coach</button>
          <button className="btn btn-secondary btn-lg" onClick={() => nav('/simulator')}><Icon name="refresh" size={18} /> Run a new simulation</button>
          <button className="btn btn-secondary btn-lg" onClick={() => nav('/dashboard')}><Icon name="chart" size={18} /> Health dashboard</button>
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.75rem' }}>
          Educational simulation for presentation and prototyping. Not licensed financial advice.
        </p>
      </div>
    </div>
  )
}
