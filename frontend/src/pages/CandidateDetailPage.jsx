import { useEffect, useState } from 'react'
import { Link, useOutletContext, useParams } from 'react-router-dom'
import Loading from '../components/Loading'
import PageHeader from '../components/PageHeader'
import { candidateApi, cvUrl } from '../services/api'
import { formatSource } from '../utils/formatters'

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
        <i className="bi bi-exclamation-triangle-fill" />
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
      <PageHeader
        title={c.full_name}
        description={`Mã ứng viên: #${c.id} • Ngày thêm: ${new Date(c.created_at).toLocaleDateString('vi-VN')}`}
        badge={<span className="soft-badge soft-badge-secondary">Nguồn: {formatSource(c.source)}</span>}
        action={
          <div className="d-flex gap-2">
            <Link to="/candidates" className="btn btn-secondary-modern btn-sm text-decoration-none">
              <i className="bi bi-arrow-left" />
              <span>Quay lại</span>
            </Link>
            {canEdit && (
              <Link
                to={`/candidates/${id}/edit`}
                className="btn btn-primary-modern btn-sm text-decoration-none"
              >
                <i className="bi bi-pencil" />
                <span>Chỉnh sửa</span>
              </Link>
            )}
          </div>
        }
      />

      <div className="card-modern mb-4">
        <div className="card-modern-header">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-person-lines-fill text-primary" />
            <span>Thông tin chi tiết hồ sơ</span>
          </div>
          <span className="soft-badge soft-badge-secondary">{formatSource(c.source)}</span>
        </div>

        <div className="card-modern-body">
          <div className="d-flex align-items-center gap-3 mb-4">
            <div
              className="table-avatar-initials"
              style={{ width: '52px', height: '52px', fontSize: '1.25rem' }}
            >
              {initials}
            </div>
            <div>
              <h4 className="fw-bold mb-0 text-dark">{c.full_name}</h4>
              <div className="text-muted small mt-0.5">
                <i className="bi bi-envelope me-1.5" /> {c.email || '—'} &bull;{' '}
                <i className="bi bi-telephone ms-1 me-1.5" /> {c.phone || '—'}
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
                    <span key={idx} className="badge bg-light text-secondary border small fw-normal py-1.5 px-2.5">
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
                <div className="d-flex flex-wrap gap-2 align-items-center mb-1">
                  <a
                    href={cvUrl(c.cv_file)}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-sm btn-light border py-1.5 px-3 small d-inline-flex align-items-center gap-1.5 text-secondary"
                    style={{ borderRadius: 'var(--radius-md)' }}
                    title="Tải / Mở xem tệp CV"
                  >
                    <i className="bi bi-file-earmark-pdf text-danger fs-6" />
                    <span>Tải / Xem tệp CV</span>
                  </a>
                </div>
              ) : (
                <span className="text-muted">Chưa đính kèm tệp CV</span>
              )}
            </div>

            {c.cv_text && (
              <div className="col-12 border-top pt-2">
                <div className="fw-semibold text-secondary mb-1">
                  <i className="bi bi-file-earmark-text text-primary me-1" />
                  Nội dung CV trích xuất
                </div>
                <div
                  className="p-3 rounded-3 bg-light border small text-dark"
                  style={{ maxHeight: '180px', overflowY: 'auto', whiteSpace: 'pre-wrap' }}
                >
                  {c.cv_text}
                </div>
              </div>
            )}
          </div>

          <div
            className="p-3 rounded-3 mt-4 d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2"
            style={{ backgroundColor: 'var(--primary-soft)', border: '1px solid var(--primary-border)' }}
          >
            <span className="small fw-semibold" style={{ color: 'var(--primary)' }}>
              <i className="bi bi-info-circle-fill me-1.5" />
              Xem hoặc tạo hồ sơ ứng tuyển liên kết với ứng viên này
            </span>
            <div className="d-flex gap-2">
              <Link
                className="btn btn-sm btn-secondary-modern py-1 px-3 small"
                to={`/applications?keyword=${encodeURIComponent(c.full_name)}`}
              >
                Xem hồ sơ ứng tuyển
              </Link>
              {canEdit && (
                <Link
                  className="btn btn-sm btn-primary-modern py-1 px-3 small text-white text-decoration-none"
                  to="/applications/create"
                >
                  <i className="bi bi-plus-lg" />
                  <span>Tạo hồ sơ ứng tuyển</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
