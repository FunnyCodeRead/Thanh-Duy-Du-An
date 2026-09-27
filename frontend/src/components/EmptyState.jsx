export default function EmptyState({
  icon = 'bi-inbox',
  title = 'Chưa có dữ liệu',
  description = 'Hiện tại chưa có dữ liệu nào trong danh sách.',
  action = null,
}) {
  return (
    <div className="empty-state-box">
      <div className="empty-state-icon">
        <i className={`bi ${icon}`} />
      </div>
      <h6 className="fw-bold mb-1 text-dark" style={{ fontSize: '1rem' }}>
        {title}
      </h6>
      <p className="text-muted small mb-3 mx-auto" style={{ maxWidth: '420px', lineHeight: 1.5 }}>
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  )
}
