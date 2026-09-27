import { useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import Loading from '../components/Loading'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'
import { candidateApi, cvUrl } from '../services/api'

const SOURCES = [
  { value: 'LINKEDIN', label: 'LinkedIn', icon: 'bi-linkedin' },
  { value: 'FACEBOOK', label: 'Facebook', icon: 'bi-facebook' },
  { value: 'WEBSITE', label: 'Website công ty', icon: 'bi-globe2' },
  { value: 'JOB_SITE', label: 'Trang tuyển dụng', icon: 'bi-briefcase' },
  { value: 'REFERRAL', label: 'Giới thiệu', icon: 'bi-people' },
  { value: 'OTHER', label: 'Khác', icon: 'bi-three-dots' },
]

export default function CandidatesPage() {
  const { user } = useOutletContext()
  const canEdit = ['ADMIN', 'HR'].includes(user?.role)
  const [filters, setFilters] = useState({ keyword: '', source: '' })
  const [state, setState] = useState({ loading: true, rows: [], error: '' })
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  function load(query = filters) {
    setState((s) => ({ ...s, loading: true, error: '' }))
    const p = new URLSearchParams()
    if (query.keyword) p.set('keyword', query.keyword)
    if (query.source) p.set('source', query.source)
    const suffix = p.toString() ? `?${p}` : ''

    candidateApi
      .list(suffix)
      .then((r) => setState({ loading: false, rows: r.data || [], error: '' }))
      .catch((e) => setState({ loading: false, rows: [], error: e.message }))
  }

  useEffect(() => {
    load()
  }, [])

  function handleReset() {
    const emptyFilters = { keyword: '', source: '' }
    setFilters(emptyFilters)
    load(emptyFilters)
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await candidateApi.remove(deleteTarget.id)
      setDeleteTarget(null)
      load()
    } catch (error) {
      setState((s) => ({ ...s, error: error.message }))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Hồ sơ Ứng viên"
        description="Quản lý kho dữ liệu ứng viên, lịch sử nộp đơn và hồ sơ năng lực CV."
        action={
          canEdit && (
            <Link to="/candidates/create" className="btn btn-primary-modern text-decoration-none">
              <i className="bi bi-plus-lg" />
              <span>Thêm ứng viên</span>
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
            load()
          }}
        >
          <div className="col-12 col-md-7">
            <div className="input-icon-group">
              <i className="bi bi-search" />
              <input
                className="form-control"
                value={filters.keyword}
                onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                placeholder="Tìm theo tên ứng viên, kỹ năng hoặc email..."
              />
            </div>
          </div>

          <div className="col-12 col-sm-6 col-md-3">
            <select
              className="form-select"
              value={filters.source}
              onChange={(e) => setFilters({ ...filters, source: e.target.value })}
            >
              <option value="">Tất cả nguồn ứng viên</option>
              {SOURCES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="col-12 col-sm-6 col-md-2 d-flex gap-2">
            <button type="submit" className="btn btn-secondary-modern flex-grow-1 justify-content-center">
              <span>Lọc</span>
            </button>
            {(filters.keyword || filters.source) && (
              <button
                type="button"
                className="btn btn-link text-muted p-2 text-decoration-none small"
                onClick={handleReset}
                title="Xóa bộ lọc"
              >
                <i className="bi bi-x-circle" />
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Results Table */}
      {state.loading ? (
        <Loading message="Đang tải danh sách hồ sơ ứng viên..." />
      ) : (
        <div className="card-modern">
          <div className="card-modern-header">
            <span className="text-muted small">
              Hiển thị <strong>{state.rows.length}</strong> ứng viên
            </span>
          </div>

          {state.rows.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon="bi-people"
                title="Chưa có ứng viên nào"
                description="Thêm ứng viên đầu tiên để bắt đầu quản lý quy trình tuyển dụng."
                action={
                  canEdit && (
                    <Link to="/candidates/create" className="btn btn-primary-modern btn-sm text-decoration-none">
                      <i className="bi bi-plus-lg" />
                      <span>Thêm ứng viên</span>
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
                    <th>Ứng viên</th>
                    <th>Email & Số điện thoại</th>
                    <th>Kỹ năng chuyên môn</th>
                    <th>Nguồn</th>
                    <th>Hồ sơ CV</th>
                    <th style={{ width: '160px' }} className="text-end">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {state.rows.map((c) => {
                    const initials = (c.full_name || 'U')
                      .split(' ')
                      .filter(Boolean)
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()

                    const sourceItem = SOURCES.find((s) => s.value === c.source) || {
                      label: c.source,
                      icon: 'bi-tag',
                    }

                    return (
                      <tr key={c.id}>
                        <td>
                          <div className="d-flex align-items-center gap-2.5">
                            <div className="table-avatar-initials">{initials}</div>
                            <div>
                              <Link
                                to={`/candidates/${c.id}`}
                                className="fw-bold text-dark text-decoration-none"
                                style={{ transition: 'color 0.15s ease' }}
                                onMouseEnter={(e) => (e.target.style.color = 'var(--primary)')}
                                onMouseLeave={(e) => (e.target.style.color = 'var(--text-primary)')}
                              >
                                {c.full_name}
                              </Link>
                              <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
                                #{c.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div>
                            <span className="small text-dark d-block">
                              <i className="bi bi-envelope me-1.5 text-muted" />
                              {c.email || '—'}
                            </span>
                            {c.phone && (
                              <span className="small text-muted">
                                <i className="bi bi-telephone me-1.5 text-muted" />
                                {c.phone}
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          {c.skills ? (
                            <div className="d-flex flex-wrap gap-1" style={{ maxWidth: '240px' }}>
                              {c.skills
                                .split(',')
                                .slice(0, 3)
                                .map((sk, idx) => (
                                  <span key={idx} className="badge bg-light text-secondary border small fw-normal">
                                    {sk.trim()}
                                  </span>
                                ))}
                            </div>
                          ) : (
                            <span className="text-muted small">—</span>
                          )}
                        </td>
                        <td>
                          <span className="soft-badge soft-badge-secondary">
                            <i className={`bi ${sourceItem.icon}`} />
                            {sourceItem.label}
                          </span>
                        </td>
                        <td>
                          {c.cv_file ? (
                            <a
                              href={cvUrl(c.cv_file)}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-sm btn-light border py-1 px-2.5 small d-inline-flex align-items-center gap-1.5 text-secondary"
                              style={{ borderRadius: 'var(--radius-md)' }}
                              title="Tải / Xem file CV"
                            >
                              <i className="bi bi-file-earmark-pdf text-danger" />
                              <span>Xem CV</span>
                            </a>
                          ) : (
                            <span className="text-muted small">Chưa có file</span>
                          )}
                        </td>
                        <td className="text-end text-nowrap">
                          <Link
                            to={`/candidates/${c.id}`}
                            className="btn btn-sm btn-secondary-modern py-1 px-2.5 me-1 text-decoration-none"
                            style={{ fontSize: '0.8rem' }}
                          >
                            Xem chi tiết
                          </Link>
                          {canEdit && (
                            <>
                              <Link
                                to={`/candidates/${c.id}/edit`}
                                className="btn btn-sm btn-light border py-1 px-2 me-1 text-muted"
                                title="Chỉnh sửa"
                                style={{ borderRadius: 'var(--radius-md)' }}
                              >
                                <i className="bi bi-pencil" />
                              </Link>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger py-1 px-2"
                                onClick={() => setDeleteTarget(c)}
                                title="Xóa ứng viên"
                                style={{ borderRadius: 'var(--radius-md)' }}
                              >
                                <i className="bi bi-trash3" />
                              </button>
                            </>
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

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)' }}
        >
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '440px' }}>
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 'var(--radius-lg)' }}>
              <div className="modal-header border-bottom px-4 py-3">
                <h5 className="modal-title fw-bold text-dark h6 mb-0">Xác nhận xóa ứng viên</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                />
              </div>
              <div className="modal-body px-4 py-3">
                <p className="text-secondary small mb-2">
                  Bạn có chắc chắn muốn xóa hồ sơ ứng viên <strong>{deleteTarget.full_name}</strong> (ID: #{deleteTarget.id})?
                </p>
                <div className="text-muted small">
                  Lưu ý: Hành động này sẽ xóa dữ liệu ứng viên và không thể hoàn tác nếu đã liên kết với hồ sơ ứng tuyển.
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
