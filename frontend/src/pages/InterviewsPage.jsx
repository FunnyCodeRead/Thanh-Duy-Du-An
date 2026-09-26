import { useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import Loading from '../components/Loading'
import { interviewApi } from '../services/api'

const STATUS_CONFIG = {
  SCHEDULED: { label: 'Đã lên lịch', badgeClass: 'soft-badge-primary', icon: 'bi-clock-fill' },
  COMPLETED: { label: 'Đã hoàn thành', badgeClass: 'soft-badge-success', icon: 'bi-check-circle-fill' },
  CANCELLED: { label: 'Đã hủy', badgeClass: 'soft-badge-secondary', icon: 'bi-x-circle' },
}

export default function InterviewsPage() {
  const { user } = useOutletContext()
  const canSchedule = ['ADMIN', 'HR'].includes(user?.role)
  const [filters, setFilters] = useState({ keyword: '', status: '' })
  const [state, setState] = useState({ loading: true, rows: [], error: '' })

  function loadInterviews(query = filters) {
    setState((s) => ({ ...s, loading: true, error: '' }))
    const params = new URLSearchParams()
    if (query.keyword) params.set('keyword', query.keyword)
    if (query.status) params.set('status', query.status)

    interviewApi
      .list(params.toString() ? `?${params}` : '')
      .then((r) => setState({ loading: false, rows: r.data || [], error: '' }))
      .catch((e) => setState({ loading: false, rows: [], error: e.message }))
  }

  useEffect(() => {
    loadInterviews()
  }, [])

  function handleReset() {
    const emptyFilters = { keyword: '', status: '' }
    setFilters(emptyFilters)
    loadInterviews(emptyFilters)
  }

  return (
    <>
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4">
        <div>
          <h1 className="h3 fw-bold mb-1 text-dark">Lịch Phỏng vấn</h1>
          <p className="text-muted mb-0 small">
            Theo dõi kế hoạch phỏng vấn, phân công người phỏng vấn và trạng thái buổi gặp.
          </p>
        </div>
        {canSchedule && (
          <Link to="/interviews/create" className="btn btn-primary-modern text-decoration-none">
            <i className="bi bi-calendar-plus-fill"></i>
            <span>Lên lịch phỏng vấn</span>
          </Link>
        )}
      </div>

      {state.error && (
        <div className="alert alert-danger d-flex align-items-center gap-2 rounded-3 mb-3">
          <i className="bi bi-exclamation-circle-fill"></i>
          <div>{state.error}</div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="filter-bar-card">
        <form
          className="row g-2 align-items-center"
          onSubmit={(e) => {
            e.preventDefault()
            loadInterviews()
          }}
        >
          <div className="col-12 col-md-7">
            <div className="input-icon-group">
              <i className="bi bi-search"></i>
              <input
                className="form-control"
                value={filters.keyword}
                onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                placeholder="Tìm tên ứng viên, vị trí, người phỏng vấn hoặc địa điểm..."
              />
            </div>
          </div>

          <div className="col-12 col-sm-6 col-md-3">
            <select
              className="form-select"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              style={{ borderRadius: 'var(--radius-md)' }}
            >
              <option value="">Tất cả trạng thái</option>
              {Object.entries(STATUS_CONFIG).map(([stKey, conf]) => (
                <option key={stKey} value={stKey}>
                  {conf.label}
                </option>
              ))}
            </select>
          </div>

          <div className="col-12 col-sm-6 col-md-2 d-flex gap-2">
            <button type="submit" className="btn btn-primary-modern flex-grow-1 justify-content-center">
              <span>Lọc</span>
            </button>
            {(filters.keyword || filters.status) && (
              <button
                type="button"
                className="btn btn-secondary-modern px-2.5"
                onClick={handleReset}
                title="Đặt lại bộ lọc"
              >
                <i className="bi bi-arrow-counterclockwise"></i>
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Results Table */}
      {state.loading ? (
        <Loading message="Đang tải lịch phỏng vấn..." />
      ) : (
        <div className="card-modern">
          <div className="card-modern-header">
            <span className="text-secondary small">
              Hiển thị <strong>{state.rows.length}</strong> buổi phỏng vấn
            </span>
          </div>

          {state.rows.length === 0 ? (
            <div className="empty-state-box border-0">
              <div className="empty-state-icon">
                <i className="bi bi-calendar-x"></i>
              </div>
              <h6 className="fw-semibold text-dark">Chưa có lịch phỏng vấn phù hợp</h6>
              <p className="text-muted small mb-3">
                Thử thay đổi điều kiện lọc hoặc lên lịch phỏng vấn mới cho ứng viên.
              </p>
              {canSchedule && (
                <Link to="/interviews/create" className="btn btn-primary-modern btn-sm text-decoration-none">
                  <i className="bi bi-plus-lg"></i>
                  <span>Lên lịch ngay</span>
                </Link>
              )}
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table-modern">
                <thead>
                  <tr>
                    <th style={{ width: '70px' }}>#ID</th>
                    <th>Ứng viên</th>
                    <th>Vị trí</th>
                    <th>Người phỏng vấn</th>
                    <th>Thời gian phỏng vấn</th>
                    <th>Địa điểm / Link họp</th>
                    <th>Trạng thái</th>
                    <th style={{ width: '130px' }} className="text-end">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {state.rows.map((item) => {
                    const initials = (item.candidate_name || 'U')
                      .split(' ')
                      .filter(Boolean)
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()

                    const conf = STATUS_CONFIG[item.status] || {
                      label: item.status,
                      badgeClass: 'soft-badge-secondary',
                      icon: 'bi-tag',
                    }

                    return (
                      <tr key={item.id}>
                        <td className="text-muted small fw-semibold">#{item.id}</td>
                        <td>
                          <div className="d-flex align-items-center gap-2.5">
                            <div className="table-avatar-initials">{initials}</div>
                            <div>
                              <div className="fw-bold text-dark">
                                {item.candidate_name || `Ứng viên #${item.application_id}`}
                              </div>
                              <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
                                {item.candidate_email || '—'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="soft-badge soft-badge-secondary">
                            {item.job_title || '—'}
                          </span>
                        </td>
                        <td>
                          <div className="small fw-semibold text-dark">{item.interviewer_name || '—'}</div>
                          <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
                            {item.interviewer_email}
                          </div>
                        </td>
                        <td>
                          <span className="text-primary fw-semibold small">
                            <i className="bi bi-calendar2-event me-1"></i>
                            {item.interview_date
                              ? new Date(item.interview_date).toLocaleString('vi-VN', {
                                  dateStyle: 'short',
                                  timeStyle: 'short',
                                })
                              : '—'}
                          </span>
                        </td>
                        <td>
                          <span className="small text-secondary">
                            <i className="bi bi-geo-alt me-1 text-danger"></i>
                            {item.location || 'Chưa cập nhật'}
                          </span>
                        </td>
                        <td>
                          <span className={`soft-badge ${conf.badgeClass}`}>
                            <i className={`bi ${conf.icon}`}></i>
                            {conf.label}
                          </span>
                        </td>
                        <td className="text-end text-nowrap">
                          <Link
                            to={`/interviews/${item.id}`}
                            className="btn btn-sm btn-outline-primary rounded-pill px-2.5 py-0.5 me-1 small"
                            title="Chi tiết phỏng vấn"
                          >
                            <i className="bi bi-eye"></i>
                          </Link>
                          {canSchedule && item.status === 'SCHEDULED' && (
                            <Link
                              to={`/interviews/${item.id}/edit`}
                              className="btn btn-sm btn-outline-secondary rounded-pill px-2.5 py-0.5 small"
                              title="Chỉnh sửa lịch"
                            >
                              <i className="bi bi-pencil"></i>
                            </Link>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </>
  )
}
