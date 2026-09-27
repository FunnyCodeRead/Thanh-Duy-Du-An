import { useCallback, useEffect, useState } from 'react'
import { Link, useOutletContext, useParams } from 'react-router-dom'
import Loading from '../components/Loading'
import PageHeader from '../components/PageHeader'
import StatusBadge from '../components/StatusBadge'
import { interviewApi } from '../services/api'
import { formatInterviewStatus } from '../utils/formatters'

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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionMsg, setActionMsg] = useState({ text: '', type: '' })
  const [processing, setProcessing] = useState(false)

  const reloadData = useCallback(async () => {
    try {
      const res = await interviewApi.get(id)
      setInterview(res.data)
    } catch (err) {
      setError(err.message || 'Lỗi khi tải thông tin phỏng vấn.')
    }
  }, [id])

  useEffect(() => {
    interviewApi.get(id)
      .then((res) => {
        setInterview(res.data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message || 'Lỗi khi tải thông tin phỏng vấn.')
        setLoading(false)
      })
  }, [id])

  async function handleStatusChange(newStatus) {
    const statusText = formatInterviewStatus(newStatus)
    if (!window.confirm(`Bạn có chắc muốn chuyển trạng thái phỏng vấn sang "${statusText}"?`)) {
      return
    }
    setProcessing(true)
    setActionMsg({ text: '', type: '' })
    try {
      await interviewApi.updateStatus(id, newStatus)
      setActionMsg({ text: `Đã cập nhật trạng thái phỏng vấn thành "${statusText}".`, type: 'success' })
      reloadData()
    } catch (err) {
      setActionMsg({ text: err.message || 'Không thể cập nhật trạng thái phỏng vấn.', type: 'danger' })
    } finally {
      setProcessing(false)
    }
  }

  if (loading) return <Loading message="Đang tải chi tiết buổi phỏng vấn..." />
  if (error) return <div className="alert alert-danger my-4">{error}</div>
  if (!interview) return <div className="alert alert-warning my-4">Không tìm thấy thông tin buổi phỏng vấn.</div>

  const isAdminOrHr = ['ADMIN', 'HR'].includes(user?.role)
  const isAssignedInterviewer = Number(user?.id) === Number(interview.interviewer_id)
  const canComplete = (isAdminOrHr || isAssignedInterviewer) && interview.status === 'SCHEDULED'
  const canCancel = isAdminOrHr && interview.status === 'SCHEDULED'
  const canEdit = isAdminOrHr && interview.status === 'SCHEDULED'

  return (
    <>
      <PageHeader
        title={`Chi tiết phỏng vấn #${interview.id}`}
        description={`Ứng viên: ${interview.candidate_name || '—'} • Vị trí: ${interview.job_title || '—'}`}
        badge={<StatusBadge status={interview.status} />}
        action={
          <div className="d-flex align-items-center gap-2">
            <Link to="/interviews" className="btn btn-secondary-modern btn-sm text-decoration-none">
              <i className="bi bi-arrow-left" />
              <span>Quay lại</span>
            </Link>
            {canEdit && (
              <Link to={`/interviews/${interview.id}/edit`} className="btn btn-secondary-modern btn-sm text-decoration-none">
                <i className="bi bi-pencil" />
                <span>Sửa lịch</span>
              </Link>
            )}
            <Link to={`/applications/${interview.application_id}`} className="btn btn-primary-modern btn-sm text-decoration-none">
              <i className="bi bi-file-earmark-person" />
              <span>Xem hồ sơ ứng tuyển</span>
            </Link>
          </div>
        }
      />

      {actionMsg.text && (
        <div className={`alert alert-${actionMsg.type} alert-dismissible fade show rounded-3 mb-4`} role="alert">
          <i className={`bi ${actionMsg.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2`} />
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
        <div className="col-12 col-lg-7">
          <div className="card-modern h-100">
            <div className="card-modern-header">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-info-circle text-primary" />
                <span>Thông tin lịch phỏng vấn</span>
              </div>
              <StatusBadge status={interview.status} />
            </div>

            <div className="card-modern-body">
              <div className="row g-3">
                <div className="col-sm-6">
                  <div className="p-3 rounded-3 bg-light border">
                    <span className="text-muted small d-block mb-1">
                      <i className="bi bi-person me-1" />Ứng viên
                    </span>
                    <div className="d-flex align-items-center gap-2 mt-1">
                      <div className="table-avatar-initials" style={{ width: '32px', height: '32px', fontSize: '0.75rem' }}>
                        {getInitials(interview.candidate_name)}
                      </div>
                      <div>
                        <div className="fw-semibold text-dark">{interview.candidate_name || '-'}</div>
                        <div className="small text-muted" style={{ fontSize: '0.75rem' }}>{interview.candidate_email}</div>
                      </div>
                    </div>
                    {interview.candidate_id && (
                      <Link to={`/candidates/${interview.candidate_id}`} className="small text-primary mt-2 d-inline-block text-decoration-none">
                        Xem hồ sơ ứng viên <i className="bi bi-chevron-right" style={{ fontSize: '0.65rem' }} />
                      </Link>
                    )}
                  </div>
                </div>

                <div className="col-sm-6">
                  <div className="p-3 rounded-3 bg-light border">
                    <span className="text-muted small d-block mb-1">
                      <i className="bi bi-briefcase me-1" />Vị trí ứng tuyển
                    </span>
                    <div className="fw-semibold text-dark mt-1">{interview.job_title || '-'}</div>
                    <Link to={`/applications/${interview.application_id}`} className="small text-primary mt-2 d-inline-block text-decoration-none">
                      Hồ sơ ứng tuyển #{interview.application_id} <i className="bi bi-chevron-right" style={{ fontSize: '0.65rem' }} />
                    </Link>
                  </div>
                </div>

                <div className="col-sm-6">
                  <div className="p-3 rounded-3 bg-light border">
                    <span className="text-muted small d-block mb-1">
                      <i className="bi bi-person-badge me-1" />Người phỏng vấn phụ trách
                    </span>
                    <div className="d-flex align-items-center gap-2 mt-1">
                      <div className="table-avatar-initials" style={{ width: '32px', height: '32px', fontSize: '0.75rem' }}>
                        {getInitials(interview.interviewer_name)}
                      </div>
                      <div>
                        <div className="fw-semibold text-dark">{interview.interviewer_name || '-'}</div>
                        <div className="small text-muted" style={{ fontSize: '0.75rem' }}>{interview.interviewer_email}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-sm-6">
                  <div className="p-3 rounded-3 bg-light border">
                    <span className="text-muted small d-block mb-1">
                      <i className="bi bi-calendar-check me-1" />Thời gian phỏng vấn
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
                  <div className="p-3 rounded-3 bg-light border">
                    <span className="text-muted small d-block mb-1">
                      <i className="bi bi-geo-alt me-1 text-danger" />Địa điểm / Hình thức
                    </span>
                    <div className="fw-semibold text-dark">
                      {interview.location || 'Chưa cập nhật'}
                    </div>
                  </div>
                </div>

                <div className="col-12">
                  <div className="p-3 rounded-3 bg-light border">
                    <span className="text-muted small d-block mb-1">
                      <i className="bi bi-chat-left-text me-1" />Ghi chú buổi phỏng vấn
                    </span>
                    <div className="text-muted small text-preline">
                      {interview.note || 'Không có ghi chú.'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cập nhật trạng thái */}
        <div className="col-12 col-lg-5">
          <div className="card-modern h-100 d-flex flex-column justify-content-between">
            <div>
              <div className="card-modern-header">
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-sliders text-primary" />
                  <span>Xử lý trạng thái phỏng vấn</span>
                </div>
              </div>

              <div className="card-modern-body">
                <div className="p-3 rounded-3 bg-light border mb-3">
                  <div className="small text-muted mb-2">
                    <i className="bi bi-info-circle me-1" />Quy trình chuyển tiếp:
                  </div>
                  <div className="d-flex align-items-center gap-1.5 small flex-wrap">
                    <span className="soft-badge soft-badge-primary">Đã lên lịch</span>
                    <i className="bi bi-arrow-right text-muted" />
                    <span className="soft-badge soft-badge-success">Đã hoàn thành</span>
                    <span className="text-muted">hoặc</span>
                    <span className="soft-badge soft-badge-danger">Đã hủy</span>
                  </div>
                </div>

                {interview.status === 'SCHEDULED' ? (
                  <div className="d-flex flex-column gap-2">
                    {canComplete && (
                      <button
                        type="button"
                        className="btn btn-success py-2 fw-semibold w-100 d-inline-flex align-items-center justify-content-center gap-2"
                        style={{ borderRadius: 'var(--radius-md)' }}
                        disabled={processing}
                        onClick={() => handleStatusChange('COMPLETED')}
                      >
                        <i className="bi bi-check-circle-fill" />
                        <span>Xác nhận hoàn thành phỏng vấn</span>
                      </button>
                    )}
                    {canCancel && (
                      <button
                        type="button"
                        className="btn btn-outline-danger py-2 fw-semibold w-100 d-inline-flex align-items-center justify-content-center gap-2"
                        style={{ borderRadius: 'var(--radius-md)' }}
                        disabled={processing}
                        onClick={() => handleStatusChange('CANCELLED')}
                      >
                        <i className="bi bi-x-circle" />
                        <span>Hủy buổi phỏng vấn</span>
                      </button>
                    )}
                    {!canComplete && !canCancel && (
                      <div className="alert alert-secondary mb-0 small rounded-3">
                        <i className="bi bi-lock me-1" />Bạn chỉ có quyền xem thông tin buổi phỏng vấn này.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="alert alert-secondary mb-0 small rounded-3">
                    <i className="bi bi-info-circle me-1" />
                    Buổi phỏng vấn đang ở trạng thái <strong>{formatInterviewStatus(interview.status)}</strong> và không thể thay đổi thêm.
                  </div>
                )}
              </div>
            </div>

            <div className="card-modern-header border-top border-bottom-0 bg-light">
              <span className="text-muted small">
                Cập nhật lần cuối: {new Date(interview.updated_at || interview.created_at).toLocaleString('vi-VN')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
