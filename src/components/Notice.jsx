export default function Notice({ tone = 'info', title, children }) {
  return (
    <div className={`notice notice--${tone}`} role={tone === 'danger' ? 'alert' : 'status'}>
      {title && <strong className="notice__title">{title}</strong>}
      <div className="notice__body">{children}</div>
    </div>
  )
}
