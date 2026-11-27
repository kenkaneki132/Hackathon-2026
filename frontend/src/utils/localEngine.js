// In-browser port of backend/main.py's scoring + simulation engine.
// Used when the app runs without a backend (GitHub Pages demo) or when the API is unreachable.
// Parity with the Python implementation is checked by src/utils/localEngine.test.js against
// fixtures exported by backend/scripts/export_engine_fixtures.py.

// ── Python-compatible numeric helpers ─────────────────────────────────────────
// Python's round() uses banker's rounding (half to even); int() truncates toward zero.
export function pyRound(x, nd = 0) {
  const m = 10 ** nd
  const v = x * m
  const f = Math.floor(v)
  const diff = v - f
  let r
  if (diff === 0.5) r = f % 2 === 0 ? f : f + 1   // exact binary tie only, like CPython
  else r = Math.round(v)
  return nd ? r / m : r
}
const pyInt = (x) => Math.trunc(x)
const clamp = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, pyInt(pyRound(v))))
const fmt = (n) => pyRound(n).toLocaleString('en-US')
// str() of a Python float: 2.0 -> '2.0', 2.5 -> '2.5'
export const pyFloatStr = (v) => (Number.isInteger(v) ? v.toFixed(1) : String(v))

// ── Static data (mirrors backend) ─────────────────────────────────────────────
export const FLOOD_RISK_BY_ZIP_PREFIX = { 1: 'low', 2: 'medium', 3: 'high', 4: 'medium', 5: 'low', 6: 'medium', 7: 'high', 8: 'low', 9: 'medium', 0: 'high' }
export const FLOOD_TIPS = {
  low: 'Your area has relatively low flood risk. Basic homeowners/renters insurance should suffice.',
  medium: 'Moderate flood risk. Consider checking FEMA flood maps for your specific address.',
  high: 'Higher flood risk. Standard insurance does NOT cover floods — consider a separate flood policy.',
}
export const INSURANCE_PRODUCTS = {
  renters: { name: 'Renters Insurance', avg_cost: 15, importance: 'high', description: 'Covers your belongings if stolen or damaged. Also covers liability if someone gets hurt in your home.', for_housing: ['rent'] },
  homeowners: { name: 'Homeowners Insurance', avg_cost: 125, importance: 'critical', description: 'Protects your home structure and belongings. Required by most mortgage lenders.', for_housing: ['own'] },
  life: { name: 'Life Insurance', avg_cost: 30, importance: 'high', description: 'Provides income replacement for your family if you pass away. Essential if you have dependents.', for_dependents: true },
  disability: { name: 'Disability Insurance', avg_cost: 50, importance: 'medium', description: 'Replaces 60-70% of your income if you cannot work due to illness or injury.' },
  auto: { name: 'Auto Insurance', avg_cost: 120, importance: 'critical', description: 'Required by law in most states. Covers accidents, theft, and liability.' },
  umbrella: { name: 'Umbrella Insurance', avg_cost: 20, importance: 'low', description: 'Extra liability protection beyond your auto/home policies. Great if you own assets.' },
}
const INCOME_BRACKETS = {
  under_30k: { monthly: 2200, label: 'Under $30,000' },
  '30k_60k': { monthly: 3900, label: '$30,000 - $60,000' },
  '60k_100k': { monthly: 6500, label: '$60,000 - $100,000' },
  over_100k: { monthly: 9800, label: 'Over $100,000' },
}
const EMPLOYMENT_STABILITY = { employed: 1.0, self_employed: 0.82, unemployed: 0.45, retired: 0.72 }
const DECISION_LIBRARY = {
  buy_car: { label: 'Buy a car', baseline_cost: 850, stress_load: 0.55, risk_load: 0.45 },
  move_city: { label: 'Move to a new city', baseline_cost: 1100, stress_load: 0.70, risk_load: 0.58 },
  take_loan: { label: 'Take a loan', baseline_cost: 600, stress_load: 0.50, risk_load: 0.72 },
  change_job: { label: 'Change jobs', baseline_cost: 350, stress_load: 0.62, risk_load: 0.40 },
}
const GOAL_PROFILES = {
  emergency_fund: { label: 'Build emergency fund', target_amount: 12000, monthly_target: 500, description: 'Protect near-term stability and absorb unexpected life events.' },
  family_security: { label: 'Support family security', target_amount: 18000, monthly_target: 650, description: 'Keep more margin for dependents, care needs, and recurring obligations.' },
  homeownership: { label: 'Save for homeownership', target_amount: 35000, monthly_target: 800, description: 'Preserve down-payment momentum and reduce goal delays.' },
  career_growth: { label: 'Invest in career growth', target_amount: 10000, monthly_target: 450, description: 'Keep flexibility for training, relocation, and income mobility.' },
}
const EVENT_LIBRARY = { job_loss: { label: 'Job loss', income_loss_months: 2, extra_cost: 600, stress_hit: 22, risk_hit: 24 } }
const SCENARIO_MODIFIERS = {
  safe: { title: 'Safe choice', decision_factor: 0.80, discretionary_cut: 0.12, buffer_release: 0.00, stress_bonus: 8, risk_bonus: 10 },
  balanced: { title: 'Balanced choice', decision_factor: 1.00, discretionary_cut: 0.05, buffer_release: 0.02, stress_bonus: 0, risk_bonus: 0 },
  risky: { title: 'Risky choice', decision_factor: 1.18, discretionary_cut: 0.00, buffer_release: 0.06, stress_bonus: -10, risk_bonus: -14 },
}

// ── FinGuard profile scoring ─────────────────────────────────────────────────
export const getFloodRisk = (zip) => FLOOD_RISK_BY_ZIP_PREFIX[zip ? zip[0] : ''] || 'medium'

export function insuranceReadiness(p) {
  let score = 75
  if (p.dependents > 0) score -= 8 + 4 * Math.min(p.dependents, 3)
  if (p.housing_type === 'rent') score -= 10
  else if (p.housing_type === 'own') score -= 5
  if (p.employment === 'self_employed' || p.employment === 'unemployed') score -= 12
  if (p.annual_income >= 100000) score += 5
  if (p.has_savings && p.savings_months >= 3) score += 10
  return Math.max(20, Math.min(90, score))
}

export function calculateRiskScores(p) {
  const monthly = p.monthly_expenses
  const targetMonths = p.dependents > 0 ? 6 : 3
  const fundScore = Math.min(100, pyInt((p.savings_months / targetMonths) * 100))
  const gapMonths = Math.max(0, targetMonths - p.savings_months)
  const needed = []
  if (p.housing_type === 'rent') needed.push('renters')
  else if (p.housing_type === 'own') needed.push('homeowners')
  if (p.dependents > 0) needed.push('life')
  needed.push('auto', 'disability')
  const insuranceScore = insuranceReadiness(p)
  const flood = getFloodRisk(p.zip_code)
  const floodScore = { low: 85, medium: 50, high: 20, unknown: 50 }[flood]
  return {
    overall: pyInt(fundScore * 0.4 + insuranceScore * 0.35 + floodScore * 0.25),
    emergency_fund: { score: fundScore, current_months: p.savings_months, target_months: targetMonths, gap_months: gapMonths, gap_amount: pyRound(gapMonths * monthly), monthly_expenses: monthly },
    insurance: { score: insuranceScore, recommended: needed, flood_risk: flood },
    flood: { score: floodScore, risk_level: flood, zip_code: p.zip_code },
  }
}

export function buildActionPlan(p, scores) {
  const monthly = scores.emergency_fund.monthly_expenses
  const gap = scores.emergency_fund.gap_amount
  const ins = []
  if (p.housing_type === 'rent') ins.push('Get a renters insurance quote (avg $15/month) — try State Farm or Lemonade')
  if (p.dependents > 0) ins.push('Research term life insurance — compare quotes on Policygenius.com')
  ins.push('Review your auto insurance — are you getting all discounts you qualify for?')
  return [
    { week: 1, title: 'Know your numbers', priority: 'high', time_estimate: '2 hours', tasks: ['List all monthly expenses (rent, food, utilities, subscriptions)', 'Calculate your take-home pay after taxes', 'Find out what insurance you currently have (check employer benefits)'] },
    { week: 2, title: 'Start your emergency fund', priority: 'high', time_estimate: '30 minutes', tasks: ['Open a high-yield savings account (look for 4%+ APY)', `Set up auto-transfer of $${pyInt(monthly * 0.05)}/month`, 'Set a 90-day goal: save $1,000 as your starter fund'] },
    { week: 3, title: 'Close your insurance gaps', priority: p.dependents > 0 ? 'high' : 'medium', time_estimate: '1-2 hours', tasks: ins },
    { week: 4, title: 'Set up a simple budget', priority: 'medium', time_estimate: '1 hour', tasks: ['Try the 50/30/20 rule: 50% needs, 30% wants, 20% savings', 'Download a free budgeting app (YNAB free trial, or a spreadsheet)', 'If you have debt: target highest interest rate first'] },
    { week: '5-12', title: `Build toward ${scores.emergency_fund.target_months}-month fund`, priority: 'medium', time_estimate: '15 min/week', tasks: [`Keep saving $${pyInt(monthly * 0.1)}/month`, `Goal: reach $${fmt(gap)} in emergency savings`, 'Revisit insurance annually or after life changes', 'Check your budget every 2 weeks'] },
  ]
}

export function getInsuranceRecommendations(p) {
  const recs = []
  for (const [id, product] of Object.entries(INSURANCE_PRODUCTS)) {
    if (product.for_housing && !product.for_housing.includes(p.housing_type)) continue
    if (id === 'life' && p.dependents === 0) continue
    if (id === 'umbrella' && p.annual_income < 60000) continue
    recs.push({ id, ...product })
  }
  return recs
}

export function analyzeProfile(p) {
  const scores = calculateRiskScores(p)
  return {
    scores,
    action_plan: buildActionPlan(p, scores),
    insurance_recommendations: getInsuranceRecommendations(p),
    income_info: { annual_income: pyRound(p.annual_income, 2), monthly_expenses: pyRound(p.monthly_expenses, 2) },
    user: null,
    source: 'local',
  }
}

// ── Life Impact simulator ─────────────────────────────────────────────────────
const sIncome = (p) => (INCOME_BRACKETS[p.income_range] || {}).monthly ?? 4000
function sExpenses(p) {
  const income = sIncome(p)
  const base = income <= 3900 ? 0.55 : income <= 6500 ? 0.5 : 0.46
  const drag = p.employment === 'self_employed' ? 0.04 : p.employment === 'unemployed' ? 0.07 : p.employment === 'retired' ? 0.03 : 0.0
  return income * (base + drag) + p.dependents * 280 + (p.age >= 55 ? 120 : 0)
}
const sSavings = (p) => p.current_savings * sExpenses(p)
const sDiscretionary = (p) => Math.max(0, sIncome(p) - sExpenses(p))
function sDecisionCost(p, sk) {
  const d = DECISION_LIBRARY[p.decision_type], m = SCENARIO_MODIFIERS[sk]
  const base = Math.max(p.decision_cost, d.baseline_cost)
  return (base + p.dependents * 70 + (p.age >= 45 ? 80 : 0)) * m.decision_factor
}
function sGoalCapacity(p, sk) {
  const retained = Math.max(0, sDiscretionary(p) * (1 - SCENARIO_MODIFIERS[sk].discretionary_cut))
  return Math.max(0, retained - sDecisionCost(p, sk))
}
function sSavingsAfter(p, sk) {
  const start = sSavings(p)
  return Math.max(0, start - start * SCENARIO_MODIFIERS[sk].buffer_release + sGoalCapacity(p, sk) * p.time_horizon)
}
const sBufferMonths = (p, sk) => sSavingsAfter(p, sk) / Math.max(sExpenses(p), 1)
function sGoalDelay(p, sk) {
  const g = GOAL_PROFILES[p.goal_priority], current = sSavings(p)
  const baseline = Math.max(1, (g.target_amount - current) / Math.max(g.monthly_target, 1))
  const cap = sGoalCapacity(p, sk)
  const scenario = cap > 0 ? Math.max(1, (g.target_amount - current) / Math.max(cap, 1)) : baseline * 2.5
  return Math.max(0, pyInt(pyRound(scenario - baseline)))
}
const sFinScore = (p, sk) => clamp((sBufferMonths(p, sk) / 6) * 65 + (sGoalCapacity(p, sk) / Math.max(sIncome(p), 1) / 0.2) * 35)
function sStressScore(p, sk) {
  const d = DECISION_LIBRARY[p.decision_type], m = SCENARIO_MODIFIERS[sk]
  const cp = sDecisionCost(p, sk) / Math.max(sIncome(p), 1), buf = sBufferMonths(p, sk)
  return clamp(100 - (p.stress_level * 8 + d.stress_load * 26 + cp * 40 + p.dependents * 3 + Math.max(0, 3 - buf) * 6 - m.stress_bonus))
}
function sRiskScore(p, sk) {
  const d = DECISION_LIBRARY[p.decision_type], m = SCENARIO_MODIFIERS[sk]
  const buf = sBufferMonths(p, sk), ef = EMPLOYMENT_STABILITY[p.employment] ?? 0.75, cp = sDecisionCost(p, sk) / Math.max(sIncome(p), 1)
  return clamp(ef * 32 + (Math.min(buf, 6) / 6) * 38 + (1 - Math.min(cp, 1.2) / 1.2) * 20 + m.risk_bonus - d.risk_load * 10)
}
function sGoalScore(p, sk) {
  const g = GOAL_PROFILES[p.goal_priority]
  const cr = sGoalCapacity(p, sk) / Math.max(g.monthly_target, 1)
  const pr = sSavingsAfter(p, sk) / Math.max(g.target_amount, 1)
  return clamp(55 * Math.min(cr, 1.4) + 25 * Math.min(pr, 1.0) + 20 - sGoalDelay(p, sk) * 4)
}
const sResilience = (p, sk, fin, risk, stress, goal) => clamp(fin * 0.35 + risk * 0.3 + stress * 0.2 + goal * 0.15 + (Math.min(sBufferMonths(p, sk), 6) / 6) * 25)
function sTimeline(p, sk) {
  const months = [...new Set([0, Math.max(1, Math.floor(p.time_horizon / 2)), p.time_horizon])].sort((a, b) => a - b)
  const start = Math.max(0, sSavings(p) * (1 - SCENARIO_MODIFIERS[sk].buffer_release))
  const net = sDiscretionary(p) - sDecisionCost(p, sk)
  return months.map((month) => ({ month, savings: pyRound(Math.max(0, start + net * month)) }))
}

function buildScenario(p, sk) {
  const g = GOAL_PROFILES[p.goal_priority]
  const mi = pyRound(sDecisionCost(p, sk)), fin = sFinScore(p, sk), stress = sStressScore(p, sk)
  const risk = sRiskScore(p, sk), gv = sGoalScore(p, sk), res = sResilience(p, sk, fin, risk, stress, gv)
  const scores = [['financial stability', fin], ['stress control', stress], ['risk protection', risk], [g.label.toLowerCase(), gv]]
  const best = scores.reduce((a, b) => (b[1] > a[1] ? b : a)), worst = scores.reduce((a, b) => (b[1] < a[1] ? b : a))
  const title = SCENARIO_MODIFIERS[sk].title
  return {
    id: sk, title, monthly_impact: mi,
    financial_score: fin, stress_score: stress, risk_score: risk, goal_score: gv, resilience_score: res,
    goal_delay_months: sGoalDelay(p, sk), emergency_months: pyRound(sBufferMonths(p, sk), 2),
    monthly_free_cash_before: pyRound(sDiscretionary(p)), monthly_free_cash_after: pyRound(sGoalCapacity(p, sk)),
    timeline: sTimeline(p, sk),
    summary: `${title} costs $${mi}/mo. Strongest: ${best[0]}. Weakest: ${worst[0]}.`,
  }
}

function simulateShock(p, scenario, ek) {
  const e = EVENT_LIBRARY[ek], income = sIncome(p)
  const hit = income * e.income_loss_months * (1 - (EMPLOYMENT_STABILITY[p.employment] ?? 0.75)) + e.extra_cost
  const shockedBuf = Math.max(0, sSavingsAfter(p, scenario.id) - hit) / Math.max(sExpenses(p), 1)
  const cr = hit / Math.max(income * Math.max(p.time_horizon, 1), 1)
  const sf = clamp(scenario.financial_score - cr * 220 - Math.max(0, 2 - shockedBuf) * 8)
  const ss = clamp(scenario.stress_score - e.stress_hit - Math.max(0, 2 - shockedBuf) * 5)
  const sr = clamp(scenario.risk_score - e.risk_hit - cr * 180)
  const sg = clamp(scenario.goal_score - cr * 150)
  const res = clamp(sf * 0.35 + sr * 0.3 + ss * 0.2 + sg * 0.15)
  const status = res >= 65 ? 'holds' : res >= 45 ? 'under pressure' : 'fails'
  const buf2 = pyRound(shockedBuf, 2)
  return {
    event: e.label, status, financial_score: sf, stress_score: ss, risk_score: sr, goal_score: sg, resilience_score: res,
    cash_hit: pyRound(hit), buffer_after_event_months: buf2,
    insight: `${e.label} removes ~$${fmt(pyRound(hit))}. Leaves ${pyFloatStr(buf2)} months covered — this path ${status}.`,
  }
}

export function simulateProfile(p) {
  const scenarios = ['safe', 'balanced', 'risky'].map((sk) => buildScenario(p, sk))
  const eventResults = scenarios.map((s) => ({ scenario_id: s.id, scenario_title: s.title, shock: simulateShock(p, s, 'job_loss') }))
  const maxBy = (arr, f) => arr.reduce((a, b) => (f(b) > f(a) ? b : a))
  const minBy = (arr, f) => arr.reduce((a, b) => (f(b) < f(a) ? b : a))
  const best = maxBy(scenarios, (s) => s.resilience_score)
  const weakest = minBy(eventResults, (e) => e.shock.resilience_score)
  const goal = GOAL_PROFILES[p.goal_priority]
  const avgRisk = scenarios.reduce((a, s) => a + s.risk_score, 0) / 3
  const balanced = scenarios.find((s) => s.id === 'balanced')
  const emergencyTarget = pyRound(sExpenses(p) * 3)
  const decision = DECISION_LIBRARY[p.decision_type]
  return {
    headline: `${decision.label} works best as the ${best.title.toLowerCase()} because it keeps more monthly free cash and protects your ${goal.label.toLowerCase()} goal better.`,
    decision: { type: p.decision_type, label: decision.label, time_horizon: p.time_horizon },
    goal,
    metrics: {
      life_impact_score: clamp(scenarios.reduce((a, s) => a + s.resilience_score, 0) / 3),
      stress_readiness: clamp(scenarios.reduce((a, s) => a + s.stress_score, 0) / 3),
      risk_exposure: clamp(100 - avgRisk),
      goal_protection: clamp(scenarios.reduce((a, s) => a + s.goal_score, 0) / 3),
    },
    base_math: {
      monthly_income: pyRound(sIncome(p)), essential_expenses: pyRound(sExpenses(p)), starting_savings: pyRound(sSavings(p)),
      free_cash_before_decision: pyRound(sDiscretionary(p)), employment_stability: EMPLOYMENT_STABILITY[p.employment] ?? 0.75,
    },
    scenarios,
    shock_test: { event: 'Job loss', results: eventResults, weakest_path: weakest },
    coach_nudges: [
      { title: 'Strongest scenario', message: `${best.title} is strongest — $${fmt(best.monthly_free_cash_after)} free/month and ${pyFloatStr(best.emergency_months)} months of essentials covered.` },
      { title: 'Stress driver', message: `Your stress level is ${p.stress_level}/10. Any path above $${fmt(balanced.monthly_impact)}/month pushes the stress score down faster.` },
      { title: 'Shock warning', message: `Under ${weakest.shock.event.toLowerCase()}, the weakest path falls to ${pyFloatStr(weakest.shock.buffer_after_event_months)} months of coverage. That is the break point to watch.` },
    ],
    action_plan: [
      { week: 'Week 1', title: 'Lock in the real monthly math', priority: 'high', time_estimate: '45 min', tasks: [`Your estimated monthly income is $${fmt(sIncome(p))} and essentials are ~$${fmt(sExpenses(p))}.`, `Keep the decision at or below $${fmt(best.monthly_impact)}/month to protect cash flow.`, 'Write down the fixed monthly cost before committing, including hidden fees.'] },
      { week: 'Week 2', title: 'Protect your buffer', priority: 'high', time_estimate: '30 min', tasks: [`Build toward at least $${fmt(emergencyTarget)} (3 months of essentials).`, `Your weakest event is ${weakest.shock.event.toLowerCase()}, creating a cash shock of $${fmt(weakest.shock.cash_hit)}.`, 'Delay optional upgrades until the buffer can absorb that shock.'] },
      { week: 'Week 3', title: 'Protect the goal contribution', priority: 'medium', time_estimate: '1 hour', tasks: [`The strongest path keeps $${fmt(best.monthly_free_cash_after)}/month after the decision.`, 'Automate that amount toward your main goal before increasing discretionary spending.', 'If free cash drops below zero, step down to the safer version.'] },
      { week: 'Week 4', title: 'Review leading indicators', priority: 'medium', time_estimate: '20 min/week', tasks: ['Track four numbers weekly: savings balance, monthly free cash, stress level, and goal contribution.', `If resilience falls under ${Math.max(40, best.resilience_score - 10)}, pause the risky path.`, 'Rerun the simulator after any income or expense change.'] },
    ],
    source: 'local',
  }
}

// ── Offline coach (rule-based; mirrors backend fallback_chat) ─────────────────
const TOPICS = [
  [['emergency', 'fund', 'savings', 'save'], '**Emergency Fund Basics**\n\nAim for 3-6 months of expenses in a high-yield savings account. Start with a $1,000 goal — it covers many common emergencies.\n\n- Automate a transfer on payday\n- Keep it separate from checking\n- Only use it for true emergencies'],
  [['renters', 'renter', 'apartment'], '**Renters Insurance** costs about $15/month and covers your belongings, liability, and temporary housing if your place becomes unlivable.'],
  [['life insurance', 'life', 'term'], '**Life Insurance** is essential if you have dependents. Term life is cheapest — a common rule of thumb is 10-12x your annual income in coverage.'],
  [['50/30/20', 'budget', 'budgeting'], '**The 50/30/20 rule**\n\n- **50%** of take-home pay → needs (rent, groceries, utilities)\n- **30%** → wants\n- **20%** → savings and extra debt payments\n\nTrack one month of spending first, then adjust.'],
  [['disability'], '**Disability Insurance** replaces roughly 60-70% of your income if illness or injury stops you from working. Check whether your employer already offers short- or long-term coverage.'],
  [['flood', 'fema', 'disaster', 'hurricane'], '**Flood coverage** is not included in standard homeowners or renters policies. Look up your address on FEMA flood maps and ask about a separate flood policy if you are in a moderate or high risk zone.'],
  [['debt', 'credit card', 'loan'], '**Paying down debt**\n\n- List debts by interest rate\n- Pay minimums on all, extra on the highest rate (avalanche)\n- Or smallest balance first (snowball) if you need quick wins'],
]
export function fallbackChat(message) {
  const msg = message.toLowerCase()
  for (const [words, answer] of TOPICS) if (words.some((w) => msg.includes(w))) return answer
  return 'I can help with **emergency funds**, **insurance basics**, **budgeting**, **debt**, and **disaster preparedness**. What would you like to know?'
}
