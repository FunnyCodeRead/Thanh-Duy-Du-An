import { useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import Loading from '../components/Loading'
import { interviewApi } from '../services/api'

const statuses = ['SCHEDULED', 'COMPLETED', 'CANCELLED']

function statusBadgeClass(status) {
  switch (status) {
    case 'SCHEDULED':
      return 'badge bg-primary'
    case 'COMPLETED':
      return 'badge bg-success'
    case 'CANCELLED':
      return 'badge bg-secondary'
    default:
      return 'badge bg-light text-dark'
  }
}

function statusLabel(status) {
  switch (status) {
    case 'SCHEDULED':
      return 'Đã lên lịch'
    case 'COMPLETED':
      return 'Đã hoàn thành'
    case 'CANCELLED':
      return 'Đã hủy'
    default:
      return status
  }
}

export default function InterviewsPage() {
  const { user } = useOutletContext()
  const canSchedule = ['ADMIN', 'HR'].includes(user.role)
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
    interviewApi
      .list()
      .then((r) => setState({ loading: false, rows: r.data || [], error: '' }))
      .catch((e) => setState({ loading: false, rows: [], error: e.message }))
  }, [])

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h1 className="h3 mb-1">Lịch phỏng vấn</h1>
          <p className="text-muted mb-0">Quản lý và theo dõi các buổi phỏng vấn ứng viên.</p>
        </div>
        {canSchedule && (
          <Link className="btn btn-primary" to="/interviews/create">
            + Lên lịch phỏng vấn
          </Link>
        )}
      </div>

      <form
        className="card card-body shadow-sm border-0 mb-3"
        onSubmit={(e) => {
          e.preventDefault()
          loadInterviews()
        }}
      >
        <div className="row g-2">
          <div className="col-md-7">
            <input
              className="form-control"
              value={filters.keyword}
              onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
              placeholder="Tìm theo tên ứng viên, vị trí, người PV hoặc địa điểm..."
            />
          </div>
          <div className="col-md-3">
            <select
              className="form-select"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">Tất cả trạng thái</option>
              {statuses.map((st) => (
                <option key={st} value={st}>
                  {st} ({statusLabel(st)})
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-2 d-flex gap-2">
            <button className="btn btn-outline-secondary w-100" type="submit">
              Lọc
            </button>
            <button
              className="btn btn-link text-decoration-none"
              type="button"
              onClick={() => {
                const reset = { keyword: '', status: '' }
                setFilters(reset)
                loadInterviews(reset)
              }}
            >
              Xóa
            </button>
          </div>
        </div>
      </form>

      {state.loading && <Loading />}
      {state.error && <div className="alert alert-danger">{state.error}</div>}

      {!state.loading && !state.error && (
        <div className="card shadow-sm border-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{ width: '60px' }}>#</th>
                  <th>Ứng viên</th>
                  <th>Vị trí ứng tuyển</th>
                  <th>Người phỏng vấn</th>
                  <th>Thời gian</th>
                  <th>Địa điểm / Link</th>
                  <th>Trạng thái</th>
                  <th className="text-end" style={{ width: '160px' }}>
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {state.rows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-4 text-muted">
                      Chưa có lịch phỏng vấn nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  state.rows.map((item) => (
                    <tr key={item.id}>
                      <td className="fw-semibold">#{item.id}</td>
                      <td>
                        <div className="fw-semibold">{item.candidate_name || `Ứng viên #${item.application_id}`}</div>
                        <div className="small text-muted">{item.candidate_email}</div>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border">
                          {item.job_title || '-'}
                        </span>
                      </td>
                      <td>
                        <div>{item.interviewer_name || '-'}</div>
                        <div className="small text-muted">{item.interviewer_email}</div>
                      </td>
                      <td>
                        {item.interview_date
                          ? new Date(item.interview_date).toLocaleString('vi-VN', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })
                          : '-'}
                      </td>
                      <td>{item.location || '-'}</td>
                      <td>
                        <span className={statusBadgeClass(item.status)}>
                          {item.status}
                        </span>
                      </td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          <Link className="btn btn-outline-primary" to={`/interviews/${item.id}`}>
                            Chi tiết
                          </Link>
                          {canSchedule && item.status === 'SCHEDULED' && (
                            <Link className="btn btn-outline-secondary" to={`/interviews/${item.id}/edit`}>
                              Sửa
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}
