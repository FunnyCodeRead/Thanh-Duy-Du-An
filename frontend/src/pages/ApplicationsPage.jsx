import { useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import Loading from '../components/Loading'
import { applicationApi, jobApi } from '../services/api'

const STATUS_CONFIG = {
  NEW: { label: 'Mới nhận', badgeClass: 'soft-badge-secondary', icon: 'bi-inbox' },
  SCREENING: { label: 'Sàng lọc hồ sơ', badgeClass: 'soft-badge-info', icon: 'bi-search' },
  INTERVIEW: { label: 'Phỏng vấn', badgeClass: 'soft-badge-purple', icon: 'bi-calendar-event' },
  PASSED: { label: 'Trúng tuyển', badgeClass: 'soft-badge-success', icon: 'bi-check-circle-fill' },
  REJECTED: { label: 'Không đạt', badgeClass: 'soft-badge-danger', icon: 'bi-x-circle-fill' },
}

export default function ApplicationsPage() {
  const { user } = useOutletContext()
  const canCreate = ['ADMIN', 'HR'].includes(user?.role)
  const [filters, setFilters] = useState({ keyword: '', status: '', jobId: '' })
  const [jobs, setJobs] = useState([])
  const [state, setState] = useState({ loading: true, rows: [], error: '' })

  function loadApplications(query = filters) {
    setState((s) => ({ ...s, loading: true, error: '' }))
    const params = new URLSearchParams()
    if (query.keyword) params.set('keyword', query.keyword)
    if (query.status) params.set('status', query.status)
    if (query.jobId) params.set('job_id', query.jobId)

    applicationApi
      .list(params.toString() ? `?${params}` : '')
      .then((r) => setState({ loading: false, rows: r.data || [], error: '' }))
      .catch((e) => setState({ loading: false, rows: [], error: e.message }))
  }

  useEffect(() => {
    jobApi
      .list()
      .then((r) => setJobs(r.data || []))
      .catch(() => setJobs([]))

    loadApplications()
  }, [])

  function handleReset() {
    const emptyFilters = { keyword: '', status: '', jobId: '' }
    setFilters(emptyFilters)
    loadApplications(emptyFilters)
  }

  return (
    <>
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4">
        <div>
          <h1 className="h3 fw-bold mb-1 text-dark">Hồ sơ Ứng tuyển</h1>
          <p className="text-muted mb-0 small">
            Theo dõi ứng viên nộp hồ sơ, quy trình xét duyệt và kết quả tuyển dụng.
          </p>
        </div>
        {canCreate && (
          <Link to="/applications/create" className="btn btn-primary-modern text-decoration-none">
            <i className="bi bi-file-earmark-plus-fill"></i>
            <span>Tạo hồ sơ ứng tuyển</span>
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
            loadApplications()
          }}
        >
          <div className="col-12 col-md-5">
            <div className="input-icon-group">
              <i className="bi bi-search"></i>
              <input
                className="form-control"
                value={filters.keyword}
                onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                placeholder="Tìm tên ứng viên, email hoặc vị trí..."
              />
            </div>
          </div>

          <div className="col-12 col-sm-6 col-md-3">
            <select
              className="form-select"
              value={filters.jobId}
              onChange={(e) => setFilters({ ...filters, jobId: e.target.value })}
              style={{ borderRadius: 'var(--radius-md)' }}
            >
              <option value="">Tất cả vị trí tuyển dụng</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title} ({job.department || 'Chung'})
                </option>
              ))}
            </select>
          </div>

          <div className="col-12 col-sm-6 col-md-2">
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

          <div className="col-12 col-md-2 d-flex gap-2">
            <button type="submit" className="btn btn-primary-modern flex-grow-1 justify-content-center">
              <span>Lọc</span>
            </button>
            {(filters.keyword || filters.status || filters.jobId) && (
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
        <Loading message="Đang tải danh sách hồ sơ ứng tuyển..." />
      ) : (
        <div className="card-modern">
          <div className="card-modern-header">
            <span className="text-secondary small">
              Hiển thị <strong>{state.rows.length}</strong> hồ sơ ứng tuyển
            </span>
          </div>

          {state.rows.length === 0 ? (
            <div className="empty-state-box border-0">
              <div className="empty-state-icon">
                <i className="bi bi-folder2-open"></i>
              </div>
              <h6 className="fw-semibold text-dark">Không tìm thấy hồ sơ ứng tuyển nào</h6>
              <p className="text-muted small mb-3">
                Thử thay đổi điều kiện lọc hoặc liên kết ứng viên với vị trí tuyển dụng mới.
              </p>
              {canCreate && (
                <Link to="/applications/create" className="btn btn-primary-modern btn-sm text-decoration-none">
                  <i className="bi bi-plus-lg"></i>
                  <span>Tạo hồ sơ mới ngay</span>
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
                    <th>Vị trí ứng tuyển</th>
                    <th>Trạng thái hiện tại</th>
                    <th>Ngày nộp</th>
                    <th>Ghi chú</th>
                    <th style={{ width: '110px' }} className="text-end">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {state.rows.map((app) => {
                    const initials = (app.candidate_name || 'U')
                      .split(' ')
                      .filter(Boolean)
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()

                    const conf = STATUS_CONFIG[app.status] || {
                      label: app.status,
                      badgeClass: 'soft-badge-secondary',
                      icon: 'bi-tag',
                    }

                    return (
                      <tr key={app.id}>
                        <td className="text-muted small fw-semibold">#{app.id}</td>
                        <td>
                          <div className="d-flex align-items-center gap-2.5">
                            <div className="table-avatar-initials">{initials}</div>
                            <div>
                              <Link
                                to={`/applications/${app.id}`}
                                className="fw-bold text-dark text-decoration-none hover-primary"
                              >
                                {app.candidate_name}
                              </Link>
                              <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
                                {app.candidate_email || '—'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="fw-semibold text-dark">{app.job_title}</div>
                          <span className="text-muted small" style={{ fontSize: '0.75rem' }}>
                            <i className="bi bi-building me-1"></i>
                            {app.job_department || 'Chung'}
                          </span>
                        </td>
                        <td>
                          <span className={`soft-badge ${conf.badgeClass}`}>
                            <i className={`bi ${conf.icon}`}></i>
                            {app.status}
                          </span>
                        </td>
                        <td>
                          <span className="small text-secondary">
                            {app.applied_at
                              ? new Date(app.applied_at).toLocaleDateString('vi-VN')
                              : '—'}
                          </span>
                        </td>
                        <td>
                          <span className="small text-muted text-truncate d-inline-block" style={{ maxWidth: '180px' }}>
                            {app.note || '—'}
                          </span>
                        </td>
                        <td className="text-end text-nowrap">
                          <Link
                            to={`/applications/${app.id}`}
                            className="btn btn-sm btn-outline-primary rounded-pill px-3 py-1 small d-inline-flex align-items-center gap-1"
                          >
                            <span>Chi tiết</span>
                            <i className="bi bi-chevron-right"></i>
                          </Link>
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
