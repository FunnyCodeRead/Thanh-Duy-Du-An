import { useEffect, useState } from 'react'
import { Link, useOutletContext, useParams } from 'react-router-dom'
import Loading from '../components/Loading'
import { candidateApi, cvUrl } from '../services/api'

export default function CandidateDetailPage() {
  const { user } = useOutletContext()
  const { id } = useParams()
  const [state, setState] = useState({ loading: true, data: null, error: '' })

  useEffect(() => {
    candidateApi
      .get(id)
      .then((r) => setState({ loading: false, data: r.data, error: '' }))
      .catch((e) => setState({ loading: false, data: null, error: e.message }))
  }, [id])

  if (state.loading) return <Loading message="Đang tải thông tin ứng viên..." />
  if (state.error) {
    return (
      <div className="alert alert-danger d-flex align-items-center gap-2 rounded-3 my-4">
        <i className="bi bi-exclamation-triangle-fill"></i>
        <div>{state.error}</div>
      </div>
    )
  }

  const c = state.data
  const canEdit = ['ADMIN', 'HR'].includes(user?.role)
  const initials = (c.full_name || 'U')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <>
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <Link to="/candidates" className="text-secondary text-decoration-none small">
              <i className="bi bi-arrow-left me-1"></i> Hồ sơ ứng viên
            </Link>
            <span className="text-muted small">/</span>
            <span className="text-muted small">Ứng viên #{c.id}</span>
          </div>
          <h1 className="h3 fw-bold mb-0 text-dark">{c.full_name}</h1>
        </div>

        <div className="d-flex gap-2">
          <Link to="/candidates" className="btn btn-secondary-modern btn-sm text-decoration-none">
            Quay lại
          </Link>
          {canEdit && (
            <Link
              to={`/candidates/${id}/edit`}
              className="btn btn-primary-modern btn-sm text-decoration-none"
            >
              <i className="bi bi-pencil"></i>
              <span>Chỉnh sửa</span>
            </Link>
          )}
        </div>
      </div>

      <div className="card-modern mb-4">
        <div className="card-modern-header">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-person-lines-fill text-primary"></i>
            <span>Thông tin chi tiết ứng viên</span>
          </div>
          <span className="soft-badge soft-badge-secondary">Nguồn: {c.source || 'OTHER'}</span>
        </div>

        <div className="card-modern-body">
          <div className="d-flex align-items-center gap-3 mb-4">
            <div
              className="table-avatar-initials"
              style={{ width: '56px', height: '56px', fontSize: '1.35rem' }}
            >
              {initials}
            </div>
            <div>
              <h4 className="fw-bold mb-0 text-dark">{c.full_name}</h4>
              <div className="text-muted small">
                <i className="bi bi-envelope me-1"></i> {c.email || '—'} &bull;{' '}
                <i className="bi bi-telephone me-1"></i> {c.phone || '—'}
              </div>
            </div>
          </div>

          <div className="row g-3 small border-top pt-3">
            <div className="col-12 col-md-6">
              <div className="fw-semibold text-secondary mb-1">Trình độ học vấn</div>
              <div className="text-dark text-preline">{c.education || 'Chưa cập nhật'}</div>
            </div>

            <div className="col-12 col-md-6">
              <div className="fw-semibold text-secondary mb-1">Kinh nghiệm làm việc</div>
              <div className="text-dark text-preline">{c.experience || 'Chưa cập nhật'}</div>
            </div>

            <div className="col-12 border-top pt-2">
              <div className="fw-semibold text-secondary mb-1.5">Kỹ năng chuyên môn</div>
              {c.skills ? (
                <div className="d-flex flex-wrap gap-1.5">
                  {c.skills.split(',').map((sk, idx) => (
                    <span key={idx} className="badge bg-light text-dark border small fw-normal py-1.5 px-2.5">
                      {sk.trim()}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-muted">—</span>
              )}
            </div>

            <div className="col-12 border-top pt-2">
              <div className="fw-semibold text-secondary mb-1">Hồ sơ CV đính kèm</div>
              {c.cv_file ? (
                <a
                  href={cvUrl(c.cv_file)}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-sm btn-outline-primary rounded-pill px-3 py-1.5 small d-inline-flex align-items-center gap-1.5"
                >
                  <i className="bi bi-file-earmark-pdf-fill fs-6"></i>
                  <span>Tải / Mở xem tệp CV</span>
                </a>
              ) : (
                <span className="text-muted">Chưa đính kèm tệp CV</span>
              )}
            </div>

            <div className="col-12 border-top pt-2">
              <span className="text-muted small">
                Ngày tham gia hệ thống: {new Date(c.created_at).toLocaleString('vi-VN')}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-3 mt-4 d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2" style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
            <span className="small text-success fw-semibold">
              <i className="bi bi-info-circle-fill me-1.5"></i>
              Xem hoặc tạo hồ sơ ứng tuyển liên kết với ứng viên này
            </span>
            <div className="d-flex gap-2">
              <Link
                className="btn btn-sm btn-outline-success rounded-pill px-3 py-1 small"
                to={`/applications?keyword=${encodeURIComponent(c.full_name)}`}
              >
                Xem hồ sơ ứng tuyển
              </Link>
              {canEdit && (
                <Link
                  className="btn btn-sm btn-success rounded-pill px-3 py-1 small text-white"
                  to="/applications/create"
                >
                  + Nộp hồ sơ mới
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
