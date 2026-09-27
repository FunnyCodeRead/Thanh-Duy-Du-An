export default function PageHeader({ title, description, action, badge, children }) {
  return (
    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
      <div>
        <div className="d-flex align-items-center gap-2 mb-1">
          <h1
            className="fw-bold mb-0 text-dark"
            style={{ fontSize: '1.65rem', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}
          >
            {title}
          </h1>
          {badge}
        </div>
        {description && (
          <p className="mb-0" style={{ fontSize: '0.915rem', color: 'var(--text-muted)' }}>
            {description}
          </p>
        )}
      </div>

      {(action || children) && (
        <div className="d-flex align-items-center gap-2.5 flex-wrap flex-shrink-0">
          {action}
          {children}
        </div>
      )}
    </div>
  )
}
