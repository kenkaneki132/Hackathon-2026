import Icon from './Icon'

export default function CardHead({ icon, tone = '', title, sub, as: H = 'h3', right }) {
  return (
    <div className="card-head">
      {icon && <span className={`icon-tile ${tone}`}><Icon name={icon} size={20} /></span>}
      <div style={{ minWidth: 0, flex: 1 }}>
        <H>{title}</H>
        {sub && <p>{sub}</p>}
      </div>
      {right}
    </div>
  )
}
