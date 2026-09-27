const STATUS_MAP = {
  // Application
  NEW: { label: 'Mới nhận', cls: 'soft-badge-secondary', icon: 'bi-inbox' },
  SCREENING: { label: 'Sàng lọc CV', cls: 'soft-badge-primary', icon: 'bi-search' },
  INTERVIEW: { label: 'Phỏng vấn', cls: 'soft-badge-primary', icon: 'bi-calendar-event' },
  PASSED: { label: 'Trúng tuyển', cls: 'soft-badge-success', icon: 'bi-check-circle-fill' },
  REJECTED: { label: 'Không đạt', cls: 'soft-badge-danger', icon: 'bi-x-circle-fill' },

  // Job
  OPEN: { label: 'Đang mở tuyển', cls: 'soft-badge-success', icon: 'bi-check-circle-fill' },
  CLOSED: { label: 'Đã đóng tuyển', cls: 'soft-badge-secondary', icon: 'bi-dash-circle' },

  // Interview
  SCHEDULED: { label: 'Đã lên lịch', cls: 'soft-badge-primary', icon: 'bi-calendar-check' },
  COMPLETED: { label: 'Đã hoàn thành', cls: 'soft-badge-success', icon: 'bi-check-circle-fill' },
  CANCELLED: { label: 'Đã hủy', cls: 'soft-badge-danger', icon: 'bi-x-circle-fill' },
}

export default function StatusBadge({ status, className = '' }) {
  const cfg = STATUS_MAP[status] || {
    label: status || '—',
    cls: 'soft-badge-secondary',
    icon: 'bi-circle',
  }

  return (
    <span className={`soft-badge ${cfg.cls} ${className}`}>
      <i className={`bi ${cfg.icon}`} style={{ fontSize: '0.75rem' }} />
      <span>{cfg.label}</span>
    </span>
  )
}
