import { STATUS } from '../lib/constants'

export default function StatusBadge({ status }) {
  const info = STATUS[status] || { label: status, tone: 'wait', icon: '•' }
  return (
    <span className={`badge badge--${info.tone}`}>
      <span aria-hidden="true">{info.icon}</span> {info.label}
    </span>
  )
}
