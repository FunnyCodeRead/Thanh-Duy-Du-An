import { useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import Loading from '../components/Loading'
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

  async function remove(id) {
    if (!window.confirm('Bạn có chắc chắn muốn xóa ứng viên này khỏi hệ thống?')) return
    try {
      await candidateApi.remove(id)
      load()
    } catch (error) {
      setState((s) => ({ ...s, error: error.message }))
    }
  }

  return (
    <>
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4">
        <div>
          <h1 className="h3 fw-bold mb-1 text-dark">Hồ sơ Ứng viên</h1>
          <p className="text-muted mb-0 small">
            Quản lý thông tin liên hệ, hồ sơ CV đính kèm và lịch sử ứng tuyển.
          </p>
        </div>
        {canEdit && (
          <Link to="/candidates/create" className="btn btn-primary-modern text-decoration-none">
            <i className="bi bi-person-plus-fill"></i>
            <span>Thêm ứng viên mới</span>
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
            load()
          }}
        >
          <div className="col-12 col-md-6 col-lg-7">
            <div className="input-icon-group">
              <i className="bi bi-search"></i>
              <input
                className="form-control"
                value={filters.keyword}
                onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                placeholder="Tìm theo họ tên, email, số điện thoại hoặc kỹ năng..."
              />
            </div>
          </div>

          <div className="col-12 col-sm-6 col-md-3 col-lg-3">
            <select
              className="form-select"
              value={filters.source}
              onChange={(e) => setFilters({ ...filters, source: e.target.value })}
              style={{ borderRadius: 'var(--radius-md)' }}
            >
              <option value="">Tất cả nguồn</option>
              {SOURCES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="col-12 col-sm-6 col-md-3 col-lg-2 d-flex gap-2">
            <button type="submit" className="btn btn-primary-modern flex-grow-1 justify-content-center">
              <span>Tìm</span>
            </button>
            {(filters.keyword || filters.source) && (
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
        <Loading message="Đang tải danh sách ứng viên..." />
      ) : (
        <div className="card-modern">
          <div className="card-modern-header">
            <span className="text-secondary small">
              Hiển thị <strong>{state.rows.length}</strong> ứng viên
            </span>
          </div>

          {state.rows.length === 0 ? (
            <div className="empty-state-box border-0">
              <div className="empty-state-icon">
                <i className="bi bi-people"></i>
              </div>
              <h6 className="fw-semibold text-dark">Không tìm thấy ứng viên phù hợp</h6>
              <p className="text-muted small mb-3">
                Thử thay đổi từ khóa hoặc thêm ứng viên mới vào hệ thống.
              </p>
              {canEdit && (
                <Link to="/candidates/create" className="btn btn-primary-modern btn-sm text-decoration-none">
                  <i className="bi bi-plus-lg"></i>
                  <span>Thêm ứng viên ngay</span>
                </Link>
              )}
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
                    <th style={{ width: '150px' }} className="text-end">
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
                                className="fw-bold text-dark text-decoration-none hover-primary"
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
                              <i className="bi bi-envelope me-1.5 text-secondary"></i>
                              {c.email || '—'}
                            </span>
                            {c.phone && (
                              <span className="small text-muted">
                                <i className="bi bi-telephone me-1.5 text-secondary"></i>
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
                                  <span key={idx} className="badge bg-light text-dark border small fw-normal">
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
                            <i className={`bi ${sourceItem.icon}`}></i>
                            {sourceItem.label}
                          </span>
                        </td>
                        <td>
                          {c.cv_file ? (
                            <a
                              href={cvUrl(c.cv_file)}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-sm btn-outline-primary rounded-pill px-2.5 py-0.5 small d-inline-flex align-items-center gap-1"
                              title="Tải / Xem file CV"
                            >
                              <i className="bi bi-file-earmark-pdf"></i>
                              <span>Xem CV</span>
                            </a>
                          ) : (
                            <span className="text-muted small">Chưa có file</span>
                          )}
                        </td>
                        <td className="text-end text-nowrap">
                          <Link
                            to={`/candidates/${c.id}`}
                            className="btn btn-sm btn-outline-primary rounded-pill px-2.5 py-0.5 me-1 small"
                            title="Xem chi tiết"
                          >
                            <i className="bi bi-eye"></i>
                          </Link>
                          {canEdit && (
                            <>
                              <Link
                                to={`/candidates/${c.id}/edit`}
                                className="btn btn-sm btn-outline-secondary rounded-pill px-2.5 py-0.5 me-1 small"
                                title="Chỉnh sửa"
                              >
                                <i className="bi bi-pencil"></i>
                              </Link>
                              <button
                                className="btn btn-sm btn-outline-danger rounded-pill px-2.5 py-0.5 small"
                                onClick={() => remove(c.id)}
                                title="Xóa ứng viên"
                              >
                                <i className="bi bi-trash3"></i>
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
    </>
  )
}
