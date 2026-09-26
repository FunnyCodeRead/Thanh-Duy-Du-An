import { useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import Loading from '../components/Loading'
import { jobApi } from '../services/api'

export default function JobsPage() {
  const { user } = useOutletContext()
  const canEdit = ['ADMIN', 'HR'].includes(user?.role)
  const [filters, setFilters] = useState({ keyword: '', status: '' })
  const [state, setState] = useState({ loading: true, rows: [], error: '' })

  function loadJobs(query = filters) {
    setState((current) => ({ ...current, loading: true, error: '' }))
    const params = new URLSearchParams()
    if (query.keyword) params.set('keyword', query.keyword)
    if (query.status) params.set('status', query.status)
    const suffix = params.toString() ? `?${params}` : ''

    jobApi
      .list(suffix)
      .then((result) => setState({ loading: false, rows: result.data || [], error: '' }))
      .catch((error) => setState({ loading: false, rows: [], error: error.message }))
  }

  useEffect(() => {
    loadJobs()
  }, [])

  function handleReset() {
    const emptyFilters = { keyword: '', status: '' }
    setFilters(emptyFilters)
    loadJobs(emptyFilters)
  }

  async function remove(id) {
    if (!window.confirm('Bạn có chắc chắn muốn xóa vị trí tuyển dụng này?')) return
    try {
      await jobApi.remove(id)
      loadJobs()
    } catch (error) {
      setState((current) => ({ ...current, error: error.message }))
    }
  }

  return (
    <>
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4">
        <div>
          <h1 className="h3 fw-bold mb-1 text-dark">Vị trí Tuyển dụng</h1>
          <p className="text-muted mb-0 small">
            Quản lý danh sách các cơ hội việc làm, yêu cầu kỹ năng và chỉ tiêu tuyển dụng.
          </p>
        </div>
        {canEdit && (
          <Link to="/jobs/create" className="btn btn-primary-modern text-decoration-none">
            <i className="bi bi-plus-lg"></i>
            <span>Thêm vị trí mới</span>
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
            loadJobs()
          }}
        >
          <div className="col-12 col-md-6 col-lg-7">
            <div className="input-icon-group">
              <i className="bi bi-search"></i>
              <input
                className="form-control"
                value={filters.keyword}
                onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                placeholder="Tìm theo tên vị trí, phòng ban hoặc kỹ năng..."
              />
            </div>
          </div>

          <div className="col-12 col-sm-6 col-md-3 col-lg-3">
            <select
              className="form-select"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              style={{ borderRadius: 'var(--radius-md)' }}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="OPEN">Đang mở tuyển</option>
              <option value="CLOSED">Đã đóng tuyển</option>
            </select>
          </div>

          <div className="col-12 col-sm-6 col-md-3 col-lg-2 d-flex gap-2">
            <button type="submit" className="btn btn-primary-modern flex-grow-1 justify-content-center">
              <span>Tìm</span>
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
        <Loading message="Đang tải danh sách vị trí..." />
      ) : (
        <div className="card-modern">
          <div className="card-modern-header">
            <span className="text-secondary small">
              Hiển thị <strong>{state.rows.length}</strong> vị trí tuyển dụng
            </span>
          </div>

          {state.rows.length === 0 ? (
            <div className="empty-state-box border-0">
              <div className="empty-state-icon">
                <i className="bi bi-briefcase"></i>
              </div>
              <h6 className="fw-semibold text-dark">Không tìm thấy vị trí tuyển dụng</h6>
              <p className="text-muted small mb-3">
                Thử thay đổi từ khóa tìm kiếm hoặc tạo thêm vị trí tuyển dụng mới.
              </p>
              {canEdit && (
                <Link to="/jobs/create" className="btn btn-primary-modern btn-sm text-decoration-none">
                  <i className="bi bi-plus-lg"></i>
                  <span>Tạo vị trí ngay</span>
                </Link>
              )}
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table-modern">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>#ID</th>
                    <th>Tên vị trí</th>
                    <th>Phòng ban</th>
                    <th>Kỹ năng yêu cầu</th>
                    <th style={{ width: '100px' }}>Chỉ tiêu</th>
                    <th style={{ width: '130px' }}>Trạng thái</th>
                    <th style={{ width: '160px' }} className="text-end">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {state.rows.map((job) => (
                    <tr key={job.id}>
                      <td className="text-muted small fw-semibold">#{job.id}</td>
                      <td>
                        <Link
                          to={`/jobs/${job.id}`}
                          className="fw-bold text-dark text-decoration-none hover-primary"
                        >
                          {job.title}
                        </Link>
                      </td>
                      <td>
                        <span className="text-secondary small">
                          <i className="bi bi-building me-1"></i>
                          {job.department || 'Chung'}
                        </span>
                      </td>
                      <td>
                        {job.skills ? (
                          <div className="d-flex flex-wrap gap-1">
                            {job.skills
                              .split(',')
                              .slice(0, 3)
                              .map((sk, idx) => (
                                <span
                                  key={idx}
                                  className="badge bg-light text-dark border small fw-normal"
                                >
                                  {sk.trim()}
                                </span>
                              ))}
                          </div>
                        ) : (
                          <span className="text-muted small">—</span>
                        )}
                      </td>
                      <td>
                        <span className="fw-semibold text-dark">{job.quantity}</span>{' '}
                        <span className="text-muted small">người</span>
                      </td>
                      <td>
                        <span
                          className={`soft-badge ${
                            job.status === 'OPEN' ? 'soft-badge-success' : 'soft-badge-secondary'
                          }`}
                        >
                          <i
                            className={`bi ${
                              job.status === 'OPEN' ? 'bi-check-circle-fill' : 'bi-dash-circle'
                            }`}
                          ></i>
                          {job.status === 'OPEN' ? 'Đang mở' : 'Đã đóng'}
                        </span>
                      </td>
                      <td className="text-end text-nowrap">
                        <Link
                          to={`/jobs/${job.id}`}
                          className="btn btn-sm btn-outline-primary rounded-pill px-2.5 py-0.5 me-1 small"
                          title="Xem chi tiết"
                        >
                          <i className="bi bi-eye"></i>
                        </Link>
                        {canEdit && (
                          <>
                            <Link
                              to={`/jobs/${job.id}/edit`}
                              className="btn btn-sm btn-outline-secondary rounded-pill px-2.5 py-0.5 me-1 small"
                              title="Chỉnh sửa"
                            >
                              <i className="bi bi-pencil"></i>
                            </Link>
                            <button
                              className="btn btn-sm btn-outline-danger rounded-pill px-2.5 py-0.5 small"
                              onClick={() => remove(job.id)}
                              title="Xóa vị trí"
                            >
                              <i className="bi bi-trash3"></i>
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </>
  )
}
