import { useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import Loading from '../components/Loading'
import { applicationApi, jobApi } from '../services/api'

const statuses = ['NEW', 'SCREENING', 'INTERVIEW', 'PASSED', 'REJECTED']

function statusBadgeClass(status) {
  switch (status) {
    case 'NEW':
      return 'badge bg-secondary'
    case 'SCREENING':
      return 'badge bg-warning text-dark'
    case 'INTERVIEW':
      return 'badge bg-primary'
    case 'PASSED':
      return 'badge bg-success'
    case 'REJECTED':
      return 'badge bg-danger'
    default:
      return 'badge bg-light text-dark'
  }
}

export default function ApplicationsPage() {
  const { user } = useOutletContext()
  const canCreate = ['ADMIN', 'HR'].includes(user.role)
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
      .then((r) => setState({ loading: false, rows: r.data, error: '' }))
      .catch((e) => setState({ loading: false, rows: [], error: e.message }))
  }

  useEffect(() => {
    jobApi
      .list()
      .then((r) => setJobs(r.data || []))
      .catch(() => setJobs([]))

    applicationApi
      .list()
      .then((r) => setState({ loading: false, rows: r.data, error: '' }))
      .catch((e) => setState({ loading: false, rows: [], error: e.message }))
  }, [])

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h1 className="h3 mb-1">Hồ sơ ứng tuyển</h1>
          <p className="text-muted mb-0">Quản lý trạng thái và tiến trình ứng tuyển của ứng viên.</p>
        </div>
        {canCreate && (
          <Link className="btn btn-primary" to="/applications/create">
            + Tạo hồ sơ ứng tuyển
          </Link>
        )}
      </div>

      <form
        className="card card-body shadow-sm border-0 mb-3"
        onSubmit={(e) => {
          e.preventDefault()
          loadApplications()
        }}
      >
        <div className="row g-2">
          <div className="col-md-5">
            <input
              className="form-control"
              value={filters.keyword}
              onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
              placeholder="Tên ứng viên, email hoặc vị trí..."
            />
          </div>
          <div className="col-md-3">
            <select
              className="form-select"
              value={filters.jobId}
              onChange={(e) => setFilters({ ...filters, jobId: e.target.value })}
            >
              <option value="">Tất cả vị trí tuyển dụng</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title} ({job.department})
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-2">
            <select
              className="form-select"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">Tất cả trạng thái</option>
              {statuses.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-2 d-grid">
            <button type="submit" className="btn btn-outline-primary">
              Tìm kiếm
            </button>
          </div>
        </div>
      </form>

      {state.error && <div className="alert alert-danger">{state.error}</div>}

      {state.loading ? (
        <Loading />
      ) : (
        <div className="table-responsive shadow-sm">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>ID</th>
                <th>Ứng viên</th>
                <th>Vị trí ứng tuyển</th>
                <th>Trạng thái</th>
                <th>Ngày ứng tuyển</th>
                <th>Ghi chú</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {state.rows.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center text-muted py-4">
                    Chưa có hồ sơ ứng tuyển nào.
                  </td>
                </tr>
              ) : (
                state.rows.map((app) => (
                  <tr key={app.id}>
                    <td>{app.id}</td>
                    <td>
                      <div className="fw-semibold">{app.candidate_name}</div>
                      <small className="text-muted">{app.candidate_email || '-'}</small>
                    </td>
                    <td>
                      <div>{app.job_title}</div>
                      <small className="text-muted">{app.job_department || '-'}</small>
                    </td>
                    <td>
                      <span className={statusBadgeClass(app.status)}>{app.status}</span>
                    </td>
                    <td>{app.applied_at ? new Date(app.applied_at).toLocaleDateString('vi-VN') : '-'}</td>
                    <td>{app.note || '-'}</td>
                    <td className="text-nowrap">
                      <Link className="btn btn-sm btn-outline-primary" to={`/applications/${app.id}`}>
                        Chi tiết
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
