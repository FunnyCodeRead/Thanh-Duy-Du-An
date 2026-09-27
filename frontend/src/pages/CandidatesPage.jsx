import { useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import Loading from '../components/Loading'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'
import Pagination from '../components/Pagination'
import { candidateApi, cvUrl } from '../services/api'

const SOURCES = [
  { value: 'LINKEDIN', label: 'LinkedIn', icon: 'bi-linkedin', colorClass: 'source-badge-linkedin' },
  { value: 'FACEBOOK', label: 'Facebook', icon: 'bi-facebook', colorClass: 'source-badge-facebook' },
  { value: 'WEBSITE', label: 'Website công ty', icon: 'bi-globe2', colorClass: 'source-badge-website' },
  { value: 'JOB_SITE', label: 'Trang tuyển dụng', icon: 'bi-briefcase-fill', colorClass: 'source-badge-jobsite' },
  { value: 'REFERRAL', label: 'Giới thiệu', icon: 'bi-people-fill', colorClass: 'source-badge-referral' },
  { value: 'OTHER', label: 'Khác', icon: 'bi-three-dots', colorClass: 'source-badge-default' },
]

export default function CandidatesPage() {
  const { user } = useOutletContext()
  const canEdit = ['ADMIN', 'HR'].includes(user?.role)
  const [filters, setFilters] = useState({ keyword: '', source: '' })
  const [state, setState] = useState({ loading: true, rows: [], error: '' })
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

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

  const totalItems = state.rows.length
  const paginatedCandidates = state.rows.slice((page - 1) * pageSize, page * pageSize)

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
            <button type="submit" className="btn btn-filter-submit flex-grow-1 justify-content-center">
              <i className="bi bi-funnel-fill" />
              <span>Lọc</span>
            </button>
            {(filters.keyword || filters.source) && (
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
            <>
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
                  {paginatedCandidates.map((c) => {
                    const initials = (c.full_name || 'U')
                      .split(' ')
                      .filter(Boolean)
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()

                    const sourceItem = SOURCES.find((s) => s.value === c.source) || {
                      label: c.source || 'Chưa rõ',
                      icon: 'bi-tag-fill',
                      colorClass: 'source-badge-default',
                    }

                    return (
                      <tr key={c.id}>
                        <td>
                          <div className="d-flex align-items-center gap-3">
                            <div className="table-avatar-initials flex-shrink-0" style={{ width: '38px', height: '38px', fontSize: '0.88rem' }}>
                              {initials}
                            </div>
                            <div>
                              <Link
                                to={`/candidates/${c.id}`}
                                className="fw-bold text-dark text-decoration-none d-block mb-1"
                                style={{ fontSize: '0.94rem', transition: 'color 0.15s ease' }}
                                onMouseEnter={(e) => (e.target.style.color = 'var(--primary)')}
                                onMouseLeave={(e) => (e.target.style.color = 'var(--text-primary)')}
                              >
                                {c.full_name}
                              </Link>
                              <span
                                className="badge rounded-pill fw-semibold"
                                style={{
                                  backgroundColor: '#EFF6FF',
                                  color: '#2563EB',
                                  border: '1px solid #BFDBFE',
                                  fontSize: '0.72rem',
                                  padding: '0.18rem 0.55rem',
                                }}
                              >
                                ID #{c.id}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="d-flex flex-column gap-2 py-0.5">
                            <div className="d-flex align-items-center gap-2">
                              <span
                                className="d-inline-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                                style={{
                                  width: '24px',
                                  height: '24px',
                                  backgroundColor: '#EFF6FF',
                                  color: '#2563EB',
                                  fontSize: '0.75rem',
                                }}
                              >
                                <i className="bi bi-envelope-fill" />
                              </span>
                              <span className="small fw-semibold text-dark text-truncate" style={{ maxWidth: '210px' }} title={c.email}>
                                {c.email || '—'}
                              </span>
                            </div>
                            {c.phone && (
                              <div className="d-flex align-items-center gap-2">
                                <span
                                  className="d-inline-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                                  style={{
                                    width: '24px',
                                    height: '24px',
                                    backgroundColor: '#ECFDF5',
                                    color: '#059669',
                                    fontSize: '0.75rem',
                                  }}
                                >
                                  <i className="bi bi-telephone-fill" />
                                </span>
                                <span className="small text-secondary fw-medium">
                                  {c.phone}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          {c.skills ? (
                            <div className="d-flex flex-wrap gap-1.5" style={{ maxWidth: '260px' }}>
                              {c.skills
                                .split(',')
                                .slice(0, 3)
                                .map((sk, idx) => (
                                  <span key={idx} className="skill-pill">
                                    {sk.trim()}
                                  </span>
                                ))}
                            </div>
                          ) : (
                            <span className="text-muted small">—</span>
                          )}
                        </td>
                        <td>
                          <span className={`source-badge ${sourceItem.colorClass}`}>
                            <i className={`bi ${sourceItem.icon}`} />
                            <span>{sourceItem.label}</span>
                          </span>
                        </td>
                        <td>
                          {c.cv_file ? (
                            <a
                              href={cvUrl(c.cv_file)}
                              target="_blank"
                              rel="noreferrer"
                              className="btn-cv-pill"
                              title="Tải / Xem file CV"
                            >
                              <i className="bi bi-file-earmark-pdf-fill" />
                              <span>Xem CV</span>
                            </a>
                          ) : (
                            <span className="text-muted small">Chưa có file</span>
                          )}
                        </td>
                        <td className="text-end text-nowrap">
                          <div className="d-inline-flex align-items-center gap-1.5">
                            <Link
                              to={`/candidates/${c.id}`}
                              className="btn btn-table-action text-decoration-none"
                            >
                              <i className="bi bi-eye" />
                              <span>Xem chi tiết</span>
                            </Link>
                            {canEdit && (
                              <>
                                <Link
                                  to={`/candidates/${c.id}/edit`}
                                  className="btn btn-table-edit text-decoration-none"
                                  title="Chỉnh sửa hồ sơ ứng viên"
                                >
                                  <i className="bi bi-pencil" />
                                </Link>
                                <button
                                  type="button"
                                  className="btn btn-table-delete"
                                  onClick={() => setDeleteTarget(c)}
                                  title="Xóa ứng viên"
                                >
                                  <i className="bi bi-trash3" />
                                </button>
                              </>
                            )}
                          </div>
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
