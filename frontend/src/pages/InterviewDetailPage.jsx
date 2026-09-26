import { useCallback, useEffect, useState } from 'react'
import { Link, useOutletContext, useParams } from 'react-router-dom'
import Loading from '../components/Loading'
import { evaluationApi, interviewApi } from '../services/api'

function statusBadgeClass(status) {
  switch (status) {
    case 'SCHEDULED':
      return 'badge bg-primary'
    case 'COMPLETED':
      return 'badge bg-success'
    case 'CANCELLED':
      return 'badge bg-secondary'
    default:
      return 'badge bg-light text-dark'
  }
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
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h1 className="h3 mb-1">Chi tiết phỏng vấn #{interview.id}</h1>
          <p className="text-muted mb-0">
            Ứng viên: <strong>{interview.candidate_name}</strong> &mdash; Vị trí: <strong>{interview.job_title}</strong>
          </p>
        </div>
        <div className="d-flex gap-2">
          {canEdit && (
            <Link className="btn btn-outline-primary" to={`/interviews/${interview.id}/edit`}>
              Sửa lịch phỏng vấn
            </Link>
          )}
          <Link className="btn btn-outline-secondary" to="/interviews">
            Quay lại danh sách
          </Link>
        </div>
      </div>

      {actionMsg.text && (
        <div className={`alert alert-${actionMsg.type} alert-dismissible fade show`} role="alert">
          {actionMsg.text}
          <button
            type="button"
            className="btn-close"
            onClick={() => setActionMsg({ text: '', type: '' })}
            aria-label="Close"
          />
        </div>
      )}

      <div className="row g-3 mb-4">
        {/* Thong tin buoi phong van */}
        <div className="col-lg-7">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-light fw-bold d-flex justify-content-between align-items-center">
              <span>Thông tin buổi phỏng vấn</span>
              <span className={statusBadgeClass(interview.status)}>{interview.status}</span>
            </div>
            <div className="card-body">
              <dl className="row mb-0">
                <dt className="col-sm-4">Hồ sơ ứng tuyển</dt>
                <dd className="col-sm-8">
                  <Link to={`/applications/${interview.application_id}`} className="fw-semibold">
                    Xem hồ sơ #{interview.application_id}
                  </Link>
                </dd>

                <dt className="col-sm-4">Ứng viên</dt>
                <dd className="col-sm-8">
                  <div className="fw-semibold">{interview.candidate_name || '-'}</div>
                  <div className="small text-muted">{interview.candidate_email}</div>
                  {interview.candidate_id && (
                    <Link to={`/candidates/${interview.candidate_id}`} className="small">
                      Xem chi tiết ứng viên &rarr;
                    </Link>
                  )}
                </dd>

                <dt className="col-sm-4">Vị trí tuyển dụng</dt>
                <dd className="col-sm-8">
                  <span className="fw-semibold">{interview.job_title || '-'}</span>
                </dd>

                <dt className="col-sm-4">Người phỏng vấn</dt>
                <dd className="col-sm-8">
                  <div className="fw-semibold">{interview.interviewer_name || '-'}</div>
                  <div className="small text-muted">{interview.interviewer_email}</div>
                </dd>

                <dt className="col-sm-4">Thời gian</dt>
                <dd className="col-sm-8 fw-semibold text-primary">
                  {interview.interview_date
                    ? new Date(interview.interview_date).toLocaleString('vi-VN', {
                        dateStyle: 'full',
                        timeStyle: 'short',
                      })
                    : '-'}
                </dd>

                <dt className="col-sm-4">Địa điểm / Hình thức</dt>
                <dd className="col-sm-8">{interview.location || 'Chưa cập nhật'}</dd>

                <dt className="col-sm-4">Ghi chú</dt>
                <dd className="col-sm-8 text-preline">{interview.note || 'Không có ghi chú'}</dd>
              </dl>
            </div>
          </div>
        </div>

        {/* Thao tac trang thai phong van */}
        <div className="col-lg-5">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-light fw-bold">
              <span>Cập nhật trạng thái</span>
            </div>
            <div className="card-body d-flex flex-column justify-content-between">
              <div>
                <p className="text-muted small mb-3">
                  Quy trình phỏng vấn: Buổi phỏng vấn khởi tạo ở trạng thái <code>SCHEDULED</code>. Sau khi diễn ra, người phỏng vấn hoặc HR/Admin cập nhật sang <code>COMPLETED</code> hoặc <code>CANCELLED</code>.
                </p>

                {interview.status === 'SCHEDULED' ? (
                  <div className="d-flex flex-column gap-2">
                    {canComplete && (
                      <button
                        className="btn btn-success w-100"
                        disabled={processing}
                        onClick={() => handleStatusChange('COMPLETED')}
                      >
                        ✓ Hoàn thành phỏng vấn (COMPLETED)
                      </button>
                    )}
                    {canCancel && (
                      <button
                        className="btn btn-outline-danger w-100"
                        disabled={processing}
                        onClick={() => handleStatusChange('CANCELLED')}
                      >
                        ✕ Hủy phỏng vấn (CANCELLED)
                      </button>
                    )}
                    {!canComplete && !canCancel && (
                      <div className="alert alert-secondary mb-0 small">
                        Bạn chỉ có quyền xem lịch phỏng vấn này.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="alert alert-secondary mb-0">
                    Trạng thái hiện tại: <strong>{interview.status}</strong>. Phỏng vấn đã kết thúc chu trình và không thể hoàn tác.
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-top">
                <div className="d-flex justify-content-between align-items-center">
                  <span className="small text-muted">Đánh giá ứng viên:</span>
                  <Link
                    to={`/applications/${interview.application_id}/evaluations/create`}
                    className="btn btn-sm btn-outline-success"
                  >
                    + Viết đánh giá
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Danh sach danh gia cua ho so */}
      <div className="card shadow-sm border-0">
        <div className="card-header bg-light fw-bold d-flex justify-content-between align-items-center">
          <span>Đánh giá ứng viên cho hồ sơ #{interview.application_id}</span>
          <Link
            to={`/applications/${interview.application_id}/evaluations/create`}
            className="btn btn-sm btn-primary"
          >
            + Thêm đánh giá
          </Link>
        </div>
        <div className="card-body">
          {evaluations.length === 0 ? (
            <p className="text-muted text-center py-3 mb-0">
              Chưa có đánh giá nào cho ứng viên này. Hãy gửi đánh giá sau buổi phỏng vấn!
            </p>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: '50px' }}>#</th>
                    <th>Người đánh giá</th>
                    <th className="text-center">Chuyên môn</th>
                    <th className="text-center">Giao tiếp</th>
                    <th className="text-center">Kinh nghiệm</th>
                    <th className="text-center">Điểm TB</th>
                    <th>Nhận xét</th>
                    <th style={{ width: '120px' }}>Thời gian</th>
                    <th className="text-end" style={{ width: '80px' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {evaluations.map((ev) => {
                    const canEditEval = user.role === 'ADMIN' || Number(ev.evaluator_id) === Number(user.id)
                    return (
                      <tr key={ev.id}>
                        <td className="fw-semibold">#{ev.id}</td>
                        <td>
                          <div className="fw-semibold">{ev.evaluator_name || '-'}</div>
                          <div className="small text-muted">{ev.evaluator_role}</div>
                        </td>
                        <td className="text-center"><span className="badge bg-light text-dark border">{ev.technical_score}/5</span></td>
                        <td className="text-center"><span className="badge bg-light text-dark border">{ev.communication_score}/5</span></td>
                        <td className="text-center"><span className="badge bg-light text-dark border">{ev.experience_score}/5</span></td>
                        <td className="text-center">
                          <span className="badge bg-success fs-6">{ev.average_score?.toFixed(2)}</span>
                        </td>
                        <td>
                          <div className="small text-break" style={{ maxHeight: '60px', overflowY: 'auto' }}>
                            {ev.comment || <span className="text-muted">Không có nhận xét</span>}
                          </div>
                        </td>
                        <td className="small text-muted">
                          {ev.created_at ? new Date(ev.created_at).toLocaleDateString('vi-VN') : '-'}
                        </td>
                        <td className="text-end">
                          {canEditEval && (
                            <Link to={`/evaluations/${ev.id}/edit`} className="btn btn-sm btn-outline-secondary">
                              Sửa
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
    </>
  )
}
