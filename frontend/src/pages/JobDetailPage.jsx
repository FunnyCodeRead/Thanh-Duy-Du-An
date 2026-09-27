import { useEffect, useState } from 'react'
import { Link, useOutletContext, useParams } from 'react-router-dom'
import Loading from '../components/Loading'
import PageHeader from '../components/PageHeader'
import StatusBadge from '../components/StatusBadge'
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
        <i className="bi bi-exclamation-triangle-fill" />
        <div>{state.error}</div>
      </div>
    )
  }

  const job = state.data
  const canEdit = ['ADMIN', 'HR'].includes(user?.role)

  return (
    <>
      <PageHeader
        title={job.title}
        description={`Mã vị trí: #${job.id} • Tạo ngày ${new Date(job.created_at).toLocaleDateString('vi-VN')}`}
        badge={<StatusBadge status={job.status} />}
        action={
          <div className="d-flex gap-2">
            <Link to="/jobs" className="btn btn-secondary-modern btn-sm text-decoration-none">
              <i className="bi bi-arrow-left" />
              <span>Quay lại</span>
            </Link>
            {canEdit && (
              <Link to={`/jobs/${id}/edit`} className="btn btn-primary-modern btn-sm text-decoration-none">
                <i className="bi bi-pencil" />
                <span>Chỉnh sửa</span>
              </Link>
            )}
          </div>
        }
      />

      <div className="card-modern">
        <div className="card-modern-header">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-briefcase-fill text-primary" />
            <span>Chi tiết vị trí tuyển dụng</span>
          </div>
          <StatusBadge status={job.status} />
        </div>

        <div className="card-modern-body">
          <div className="row g-4">
            <div className="col-12 col-md-6">
              <div className="p-3 rounded-3 bg-light border">
                <div className="text-muted small fw-semibold mb-1">Phòng ban phụ trách</div>
                <div className="fw-bold text-dark fs-6">
                  <i className="bi bi-building me-1.5 text-primary" />
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
                <div className="fw-bold fs-6" style={{ color: 'var(--primary)' }}>
                  {job.application_count ?? 0} hồ sơ
                </div>
              </div>
            </div>

            <div className="col-12">
              <div className="fw-semibold text-secondary small mb-1.5">Kỹ năng chuyên môn yêu cầu</div>
              {job.skills ? (
                <div className="d-flex flex-wrap gap-1.5">
                  {job.skills.split(',').map((sk, idx) => (
                    <span key={idx} className="badge bg-light text-secondary border small fw-normal py-1.5 px-2.5">
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
          </div>
        </div>
      </div>
    </>
  )
}
