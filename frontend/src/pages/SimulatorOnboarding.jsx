import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'
import { simulateProfile } from '../utils/api'
import StepForm from '../components/StepForm'
import Icon from '../components/Icon'

const STEPS = [
  {
    id: 'profile',
    short: 'Your life',
    title: 'Tell us about your life context',
    subtitle: 'This helps the simulator reason about stress, resilience, and tradeoffs.',
    fields: [
      { key: 'age', label: 'Your age', type: 'number', placeholder: '29', min: 18, max: 100 },
      {
        key: 'income_range', label: 'Annual household income', type: 'select',
        options: [
          { value: 'under_30k', label: 'Under $30,000' },
          { value: '30k_60k',   label: '$30,000 - $60,000' },
          { value: '60k_100k',  label: '$60,000 - $100,000' },
          { value: 'over_100k', label: 'Over $100,000' },
        ],
      },
      {
        key: 'employment', label: 'Employment status', type: 'select',
        options: [
          { value: 'employed',      label: 'Employed full time' },
          { value: 'self_employed', label: 'Self-employed' },
          { value: 'unemployed',    label: 'Between jobs' },
          { value: 'retired',       label: 'Retired' },
        ],
      },
      { key: 'dependents', label: 'Dependents relying on you', type: 'number', placeholder: '1', min: 0, max: 10 },
    ],
  },
  {
    id: 'decision',
    short: 'The decision',
    title: 'What decision are you considering?',
    subtitle: 'We will simulate its impact across money, stress, risk, and goals.',
    fields: [
      {
        key: 'decision_type', label: 'Decision type', type: 'select',
        options: [
          { value: 'buy_car',    label: '🚗 Buy a car' },
          { value: 'move_city',  label: '🏙️ Move to a new city' },
          { value: 'take_loan',  label: '💳 Take a loan' },
          { value: 'change_job', label: '💼 Change jobs' },
        ],
      },
      { key: 'decision_cost', label: 'Expected monthly cost or income hit ($)', type: 'number', placeholder: '850', min: 100, max: 10000 },
      { key: 'time_horizon',  label: 'Planning horizon (months)',               type: 'number', placeholder: '12',  min: 3,   max: 36 },
      {
        key: 'goal_priority', label: 'Top life goal to protect', type: 'select',
        options: [
          { value: 'emergency_fund',  label: '🛡️ Build emergency fund' },
          { value: 'family_security', label: '👨‍👩‍👧 Support family security' },
          { value: 'homeownership',   label: '🏡 Save for homeownership' },
          { value: 'career_growth',   label: '🚀 Invest in career growth' },
        ],
      },
    ],
  },
  {
    id: 'resilience',
    short: 'Your buffer',
    title: 'How prepared do you feel today?',
    subtitle: 'This helps the AI coach understand your current buffer and stress load.',
    fields: [
      {
        key: 'current_savings', label: 'Emergency savings available today', type: 'select',
        options: [
          { value: '0', label: 'Less than 1 month' },
          { value: '1', label: 'About 1 month' },
          { value: '2', label: 'About 2 months' },
          { value: '3', label: 'About 3 months' },
          { value: '4', label: '4 to 5 months' },
          { value: '6', label: '6 or more months' },
        ],
      },
      {
        key: 'stress_level', label: 'Current financial stress level', type: 'select',
        options: [
          { value: '2', label: '😌 Low and manageable' },
          { value: '5', label: '😐 Moderate and steady' },
          { value: '8', label: '😰 High and tiring' },
        ],
      },
    ],
  },
]

const DEFAULT_FORM = {
  age: '', income_range: '', employment: '', dependents: '',
  decision_type: '', decision_cost: '', time_horizon: '', goal_priority: '',
  current_savings: '', stress_level: '',
}

export default function SimulatorOnboarding({ setSimProfile, setSimResults }) {
  const [step, setStep]       = useState(0)
  const [form, setForm]       = useState(DEFAULT_FORM)
  const [errors, setErrors]   = useState({})
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const navigate = useNavigate()
  const { getAccessTokenSilently, isAuthenticated } = useAuth()

  const current = STEPS[step]

  function validate() {
    const errs = {}
    for (const field of current.fields) {
      const val = form[field.key]
      if (val === '') errs[field.key] = 'This field is required.'
      if (field.key === 'age' && val && (parseInt(val) < 18 || parseInt(val) > 100))
        errs[field.key] = 'Enter an age between 18 and 100.'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleNext() {
    if (!validate()) return
    if (step < STEPS.length - 1) { setStep(s => s + 1); return }

    setLoading(true)
    setFormError('')
    try {
      const payload = {
        ...form,
        age:            parseInt(form.age),
        dependents:     parseInt(form.dependents),
        current_savings:parseInt(form.current_savings),
        stress_level:   parseInt(form.stress_level),
        decision_cost:  parseInt(form.decision_cost),
        time_horizon:   parseInt(form.time_horizon),
      }
      setSimProfile(payload)
      const getToken = isAuthenticated
        ? () => getAccessTokenSilently({ authorizationParams: { audience: import.meta.env.VITE_AUTH0_AUDIENCE } })
        : null
      const data = await simulateProfile(payload, getToken)
      setSimResults(data)
      navigate('/simulator/results')
    } catch {
      setFormError('Something went wrong while running the simulation. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <StepForm
      steps={STEPS} step={step} form={form} setForm={setForm} errors={errors} loading={loading} formError={formError}
      onBack={() => { setErrors({}); setStep(s => s - 1) }} onNext={handleNext}
      nextLabel={step === STEPS.length - 1 ? 'Run simulation' : 'Continue'}
      loadingLabel="Simulating futures…"
      badge={<span className="badge badge-amber"><Icon name="bolt" size={13} /> Life Impact Simulator</span>}
      footer="Private by design. Sign-in is optional for the demo."
    />
  )
}
