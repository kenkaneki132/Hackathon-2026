import Icon from './Icon'

// Shared multi-step questionnaire used by the assessment and the simulator.
export default function StepForm({
  steps, step, form, setForm, errors, onBack, onNext, loading, nextLabel, loadingLabel, badge, footer, formError,
}) {
  const current = steps[step]
  const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }))

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2.5rem 1rem' }}>
      <div style={{ width: '100%', maxWidth: 540 }}>
        {badge && <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>{badge}</div>}

        <ol className="steps" aria-label={`Step ${step + 1} of ${steps.length}`}>
          {steps.map((s, i) => (
            <li key={s.id} className={i < step ? 'done' : i === step ? 'current' : ''} aria-current={i === step ? 'step' : undefined}>
              <span className="bar" />
              <span className="name">{i + 1}. {s.short || s.title}</span>
            </li>
          ))}
        </ol>

        <form
          key={current.id}
          className="card fade-up"
          style={{ padding: 'clamp(1.5rem, 5vw, 2.5rem)' }}
          onSubmit={e => { e.preventDefault(); onNext() }}
          noValidate
        >
          <h2 style={{ marginBottom: '0.4rem' }}>{current.title}</h2>
          <p style={{ marginBottom: '1.75rem', fontSize: '0.92rem' }}>{current.subtitle}</p>

          <div style={{ display: 'grid', gap: '1.15rem' }}>
            {current.fields.map(field => {
              const id = `f-${field.key}`
              const err = errors[field.key]
              const common = {
                id, className: 'input', value: form[field.key], onChange: set(field.key),
                'aria-invalid': err ? 'true' : undefined, 'aria-describedby': err ? `${id}-err` : undefined,
              }
              return (
                <div key={field.key} className="field">
                  <label htmlFor={id}>{field.label}</label>
                  {field.type === 'select' ? (
                    <select {...common}>
                      <option value="">Select an option…</option>
                      {field.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  ) : (
                    <input
                      {...common} type={field.type} inputMode={field.type === 'number' ? 'decimal' : field.inputMode}
                      placeholder={field.placeholder} min={field.min} max={field.max} maxLength={field.maxLength} step={field.step}
                    />
                  )}
                  {err && <p id={`${id}-err`} className="field-error"><Icon name="alert" size={14} />{err}</p>}
                </div>
              )
            })}
          </div>

          {formError && (
            <div className="callout callout-red" role="alert" style={{ marginTop: '1.25rem' }}>
              <Icon name="alert" size={16} style={{ marginTop: 2 }} /><p>{formError}</p>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: '2rem' }}>
            {step > 0 && (
              <button type="button" className="btn btn-quiet btn-square" style={{ flex: 1 }} onClick={onBack}>
                <Icon name="arrowLeft" size={16} /> Back
              </button>
            )}
            <button type="submit" className="btn btn-primary btn-square" style={{ flex: 2 }} disabled={loading}>
              {loading ? loadingLabel : <>{nextLabel} <Icon name="arrowRight" size={16} /></>}
            </button>
          </div>
        </form>

        {footer && (
          <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: '0.78rem', marginTop: '1rem' }}>
            <Icon name="lock" size={14} /> {footer}
          </p>
        )}
      </div>
    </div>
  )
}
