import { useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import Loading from '../components/Loading'
import PageHeader from '../components/PageHeader'
import StatusBadge from '../components/StatusBadge'
import EmptyState from '../components/EmptyState'
import { applicationApi, jobApi } from '../services/api'

const STATUS_OPTIONS = [
  { value: 'NEW', label: 'Mới nhận' },
  { value: 'SCREENING', label: 'Sàng lọc hồ sơ' },
  { value: 'INTERVIEW', label: 'Phỏng vấn' },
  { value: 'PASSED', label: 'Trúng tuyển' },
  { value: 'REJECTED', label: 'Không đạt' },
]

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
      <PageHeader
        title="Hồ sơ Ứng tuyển"
        description="Theo dõi tiến trình xét duyệt hồ sơ ứng viên qua các giai đoạn tuyển dụng."
        action={
          canCreate && (
            <Link to="/applications/create" className="btn btn-primary-modern text-decoration-none">
              <i className="bi bi-plus-lg" />
              <span>Tạo hồ sơ ứng tuyển</span>
            </Link>
          )
        }
      />

      {state.error && (
        <div className="alert alert-danger d-flex align-items-center gap-2 rounded-3 mb-3">
          <i className="bi bi-exclamation-circle-fill" />
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
              <i className="bi bi-search" />
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
            >
              <option value="">Tất cả trạng thái</option>
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="col-12 col-md-2 d-flex gap-2">
            <button type="submit" className="btn btn-filter-submit flex-grow-1 justify-content-center">
              <i className="bi bi-funnel-fill" />
              <span>Lọc</span>
            </button>
            {(filters.keyword || filters.status || filters.jobId) && (
              <button
                type="button"
                className="btn btn-link text-muted p-2 text-decoration-none small flex-shrink-0"
                onClick={handleReset}
                title="Xóa bộ lọc"
              >
                <i className="bi bi-x-circle fs-6" />
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
            <span className="text-muted small">
              Hiển thị <strong>{state.rows.length}</strong> hồ sơ ứng tuyển
            </span>
          </div>

          {state.rows.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon="bi-file-earmark-person"
                title="Chưa có hồ sơ ứng tuyển nào"
                description="Tạo hồ sơ ứng tuyển đầu tiên để bắt đầu theo dõi tiến trình tuyển dụng ứng viên."
                action={
                  canCreate && (
                    <Link to="/applications/create" className="btn btn-primary-modern btn-sm text-decoration-none">
                      <i className="bi bi-plus-lg" />
                      <span>Tạo hồ sơ ứng tuyển</span>
                    </Link>
                  )
                }
              />
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
                    <th style={{ width: '130px' }} className="text-end">
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

                    return (
                      <tr key={app.id}>
                        <td className="text-muted small fw-semibold">#{app.id}</td>
                        <td>
                          <div className="d-flex align-items-center gap-2.5">
                            <div className="table-avatar-initials">{initials}</div>
                            <div>
                              <Link
                                to={`/applications/${app.id}`}
                                className="fw-bold text-dark text-decoration-none"
                                style={{ transition: 'color 0.15s ease' }}
                                onMouseEnter={(e) => (e.target.style.color = 'var(--primary)')}
                                onMouseLeave={(e) => (e.target.style.color = 'var(--text-primary)')}
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
                            <i className="bi bi-building me-1" />
                            {app.job_department || 'Chung'}
                          </span>
                        </td>
                        <td>
                          <StatusBadge status={app.status} />
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
                            className="btn btn-table-action text-decoration-none"
                          >
                            <i className="bi bi-eye" />
                            <span>Xem chi tiết</span>
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
