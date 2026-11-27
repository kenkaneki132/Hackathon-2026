export const scoreTone = score => (score >= 70 ? 'good' : score >= 40 ? 'warn' : 'bad')
const TONE = {
  good: { stroke: 'var(--emerald)', text: 'var(--emerald-dark)' },
  warn: { stroke: 'var(--amber)', text: '#78350f' },
  bad: { stroke: 'var(--red)', text: '#7f1d1d' },
}

export default function ScoreRing({ score, label, size = 120, stroke = 8 }) {
  const r = size / 2 - stroke - 2
  const circ = 2 * Math.PI * r
  const dash = (Math.max(0, Math.min(100, score)) / 100) * circ
  const tone = TONE[scoreTone(score)]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${label ? label + ': ' : ''}${score} out of 100`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#eef2f6" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={tone.stroke} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
        <text
          x={size / 2} y={size / 2 + 1}
          textAnchor="middle" dominantBaseline="middle"
          fontSize={size * 0.27} fill={tone.text} fontFamily="var(--font-display)"
        >
          {score}
        </text>
      </svg>
      {label && (
        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--slate)', textAlign: 'center', maxWidth: 160, lineHeight: 1.3 }}>
          {label}
        </span>
      )}
    </div>
  )
}
