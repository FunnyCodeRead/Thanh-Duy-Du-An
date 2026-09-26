import { useCallback, useEffect, useState } from 'react'
import { Link, useOutletContext, useParams } from 'react-router-dom'
import Loading from '../components/Loading'
import { evaluationApi, interviewApi } from '../services/api'

function statusBadgeClass(status) {
  switch (status) {
    case 'SCHEDULED':
      return 'soft-badge-primary'
    case 'COMPLETED':
      return 'soft-badge-success'
    case 'CANCELLED':
      return 'soft-badge-secondary'
    default:
      return 'soft-badge-info'
  }
}

function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default function InterviewDetailPage() {
  const { id } = useParams()
  const { user } = useOutletContext()

  const [interview, setInterview] = useState(null)
  const [evaluations, setEvaluations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionMsg, setActionMsg] = useState({ text: '', type: '' })
  const [processing, setProcessing] = useState(false)

  const reloadData = useCallback(async () => {
    try {
      const res = await interviewApi.get(id)
      const data = res.data
      setInterview(data)

      if (data.application_id) {
        const evalRes = await evaluationApi.listByApplication(data.application_id)
        setEvaluations(evalRes.data || [])
      }
    } catch (err) {
      setError(err.message || 'Lỗi khi tải thông tin phỏng vấn.')
    }
  }, [id])

  useEffect(() => {
    interviewApi.get(id)
      .then((res) => {
        setInterview(res.data)
        if (res.data?.application_id) {
          return evaluationApi.listByApplication(res.data.application_id)
        }
        return { data: [] }
      })
      .then((evalRes) => {
        setEvaluations(evalRes.data || [])
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message || 'Lỗi khi tải thông tin phỏng vấn.')
        setLoading(false)
      })
  }, [id])

  async function handleStatusChange(newStatus) {
    if (!window.confirm(`Bạn có chắc muốn chuyển trạng thái phỏng vấn sang ${newStatus}?`)) {
      return
    }
    setProcessing(true)
    setActionMsg({ text: '', type: '' })
    try {
      await interviewApi.updateStatus(id, newStatus)
      setActionMsg({ text: `Đã cập nhật trạng thái phỏng vấn thành ${newStatus}.`, type: 'success' })
      reloadData()
    } catch (err) {
      setActionMsg({ text: err.message || 'Không thể cập nhật trạng thái phỏng vấn.', type: 'danger' })
    } finally {
      setProcessing(false)
    }
  }

  if (loading) return <Loading />
  if (error) return <div className="alert alert-danger">{error}</div>
  if (!interview) return <div className="alert alert-warning">Không tìm thấy buổi phỏng vấn.</div>

  const isAdminOrHr = ['ADMIN', 'HR'].includes(user.role)
  const isAssignedInterviewer = Number(user.id) === Number(interview.interviewer_id)
  const canComplete = (isAdminOrHr || isAssignedInterviewer) && interview.status === 'SCHEDULED'
  const canCancel = isAdminOrHr && interview.status === 'SCHEDULED'
  const canEdit = isAdminOrHr && interview.status === 'SCHEDULED'

  return (
    <div>
      {/* Top Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div className="d-flex align-items-center gap-3">
          <Link to="/interviews" className="btn btn-sm btn-outline-secondary rounded-pill px-3">
            <i className="bi bi-arrow-left me-1"></i> Quay lại
          </Link>
          <div>
            <div className="d-flex align-items-center gap-2">
              <h1 className="h4 mb-0 fw-bold">Chi tiết phỏng vấn #{interview.id}</h1>
              <span className={`badge ${statusBadgeClass(interview.status)} px-3 py-2 rounded-pill`}>
                {interview.status}
              </span>
            </div>
            <p className="text-muted small mb-0 mt-1">
              Ứng viên: <strong className="text-dark">{interview.candidate_name}</strong> &bull; Vị trí: <strong className="text-dark">{interview.job_title}</strong>
            </p>
          </div>
        </div>

        <div className="d-flex gap-2">
          {canEdit && (
            <Link className="btn btn-outline-primary rounded-pill px-3" to={`/interviews/${interview.id}/edit`}>
              <i className="bi bi-pencil me-1"></i> Sửa lịch
            </Link>
          )}
          <Link className="btn btn-primary rounded-pill px-3" to={`/applications/${interview.application_id}`}>
            <i className="bi bi-file-earmark-person me-1"></i> Xem hồ sơ ứng tuyển
          </Link>
        </div>
      </div>

      {actionMsg.text && (
        <div className={`alert alert-${actionMsg.type} alert-dismissible fade show rounded-3 mb-4`} role="alert">
          <i className={`bi ${actionMsg.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2`}></i>
          {actionMsg.text}
          <button
            type="button"
            className="btn-close"
            onClick={() => setActionMsg({ text: '', type: '' })}
            aria-label="Close"
          />
        </div>
      )}

      <div className="row g-4 mb-4">
        {/* Thông tin chi tiết */}
        <div className="col-lg-7">
          <div className="card-modern h-100 p-4">
            <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
              <h6 className="fw-bold mb-0 text-dark">
                <i className="bi bi-info-circle text-primary me-2"></i>Thông tin lịch phỏng vấn
              </h6>
            </div>

            <div className="row g-3">
              <div className="col-sm-6">
                <div className="p-3 rounded-3 bg-light">
                  <span className="text-muted small d-block mb-1">
                    <i className="bi bi-person me-1"></i>Ứng viên
                  </span>
                  <div className="d-flex align-items-center gap-2 mt-1">
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center bg-primary text-white fw-bold"
                      style={{ width: '32px', height: '32px', fontSize: '0.75rem' }}
                    >
                      {getInitials(interview.candidate_name)}
                    </div>
                    <div>
                      <div className="fw-semibold text-dark">{interview.candidate_name || '-'}</div>
                      <div className="small text-muted">{interview.candidate_email}</div>
                    </div>
                  </div>
                  {interview.candidate_id && (
                    <Link to={`/candidates/${interview.candidate_id}`} className="small text-primary mt-2 d-inline-block text-decoration-none">
                      Hồ sơ ứng viên <i className="bi bi-chevron-right small"></i>
                    </Link>
                  )}
                </div>
              </div>

              <div className="col-sm-6">
                <div className="p-3 rounded-3 bg-light">
                  <span className="text-muted small d-block mb-1">
                    <i className="bi bi-briefcase me-1"></i>Vị trí ứng tuyển
                  </span>
                  <div className="fw-semibold text-dark mt-1">{interview.job_title || '-'}</div>
                  <Link to={`/applications/${interview.application_id}`} className="small text-primary mt-2 d-inline-block text-decoration-none">
                    Hồ sơ #{interview.application_id} <i className="bi bi-chevron-right small"></i>
                  </Link>
                </div>
              </div>

              <div className="col-sm-6">
                <div className="p-3 rounded-3 bg-light">
                  <span className="text-muted small d-block mb-1">
                    <i className="bi bi-person-badge me-1"></i>Người phỏng vấn
                  </span>
                  <div className="d-flex align-items-center gap-2 mt-1">
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center bg-indigo text-white fw-bold"
                      style={{ width: '32px', height: '32px', fontSize: '0.75rem', backgroundColor: '#6366f1' }}
                    >
                      {getInitials(interview.interviewer_name)}
                    </div>
                    <div>
                      <div className="fw-semibold text-dark">{interview.interviewer_name || '-'}</div>
                      <div className="small text-muted">{interview.interviewer_email}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-sm-6">
                <div className="p-3 rounded-3 bg-light">
                  <span className="text-muted small d-block mb-1">
                    <i className="bi bi-calendar-check me-1"></i>Thời gian phỏng vấn
                  </span>
                  <div className="fw-bold text-primary mt-1">
                    {interview.interview_date
                      ? new Date(interview.interview_date).toLocaleString('vi-VN', {
                          dateStyle: 'full',
                          timeStyle: 'short',
                        })
                      : '-'}
                  </div>
                </div>
              </div>

              <div className="col-12">
                <div className="p-3 rounded-3 bg-light">
                  <span className="text-muted small d-block mb-1">
                    <i className="bi bi-geo-alt me-1"></i>Địa điểm / Hình thức
                  </span>
                  <div className="fw-semibold text-dark">
                    {interview.location || 'Chưa cập nhật'}
                  </div>
                </div>
              </div>

              <div className="col-12">
                <div className="p-3 rounded-3 bg-light">
                  <span className="text-muted small d-block mb-1">
                    <i className="bi bi-chat-left-text me-1"></i>Ghi chú
                  </span>
                  <div className="text-muted small text-preline">
                    {interview.note || 'Không có ghi chú.'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cập nhật trạng thái & Phím tắt */}
        <div className="col-lg-5">
          <div className="card-modern h-100 p-4 d-flex flex-column justify-content-between">
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                <h6 className="fw-bold mb-0 text-dark">
                  <i className="bi bi-sliders text-primary me-2"></i>Quy trình phỏng vấn
                </h6>
              </div>

              <div className="p-3 rounded-3 bg-light mb-3">
                <div className="small text-muted mb-2">
                  <i className="bi bi-info-circle me-1"></i>Quy trình chuẩn:
                </div>
                <div className="d-flex align-items-center gap-2 small">
                  <span className="badge soft-badge-primary">SCHEDULED</span>
                  <i className="bi bi-arrow-right text-muted"></i>
                  <span className="badge soft-badge-success">COMPLETED</span>
                  <span className="text-muted">hoặc</span>
                  <span className="badge soft-badge-secondary">CANCELLED</span>
                </div>
              </div>

              {interview.status === 'SCHEDULED' ? (
                <div className="d-flex flex-column gap-2">
                  {canComplete && (
                    <button
                      className="btn btn-success rounded-pill w-100 py-2 fw-semibold"
                      disabled={processing}
                      onClick={() => handleStatusChange('COMPLETED')}
                    >
                      <i className="bi bi-check-circle-fill me-2"></i>Hoàn thành phỏng vấn (COMPLETED)
                    </button>
                  )}
                  {canCancel && (
                    <button
                      className="btn btn-outline-danger rounded-pill w-100 py-2 fw-semibold"
                      disabled={processing}
                      onClick={() => handleStatusChange('CANCELLED')}
                    >
                      <i className="bi bi-x-circle me-2"></i>Hủy phỏng vấn (CANCELLED)
                    </button>
                  )}
                  {!canComplete && !canCancel && (
                    <div className="alert alert-secondary mb-0 small rounded-3">
                      <i className="bi bi-lock me-1"></i>Bạn chỉ có quyền xem thông tin buổi phỏng vấn này.
                    </div>
                  )}
                </div>
              ) : (
                <div className="alert alert-secondary mb-0 rounded-3">
                  <i className="bi bi-flag-fill me-2"></i>
                  Trạng thái hiện tại: <strong>{interview.status}</strong>. Phỏng vấn đã kết thúc chu trình.
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-top">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="fw-semibold text-dark small">Đánh giá ứng viên</div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>Chấm điểm chuyên môn & kinh nghiệm</div>
                </div>
                <Link
                  to={`/applications/${interview.application_id}/evaluations/create`}
                  className="btn btn-sm btn-outline-success rounded-pill px-3"
                >
                  <i className="bi bi-star-fill me-1 text-warning"></i> + Viết đánh giá
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Danh sách đánh giá của hồ sơ */}
      <div className="card-modern p-4">
        <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom flex-wrap gap-2">
          <div>
            <h6 className="fw-bold mb-0 text-dark">
              <i className="bi bi-clipboard-check text-primary me-2"></i>
              Bảng đánh giá ứng viên (Hồ sơ #{interview.application_id})
            </h6>
            <span className="text-muted small">
              Tổng số {evaluations.length} lượt đánh giá từ hội đồng tuyển dụng
            </span>
          </div>
          <Link
            to={`/applications/${interview.application_id}/evaluations/create`}
            className="btn btn-sm btn-primary rounded-pill px-3"
          >
            <i className="bi bi-plus-lg me-1"></i> Thêm đánh giá
          </Link>
        </div>

        {evaluations.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-chat-square-quote text-muted opacity-50 fs-1 d-block mb-2"></i>
            <p className="text-muted mb-3">Chưa có đánh giá nào cho ứng viên này. Hãy gửi đánh giá sau buổi phỏng vấn!</p>
            <Link
              to={`/applications/${interview.application_id}/evaluations/create`}
              className="btn btn-sm btn-outline-primary rounded-pill px-3"
            >
              <i className="bi bi-star me-1"></i> Đánh giá ngay
            </Link>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-modern align-middle mb-0">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>#</th>
                  <th>Người đánh giá</th>
                  <th className="text-center">Chuyên môn</th>
                  <th className="text-center">Giao tiếp</th>
                  <th className="text-center">Kinh nghiệm</th>
                  <th className="text-center">Điểm TB</th>
                  <th>Nhận xét</th>
                  <th style={{ width: '130px' }}>Thời gian</th>
                  <th className="text-end" style={{ width: '90px' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {evaluations.map((ev) => {
                  const canEditEval = user.role === 'ADMIN' || Number(ev.evaluator_id) === Number(user.id)
                  return (
                    <tr key={ev.id}>
                      <td className="fw-semibold text-muted">#{ev.id}</td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center bg-light text-primary fw-bold border"
                            style={{ width: '32px', height: '32px', fontSize: '0.75rem' }}
                          >
                            {getInitials(ev.evaluator_name)}
                          </div>
                          <div>
                            <div className="fw-semibold text-dark">{ev.evaluator_name || '-'}</div>
                            <div className="text-muted" style={{ fontSize: '0.75rem' }}>{ev.evaluator_role}</div>
                          </div>
                        </div>
                      </td>
                      <td className="text-center">
                        <span className="badge soft-badge-secondary px-2 py-1">
                          <i className="bi bi-star-fill text-warning me-1"></i>{ev.technical_score}/5
                        </span>
                      </td>
                      <td className="text-center">
                        <span className="badge soft-badge-secondary px-2 py-1">
                          <i className="bi bi-star-fill text-warning me-1"></i>{ev.communication_score}/5
                        </span>
                      </td>
                      <td className="text-center">
                        <span className="badge soft-badge-secondary px-2 py-1">
                          <i className="bi bi-star-fill text-warning me-1"></i>{ev.experience_score}/5
                        </span>
                      </td>
                      <td className="text-center">
                        <span className="badge bg-success px-2 py-1 rounded-pill fw-bold">
                          {ev.average_score?.toFixed(2)}
                        </span>
                      </td>
                      <td>
                        <div className="small text-break" style={{ maxHeight: '60px', overflowY: 'auto' }}>
                          {ev.comment ? (
                            <span>{ev.comment}</span>
                          ) : (
                            <span className="text-muted fst-italic">Không có nhận xét</span>
                          )}
                        </div>
                      </td>
                      <td className="small text-muted">
                        <i className="bi bi-clock me-1"></i>
                        {ev.created_at ? new Date(ev.created_at).toLocaleDateString('vi-VN') : '-'}
                      </td>
                      <td className="text-end">
                        {canEditEval && (
                          <Link to={`/evaluations/${ev.id}/edit`} className="btn btn-sm btn-outline-secondary rounded-pill px-2">
                            <i className="bi bi-pencil me-1"></i>Sửa
                          </Link>
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
    </div>
  )
}

