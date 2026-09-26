import { useEffect, useState } from 'react'
import { Link, useOutletContext, useParams } from 'react-router-dom'
import Loading from '../components/Loading'
import { jobApi } from '../services/api'

export default function JobDetailPage() {
  const { user } = useOutletContext()
  const { id } = useParams()
  const [state, setState] = useState({ loading: true, data: null, error: '' })

  useEffect(() => {
    jobApi
      .get(id)
      .then((result) => setState({ loading: false, data: result.data, error: '' }))
      .catch((error) => setState({ loading: false, data: null, error: error.message }))
  }, [id])

  if (state.loading) return <Loading message="Đang tải thông tin vị trí..." />
  if (state.error) {
    return (
      <div className="alert alert-danger d-flex align-items-center gap-2 rounded-3 my-4">
        <i className="bi bi-exclamation-triangle-fill"></i>
        <div>{state.error}</div>
      </div>
    )
  }

  const job = state.data
  const canEdit = ['ADMIN', 'HR'].includes(user?.role)

  return (
    <>
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <Link to="/jobs" className="text-secondary text-decoration-none small">
              <i className="bi bi-arrow-left me-1"></i> Vị trí tuyển dụng
            </Link>
            <span className="text-muted small">/</span>
            <span className="text-muted small">Vị trí #{job.id}</span>
          </div>
          <h1 className="h3 fw-bold mb-0 text-dark">{job.title}</h1>
        </div>

        <div className="d-flex gap-2">
          <Link to="/jobs" className="btn btn-secondary-modern btn-sm text-decoration-none">
            Quay lại
          </Link>
          {canEdit && (
            <Link to={`/jobs/${id}/edit`} className="btn btn-primary-modern btn-sm text-decoration-none">
              <i className="bi bi-pencil"></i>
              <span>Chỉnh sửa</span>
            </Link>
          )}
        </div>
      </div>

      <div className="card-modern">
        <div className="card-modern-header">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-briefcase-fill text-primary"></i>
            <span>Chi tiết vị trí tuyển dụng</span>
          </div>
          <span
            className={`soft-badge ${
              job.status === 'OPEN' ? 'soft-badge-success' : 'soft-badge-secondary'
            }`}
          >
            {job.status === 'OPEN' ? 'Đang mở (OPEN)' : 'Đã đóng (CLOSED)'}
          </span>
        </div>

        <div className="card-modern-body">
          <div className="row g-4">
            <div className="col-12 col-md-6">
              <div className="p-3 rounded-3 bg-light border">
                <div className="text-muted small fw-semibold mb-1">Phòng ban phụ trách</div>
                <div className="fw-bold text-dark fs-6">
                  <i className="bi bi-building me-1.5 text-primary"></i>
                  {job.department || 'Chung'}
                </div>
              </div>
            </div>

            <div className="col-12 col-md-3">
              <div className="p-3 rounded-3 bg-light border">
                <div className="text-muted small fw-semibold mb-1">Chỉ tiêu tuyển dụng</div>
                <div className="fw-bold text-dark fs-6">{job.quantity} người</div>
              </div>
            </div>

            <div className="col-12 col-md-3">
              <div className="p-3 rounded-3 bg-light border">
                <div className="text-muted small fw-semibold mb-1">Số hồ sơ ứng tuyển</div>
                <div className="fw-bold text-primary fs-6">{job.application_count ?? 0} hồ sơ</div>
              </div>
            </div>

            <div className="col-12">
              <div className="fw-semibold text-secondary small mb-1">Kỹ năng chuyên môn yêu cầu</div>
              {job.skills ? (
                <div className="d-flex flex-wrap gap-1.5">
                  {job.skills.split(',').map((sk, idx) => (
                    <span key={idx} className="badge bg-light text-dark border small fw-normal py-1.5 px-2.5">
                      {sk.trim()}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-muted small">—</span>
              )}
            </div>

            <div className="col-12 border-top pt-3">
              <h6 className="fw-bold text-dark mb-2">Mô tả công việc</h6>
              <div className="text-secondary small text-preline" style={{ lineHeight: 1.7 }}>
                {job.description || 'Chưa cập nhật nội dung.'}
              </div>
            </div>

            <div className="col-12 border-top pt-3">
              <h6 className="fw-bold text-dark mb-2">Yêu cầu tuyển dụng</h6>
              <div className="text-secondary small text-preline" style={{ lineHeight: 1.7 }}>
                {job.requirements || 'Chưa cập nhật nội dung.'}
              </div>
            </div>

            <div className="col-12 border-top pt-2">
              <span className="text-muted small">
                Ngày tạo vị trí: {new Date(job.created_at).toLocaleString('vi-VN')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
