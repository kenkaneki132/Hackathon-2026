import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'
import { analyzeProfile, DEMO_MODE } from '../utils/api'
import { AUTH_ENABLED } from '../auth'
import StepForm from '../components/StepForm'

const STEPS = [
  {
    id: 'basics',
    short: 'About you',
    title: 'Tell us about yourself',
    subtitle: 'This helps us tailor your risk assessment.',
    fields: [
      { key: 'age', label: 'Your age', type: 'number', placeholder: '32', min: 18, max: 100 },
      { key: 'annual_income', label: 'Annual household income ($)', type: 'number', placeholder: '72000', min: 1, step: 1000 },
      { key: 'monthly_expenses', label: 'Essential monthly expenses ($)', type: 'number', placeholder: '3200', min: 1, step: 50 },
      {
        key: 'employment',
        label: 'Employment status',
        type: 'select',
        options: [
          { value: 'employed', label: 'Full-time employed' },
          { value: 'self_employed', label: 'Self-employed / Freelance' },
          { value: 'unemployed', label: 'Unemployed / Seeking work' },
          { value: 'retired', label: 'Retired' },
        ],
      },
    ],
  },
  {
    id: 'family',
    short: 'Family & home',
    title: 'Family & housing',
    subtitle: 'Your living situation affects your insurance needs significantly.',
    fields: [
      { key: 'dependents', label: 'Number of dependents', type: 'number', placeholder: '0', min: 0, max: 20 },
      {
        key: 'housing_type',
        label: 'Housing situation',
        type: 'select',
        options: [
          { value: 'rent', label: 'I rent an apartment/home' },
          { value: 'own', label: 'I own my home' },
          { value: 'other', label: 'Other (living with family, etc.)' },
        ],
      },
      { key: 'zip_code', label: 'ZIP code (for disaster risk)', type: 'text', inputMode: 'numeric', placeholder: '90210', maxLength: 5 },
    ],
  },
  {
    id: 'savings',
    short: 'Savings',
    title: 'Your current savings',
    subtitle: "Be honest - there's no judgment here.",
    fields: [
      {
        key: 'has_savings',
        label: 'Do you have emergency savings?',
        type: 'select',
        options: [
          { value: 'true', label: 'Yes, I have some savings' },
          { value: 'false', label: 'No emergency savings yet' },
        ],
      },
      { key: 'savings_months', label: 'How many months of expenses could you cover?', type: 'number', placeholder: '2.5', min: 0, max: 24, step: 0.1 },
    ],
  },
]

const DEFAULT_FORM = { age: '', annual_income: '', monthly_expenses: '', employment: '', dependents: '', housing_type: '', zip_code: '', has_savings: '', savings_months: '' }

const FOOTER = DEMO_MODE
  ? 'Demo mode: your answers never leave this browser.'
  : AUTH_ENABLED ? 'Secured by Auth0. Your data stays private.' : 'No account needed. Answers are only used to build your report.'

export default function Onboarding({ setProfile, setResults }) {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(DEFAULT_FORM)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const navigate = useNavigate()
  const { getAccessTokenSilently, isAuthenticated, loginWithRedirect } = useAuth()

  const current = STEPS[step]

  function validate() {
    const errs = {}
    for (const field of current.fields) {
      const val = form[field.key]
      if (!val && val !== 0) errs[field.key] = 'This field is required'
      if (field.key === 'zip_code' && val && !/^\d{5}$/.test(val)) errs[field.key] = 'Enter a valid 5-digit ZIP'
      if (field.key === 'age' && val && (parseInt(val) < 18 || parseInt(val) > 100)) errs[field.key] = 'Enter a valid age (18-100)'
      if (field.key === 'annual_income' && val && Number(val) <= 0) errs[field.key] = 'Enter a valid annual income'
      if (field.key === 'monthly_expenses' && val && Number(val) <= 0) errs[field.key] = 'Enter a valid monthly expense amount'
      if (field.key === 'savings_months' && val && Number(val) < 0) errs[field.key] = 'Savings coverage cannot be negative'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleNext() {
    if (!validate()) return
    if (step < STEPS.length - 1) { setStep(s => s + 1); return }

    if (!isAuthenticated) {
      await loginWithRedirect({ appState: { returnTo: '/onboarding' } })
      return
    }

    setLoading(true)
    setFormError('')
    try {
      const payload = {
        ...form,
        age: parseInt(form.age),
        annual_income: parseFloat(form.annual_income),
        monthly_expenses: parseFloat(form.monthly_expenses),
        dependents: parseInt(form.dependents),
        has_savings: form.has_savings === 'true',
        savings_months: parseFloat(form.savings_months),
      }
      setProfile(payload)
      const getToken = () => getAccessTokenSilently({ authorizationParams: { audience: import.meta.env.VITE_AUTH0_AUDIENCE } })
      const data = await analyzeProfile(payload, getToken)
      setResults(data)
      navigate('/dashboard')
    } catch (e) {
      setFormError('Something went wrong while analyzing your profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <StepForm
      steps={STEPS} step={step} form={form} setForm={setForm} errors={errors} loading={loading}
      onBack={() => { setErrors({}); setStep(s => s - 1) }} onNext={handleNext}
      nextLabel={step === STEPS.length - 1 ? (isAuthenticated ? 'See my results' : 'Sign in to see results') : 'Continue'}
      loadingLabel="Analyzing…" footer={FOOTER} formError={formError}
    />
  )
}
