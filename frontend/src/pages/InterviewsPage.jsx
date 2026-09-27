import { useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import Loading from '../components/Loading'
import PageHeader from '../components/PageHeader'
import StatusBadge from '../components/StatusBadge'
import EmptyState from '../components/EmptyState'
import Pagination from '../components/Pagination'
import { interviewApi } from '../services/api'

const STATUS_OPTIONS = [
  { value: 'SCHEDULED', label: 'Đã lên lịch' },
  { value: 'COMPLETED', label: 'Đã hoàn thành' },
  { value: 'CANCELLED', label: 'Đã hủy' },
]

export default function InterviewsPage() {
  const { user } = useOutletContext()
  const canSchedule = ['ADMIN', 'HR'].includes(user?.role)
  const [filters, setFilters] = useState({ keyword: '', status: '' })
  const [state, setState] = useState({ loading: true, rows: [], error: '' })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

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

  const totalItems = state.rows.length
  const paginatedInterviews = state.rows.slice((page - 1) * pageSize, page * pageSize)

  return (
    <>
      <PageHeader
        title="Lịch Phỏng vấn"
        description="Theo dõi kế hoạch phỏng vấn, phân công người phỏng vấn và trạng thái buổi gặp."
        action={
          canSchedule && (
            <Link to="/interviews/create" className="btn btn-primary-modern text-decoration-none">
              <i className="bi bi-plus-lg" />
              <span>Lên lịch phỏng vấn</span>
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
            setPage(1)
            loadInterviews()
          }}
        >
          <div className="col-12 col-md-7">
            <div className="input-icon-group">
              <i className="bi bi-search" />
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
            >
              <option value="">Tất cả trạng thái</option>
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="col-12 col-sm-6 col-md-2 d-flex gap-2">
            <button type="submit" className="btn btn-filter-submit flex-grow-1 justify-content-center">
              <i className="bi bi-funnel-fill" />
              <span>Lọc</span>
            </button>
            {(filters.keyword || filters.status) && (
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
        <Loading message="Đang tải lịch phỏng vấn..." />
      ) : (
        <div className="card-modern">
          <div className="card-modern-header">
            <span className="text-muted small">
              Hiển thị <strong>{state.rows.length}</strong> buổi phỏng vấn
            </span>
          </div>

          {state.rows.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon="bi-calendar-x"
                title="Chưa có lịch phỏng vấn nào"
                description="Lên kế hoạch buổi phỏng vấn đầu tiên để phối hợp với hội đồng tuyển dụng."
                action={
                  canSchedule && (
                    <Link to="/interviews/create" className="btn btn-primary-modern btn-sm text-decoration-none">
                      <i className="bi bi-plus-lg" />
                      <span>Lên lịch phỏng vấn</span>
                    </Link>
                  )
                }
              />
            </div>
          ) : (
            <>
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
                    <th style={{ width: '150px' }} className="text-end">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedInterviews.map((item) => {
                    const initials = (item.candidate_name || 'U')
                      .split(' ')
                      .filter(Boolean)
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()

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
                          <span className="small fw-semibold" style={{ color: 'var(--primary)' }}>
                            <i className="bi bi-calendar2-event me-1.5" />
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
                            <i className="bi bi-geo-alt me-1 text-danger" />
                            {item.location || 'Chưa cập nhật'}
                          </span>
                        </td>
                        <td>
                          <StatusBadge status={item.status} />
                        </td>
                        <td className="text-end text-nowrap">
                          <Link
                            to={`/interviews/${item.id}`}
                            className="btn btn-table-action me-1 text-decoration-none"
                          >
                            <i className="bi bi-eye" />
                            <span>Xem chi tiết</span>
                          </Link>
                          {canSchedule && item.status === 'SCHEDULED' && (
                            <Link
                              to={`/interviews/${item.id}/edit`}
                              className="btn btn-table-edit text-decoration-none"
                              title="Chỉnh sửa lịch phỏng vấn"
                            >
                              <i className="bi bi-pencil" />
                            </Link>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={page}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={(sz) => {
                setPageSize(sz)
                setPage(1)
              }}
            />
          </>
          )}
        </div>
      )}
    </>
  )
}
