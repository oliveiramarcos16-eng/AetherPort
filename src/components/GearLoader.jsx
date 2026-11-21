export default function GearLoader({ label = 'Engrenagens girando...' }) {
  return (
    <div className="gear-loader" role="status" aria-live="polite">
      <div className="gear-loader__gears" aria-hidden="true">
        <span className="gear gear--big">⚙</span>
        <span className="gear gear--small">⚙</span>
      </div>
      <p>{label}</p>
    </div>
  )
}
