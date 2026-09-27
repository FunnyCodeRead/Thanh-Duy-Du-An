import { useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import Loading from '../components/Loading'
import PageHeader from '../components/PageHeader'
import StatusBadge from '../components/StatusBadge'
import EmptyState from '../components/EmptyState'
import { jobApi } from '../services/api'

export default function JobsPage() {
  const { user } = useOutletContext()
  const canEdit = ['ADMIN', 'HR'].includes(user?.role)
  const [filters, setFilters] = useState({ keyword: '', status: '' })
  const [state, setState] = useState({ loading: true, rows: [], error: '' })
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

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

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await jobApi.remove(deleteTarget.id)
      setDeleteTarget(null)
      loadJobs()
    } catch (error) {
      setState((current) => ({ ...current, error: error.message }))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Vị trí Tuyển dụng"
        description="Quản lý danh sách các cơ hội việc làm, yêu cầu kỹ năng và chỉ tiêu tuyển dụng."
        action={
          canEdit && (
            <Link to="/jobs/create" className="btn btn-primary-modern text-decoration-none">
              <i className="bi bi-plus-lg" />
              <span>Thêm vị trí mới</span>
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

      {/* Filter Bar (Tabler inspired) */}
      <div className="filter-bar-card">
        <form
          className="row g-2 align-items-center"
          onSubmit={(e) => {
            e.preventDefault()
            loadJobs()
          }}
        >
          <div className="col-12 col-md-7">
            <div className="input-icon-group">
              <i className="bi bi-search" />
              <input
                className="form-control"
                value={filters.keyword}
                onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                placeholder="Tìm theo tên vị trí, phòng ban hoặc kỹ năng..."
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
              <option value="OPEN">Đang mở tuyển</option>
              <option value="CLOSED">Đã đóng tuyển</option>
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
        <Loading message="Đang tải danh sách vị trí tuyển dụng..." />
      ) : (
        <div className="card-modern">
          <div className="card-modern-header">
            <span className="text-muted small">
              Hiển thị <strong>{state.rows.length}</strong> vị trí tuyển dụng
            </span>
          </div>

          {state.rows.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon="bi-briefcase"
                title="Chưa có vị trí tuyển dụng nào"
                description="Tạo vị trí tuyển dụng đầu tiên để bắt đầu đăng tin và tiếp nhận hồ sơ ứng viên."
                action={
                  canEdit && (
                    <Link to="/jobs/create" className="btn btn-primary-modern btn-sm text-decoration-none">
                      <i className="bi bi-plus-lg" />
                      <span>Thêm vị trí mới</span>
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
                    <th>Tên vị trí</th>
                    <th>Phòng ban</th>
                    <th>Kỹ năng yêu cầu</th>
                    <th style={{ width: '110px' }}>Chỉ tiêu</th>
                    <th style={{ width: '140px' }}>Trạng thái</th>
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
                          className="fw-bold text-dark text-decoration-none"
                          style={{ transition: 'color 0.15s ease' }}
                          onMouseEnter={(e) => (e.target.style.color = 'var(--primary)')}
                          onMouseLeave={(e) => (e.target.style.color = 'var(--text-primary)')}
                        >
                          {job.title}
                        </Link>
                      </td>
                      <td>
                        <span className="text-secondary small">
                          <i className="bi bi-building me-1 text-muted" />
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
                                  className="badge bg-light text-secondary border small fw-normal"
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
                        <StatusBadge status={job.status} />
                      </td>
                      <td className="text-end text-nowrap">
                        <Link
                          to={`/jobs/${job.id}`}
                          className="btn btn-table-action me-1 text-decoration-none"
                        >
                          <i className="bi bi-eye" />
                          <span>Xem chi tiết</span>
                        </Link>
                        {canEdit && (
                          <>
                            <Link
                              to={`/jobs/${job.id}/edit`}
                              className="btn btn-table-edit me-1 text-decoration-none"
                              title="Chỉnh sửa vị trí"
                            >
                              <i className="bi bi-pencil" />
                            </Link>
                            <button
                              type="button"
                              className="btn btn-table-delete"
                              onClick={() => setDeleteTarget(job)}
                              title="Xóa vị trí"
                            >
                              <i className="bi bi-trash3" />
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

      {/* Confirmation Modal for Delete */}
      {deleteTarget && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)' }}
        >
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '440px' }}>
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 'var(--radius-lg)' }}>
              <div className="modal-header border-bottom px-4 py-3">
                <h5 className="modal-title fw-bold text-dark h6 mb-0">Xác nhận xóa vị trí tuyển dụng</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                />
              </div>
              <div className="modal-body px-4 py-3">
                <p className="text-secondary small mb-2">
                  Bạn có chắc chắn muốn xóa vị trí <strong>{deleteTarget.title}</strong> (ID: #{deleteTarget.id})?
                </p>
                <div className="text-muted small">
                  Lưu ý: Hành động này không thể hoàn tác nếu vị trí đã được liên kết với hồ sơ ứng tuyển.
                </div>
              </div>
              <div className="modal-footer border-top px-4 py-2.5 d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-secondary-modern btn-sm"
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className="btn btn-danger btn-sm px-3 fw-semibold"
                  style={{ borderRadius: 'var(--radius-md)' }}
                  onClick={confirmDelete}
                  disabled={deleting}
                >
                  {deleting ? 'Đang xóa...' : 'Xác nhận xóa'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
