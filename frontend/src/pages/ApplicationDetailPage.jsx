import { useCallback, useEffect, useState } from 'react'
import { Link, useOutletContext, useParams } from 'react-router-dom'
import Loading from '../components/Loading'
import { aiApi, applicationApi, cvUrl, evaluationApi, interviewApi } from '../services/api'

const nextStatusMap = {
  NEW: ['SCREENING', 'REJECTED'],
  SCREENING: ['INTERVIEW', 'REJECTED'],
  INTERVIEW: ['PASSED', 'REJECTED'],
  PASSED: [],
  REJECTED: [],
}

function interviewBadgeClass(status) {
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

function statusBadgeClass(status) {
  switch (status) {
    case 'NEW':
      return 'badge bg-secondary'
    case 'SCREENING':
      return 'badge bg-warning text-dark'
    case 'INTERVIEW':
      return 'badge bg-primary'
    case 'PASSED':
      return 'badge bg-success'
    case 'REJECTED':
      return 'badge bg-danger'
    default:
      return 'badge bg-light text-dark'
  }
}

function aiTypeBadge(type) {
  switch (type) {
    case 'CV_SUMMARY':
      return <span className="badge bg-primary">Tóm tắt CV</span>
    case 'INTERVIEW_QUESTION':
      return <span className="badge bg-info text-dark">Câu hỏi phỏng vấn</span>
    case 'EMAIL':
      return <span className="badge bg-success">Soạn thảo Email</span>
    default:
      return <span className="badge bg-secondary">{type}</span>
  }
}

export default function ApplicationDetailPage() {
  const { user } = useOutletContext()
  const { id } = useParams()
  const canUpdate = ['ADMIN', 'HR'].includes(user.role)

  const [state, setState] = useState({ loading: true, data: null, error: '' })
  const [interviews, setInterviews] = useState([])
  const [evaluations, setEvaluations] = useState([])
  const [selectedStatus, setSelectedStatus] = useState('')
  const [updating, setUpdating] = useState(false)
  const [actionMessage, setActionMessage] = useState({ text: '', type: '' })

  // AI Assistant State
  const [aiResults, setAiResults] = useState([])
  const [aiLoading, setAiLoading] = useState('')
  const [aiError, setAiError] = useState('')
  const [aiCurrentResult, setAiCurrentResult] = useState(null)
  const [emailType, setEmailType] = useState('INTERVIEW_INVITATION')
  const [copied, setCopied] = useState(false)

  const loadDetail = useCallback(() => {
    Promise.all([
      applicationApi.get(id),
      interviewApi.list(`?application_id=${id}`),
      evaluationApi.listByApplication(id),
      aiApi.listResults(id),
    ])
      .then(([appRes, intRes, evalRes, aiRes]) => {
        setState({ loading: false, data: appRes.data, error: '' })
        const current = appRes.data?.status
        const availableNext = nextStatusMap[current] || []
        setSelectedStatus(availableNext[0] || '')
        setInterviews(intRes.data || [])
        setEvaluations(evalRes.data || [])
        setAiResults(aiRes.data || [])
      })
      .catch((err) => {
        setState({ loading: false, data: null, error: err.message })
      })
  }, [id])

  async function handleCvSummary() {
    setAiLoading('CV_SUMMARY')
    setAiError('')
    try {
      const res = await aiApi.cvSummary(id)
      setAiCurrentResult(res.data)
      const listRes = await aiApi.listResults(id)
      setAiResults(listRes.data || [])
    } catch (err) {
      setAiError(err.message || 'Không thể sử dụng trợ lý AI lúc này.')
    } finally {
      setAiLoading('')
    }
  }

  async function handleInterviewQuestions() {
    setAiLoading('INTERVIEW_QUESTION')
    setAiError('')
    try {
      const res = await aiApi.interviewQuestions(id)
      setAiCurrentResult(res.data)
      const listRes = await aiApi.listResults(id)
      setAiResults(listRes.data || [])
    } catch (err) {
      setAiError(err.message || 'Không thể sử dụng trợ lý AI lúc này.')
    } finally {
      setAiLoading('')
    }
  }

  async function handleGenerateEmail() {
    setAiLoading('EMAIL')
    setAiError('')
    try {
      const res = await aiApi.email(id, emailType)
      setAiCurrentResult(res.data)
      const listRes = await aiApi.listResults(id)
      setAiResults(listRes.data || [])
    } catch (err) {
      setAiError(err.message || 'Không thể sử dụng trợ lý AI lúc này.')
    } finally {
      setAiLoading('')
    }
  }

  function handleCopy(text) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  useEffect(() => {
    loadDetail()
  }, [loadDetail])

  async function handleStatusUpdate(e) {
    e.preventDefault()
    if (!selectedStatus) return

    setUpdating(true)
    setActionMessage({ text: '', type: '' })

    try {
      await applicationApi.updateStatus(id, selectedStatus)
      setActionMessage({ text: `Đã chuyển trạng thái sang ${selectedStatus} thành công.`, type: 'success' })
      loadDetail()
    } catch (err) {
      setActionMessage({ text: err.message || 'Không thể cập nhật trạng thái.', type: 'danger' })
    } finally {
      setUpdating(false)
    }
  }

  if (state.loading) return <Loading />
  if (state.error) return <div className="alert alert-danger">{state.error}</div>
  if (!state.data) return <div className="alert alert-warning">Không tìm thấy hồ sơ ứng tuyển.</div>

  const app = state.data
  const candidate = app.candidate || {}
  const job = app.job || {}
  const currentStatus = app.status
  const allowedNext = nextStatusMap[currentStatus] || []
  const isFinalState = currentStatus === 'PASSED' || currentStatus === 'REJECTED'

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h1 className="h3 mb-1">Chi tiết hồ sơ #{app.id}</h1>
          <p className="text-muted mb-0">
            Ứng viên: <strong>{candidate.full_name}</strong> &mdash; Vị trí: <strong>{job.title}</strong>
          </p>
        </div>
        <Link className="btn btn-outline-secondary" to="/applications">
          Quay lại danh sách
        </Link>
      </div>

      {actionMessage.text && (
        <div className={`alert alert-${actionMessage.type} alert-dismissible fade show`} role="alert">
          {actionMessage.text}
          <button
            type="button"
            className="btn-close"
            onClick={() => setActionMessage({ text: '', type: '' })}
            aria-label="Close"
          />
        </div>
      )}

      <div className="row g-3">
        {/* Khu vuc 1: Thong tin Ho so & Tien trinh */}
        <div className="col-12">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-light fw-bold d-flex justify-content-between align-items-center">
              <span>Thông tin hồ sơ ứng tuyển</span>
              <span className={statusBadgeClass(currentStatus)}>{currentStatus}</span>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <dl className="row mb-0">
                    <dt className="col-sm-4">Mã hồ sơ</dt>
                    <dd className="col-sm-8">#{app.id}</dd>
                    <dt className="col-sm-4">Ngày nộp</dt>
                    <dd className="col-sm-8">
                      {app.applied_at ? new Date(app.applied_at).toLocaleString('vi-VN') : '-'}
                    </dd>
                    <dt className="col-sm-4">Ghi chú</dt>
                    <dd className="col-sm-8">{app.note || 'Không có ghi chú'}</dd>
                  </dl>
                </div>

                <div className="col-md-6 border-start-md">
                  <h6 className="fw-semibold mb-2">Trạng thái hồ sơ</h6>
                  {isFinalState ? (
                    <div className="alert alert-secondary py-2 mb-0">
                      <strong>Trạng thái cuối cùng:</strong> Hồ sơ đã đạt trạng thái <strong>{currentStatus}</strong> và không thể chuyển tiếp.
                    </div>
                  ) : canUpdate ? (
                    <form className="d-flex align-items-center gap-2" onSubmit={handleStatusUpdate}>
                      <label className="text-nowrap small fw-semibold">Chuyển sang:</label>
                      <select
                        className="form-select form-select-sm"
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        disabled={updating}
                      >
                        {allowedNext.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="btn btn-sm btn-primary text-nowrap"
                        disabled={updating || !selectedStatus}
                      >
                        {updating ? 'Đang lưu...' : 'Cập nhật'}
                      </button>
                    </form>
                  ) : (
                    <div className="text-muted small">
                      (Chế độ chỉ đọc cho vai trò {user.role})
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Khu vuc 2: Thong tin Ung vien */}
        <div className="col-md-6">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-light fw-bold d-flex justify-content-between align-items-center">
              <span>Thông tin ứng viên</span>
              <Link className="btn btn-sm btn-outline-primary" to={`/candidates/${candidate.id}`}>
                Xem hồ sơ gốc
              </Link>
            </div>
            <div className="card-body">
              <dl className="row mb-0">
                <dt className="col-sm-4">Họ tên</dt>
                <dd className="col-sm-8 fw-semibold">{candidate.full_name}</dd>
                <dt className="col-sm-4">Email</dt>
                <dd className="col-sm-8">{candidate.email || '-'}</dd>
                <dt className="col-sm-4">Điện thoại</dt>
                <dd className="col-sm-8">{candidate.phone || '-'}</dd>
                <dt className="col-sm-4">Nguồn</dt>
                <dd className="col-sm-8">{candidate.source || '-'}</dd>
                <dt className="col-sm-4">Kỹ năng</dt>
                <dd className="col-sm-8">{candidate.skills || '-'}</dd>
                <dt className="col-sm-4">Kinh nghiệm</dt>
                <dd className="col-sm-8 text-preline">{candidate.experience || '-'}</dd>
                <dt className="col-sm-4">Học vấn</dt>
                <dd className="col-sm-8 text-preline">{candidate.education || '-'}</dd>
                <dt className="col-sm-4">CV đính kèm</dt>
                <dd className="col-sm-8">
                  {candidate.cv_file ? (
                    <a href={cvUrl(candidate.cv_file)} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-info">
                      Xem file CV
                    </a>
                  ) : (
                    <span className="text-muted">Chưa đính kèm file CV</span>
                  )}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        {/* Khu vuc 3: Thong tin Vi tri tuyen dung */}
        <div className="col-md-6">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-light fw-bold d-flex justify-content-between align-items-center">
              <span>Thông tin vị trí tuyển dụng</span>
              <Link className="btn btn-sm btn-outline-primary" to={`/jobs/${job.id}`}>
                Xem vị trí
              </Link>
            </div>
            <div className="card-body">
              <dl className="row mb-0">
                <dt className="col-sm-4">Tên vị trí</dt>
                <dd className="col-sm-8 fw-semibold">{job.title}</dd>
                <dt className="col-sm-4">Phòng ban</dt>
                <dd className="col-sm-8">{job.department}</dd>
                <dt className="col-sm-4">Trạng thái</dt>
                <dd className="col-sm-8">
                  <span className={`badge ${job.status === 'OPEN' ? 'bg-success' : 'bg-secondary'}`}>
                    {job.status}
                  </span>
                </dd>
                <dt className="col-sm-4">Kỹ năng cần</dt>
                <dd className="col-sm-8">{job.skills || '-'}</dd>
                <dt className="col-sm-4">Mô tả</dt>
                <dd className="col-sm-8 text-preline">{job.description || '-'}</dd>
                <dt className="col-sm-4">Yêu cầu</dt>
                <dd className="col-sm-8 text-preline">{job.requirements || '-'}</dd>
              </dl>
            </div>
          </div>
        </div>

        {/* Khu vuc 4: Danh sach Lich phong van */}
        <div className="col-12">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-light fw-bold d-flex justify-content-between align-items-center">
              <span>Lịch phỏng vấn ({interviews.length})</span>
              {canUpdate && (
                <Link
                  className="btn btn-sm btn-primary"
                  to={`/interviews/create?application_id=${app.id}`}
                >
                  + Lên lịch phỏng vấn
                </Link>
              )}
            </div>
            <div className="card-body">
              {interviews.length === 0 ? (
                <p className="text-muted text-center py-3 mb-0">
                  Chưa có lịch phỏng vấn nào cho hồ sơ này.
                </p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: '60px' }}>#</th>
                        <th>Thời gian</th>
                        <th>Người phỏng vấn</th>
                        <th>Địa điểm / Link</th>
                        <th>Trạng thái</th>
                        <th className="text-end" style={{ width: '120px' }}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {interviews.map((iv) => (
                        <tr key={iv.id}>
                          <td className="fw-semibold">#{iv.id}</td>
                          <td>
                            {iv.interview_date
                              ? new Date(iv.interview_date).toLocaleString('vi-VN', {
                                  dateStyle: 'medium',
                                  timeStyle: 'short',
                                })
                              : '-'}
                          </td>
                          <td>
                            <div>{iv.interviewer_name || '-'}</div>
                            <div className="small text-muted">{iv.interviewer_email}</div>
                          </td>
                          <td>{iv.location || '-'}</td>
                          <td>
                            <span className={interviewBadgeClass(iv.status)}>
                              {iv.status}
                            </span>
                          </td>
                          <td className="text-end">
                            <Link to={`/interviews/${iv.id}`} className="btn btn-sm btn-outline-primary">
                              Chi tiết
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Khu vuc 5: Danh sach Danh gia */}
        <div className="col-12">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-light fw-bold d-flex justify-content-between align-items-center">
              <span>Đánh giá ứng viên ({evaluations.length})</span>
              <Link
                className="btn btn-sm btn-success"
                to={`/applications/${app.id}/evaluations/create`}
              >
                + Thêm đánh giá
              </Link>
            </div>
            <div className="card-body">
              {evaluations.length === 0 ? (
                <p className="text-muted text-center py-3 mb-0">
                  Chưa có đánh giá nào cho ứng viên này.
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
                            <td className="text-center">
                              <span className="badge bg-light text-dark border">{ev.technical_score}/5</span>
                            </td>
                            <td className="text-center">
                              <span className="badge bg-light text-dark border">{ev.communication_score}/5</span>
                            </td>
                            <td className="text-center">
                              <span className="badge bg-light text-dark border">{ev.experience_score}/5</span>
                            </td>
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
        </div>

        {/* Khu vuc 6: Tro ly AI (Google Gemini) */}
        <div className="col-12">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-primary text-white fw-bold d-flex justify-content-between align-items-center">
              <span>Trợ lý AI (Google Gemini)</span>
              <span className="badge bg-light text-primary">Hỗ trợ ra quyết định</span>
            </div>
            <div className="card-body">
              <div className="alert alert-info py-2 d-flex align-items-center mb-3">
                <span className="me-2">ℹ️</span>
                <span className="small">
                  <strong>Lưu ý:</strong> AI chỉ hỗ trợ cung cấp thông tin tham khảo. Quyết định tuyển dụng do người phụ trách thực hiện.
                </span>
              </div>

              {aiError && (
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                  {aiError}
                  <button type="button" className="btn-close" onClick={() => setAiError('')} aria-label="Close" />
                </div>
              )}

              {/* 3 action cards / buttons */}
              <div className="row g-3 mb-4">
                <div className="col-md-4">
                  <div className="border rounded p-3 h-100 d-flex flex-column justify-content-between">
                    <div>
                      <h6 className="fw-semibold">Tóm tắt CV bằng AI</h6>
                      <p className="small text-muted mb-3">
                        Trích xuất kinh nghiệm chính, kỹ năng phù hợp và nội dung cần làm rõ từ CV.
                      </p>
                    </div>
                    <button
                      className="btn btn-outline-primary w-100"
                      disabled={Boolean(aiLoading)}
                      onClick={handleCvSummary}
                    >
                      {aiLoading === 'CV_SUMMARY' ? 'AI đang xử lý...' : '✨ Tóm tắt CV'}
                    </button>
                  </div>
                </div>

                <div className="col-md-4">
                  <div className="border rounded p-3 h-100 d-flex flex-column justify-content-between">
                    <div>
                      <h6 className="fw-semibold">Gợi ý câu hỏi phỏng vấn</h6>
                      <p className="small text-muted mb-3">
                        Đề xuất 5 câu hỏi phỏng vấn kỹ thuật và kinh nghiệm bám sát hồ sơ ứng viên.
                      </p>
                    </div>
                    <button
                      className="btn btn-outline-info w-100"
                      disabled={Boolean(aiLoading)}
                      onClick={handleInterviewQuestions}
                    >
                      {aiLoading === 'INTERVIEW_QUESTION' ? 'AI đang xử lý...' : '✨ Gợi ý câu hỏi phỏng vấn'}
                    </button>
                  </div>
                </div>

                <div className="col-md-4">
                  <div className="border rounded p-3 h-100 d-flex flex-column justify-content-between">
                    <div>
                      <h6 className="fw-semibold">Soạn email bằng AI</h6>
                      <p className="small text-muted mb-2">
                        Tự động sinh bản thảo email mời phỏng vấn hoặc thông báo kết quả.
                      </p>
                      {canUpdate ? (
                        <select
                          className="form-select form-select-sm mb-3"
                          value={emailType}
                          onChange={(e) => setEmailType(e.target.value)}
                          disabled={Boolean(aiLoading)}
                        >
                          <option value="INTERVIEW_INVITATION">Mời phỏng vấn</option>
                          <option value="RESULT">Thông báo kết quả ({currentStatus})</option>
                        </select>
                      ) : (
                        <div className="small text-muted mb-3">(Chỉ ADMIN và HR có quyền soạn email)</div>
                      )}
                    </div>
                    {canUpdate && (
                      <button
                        className="btn btn-outline-success w-100"
                        disabled={Boolean(aiLoading)}
                        onClick={handleGenerateEmail}
                      >
                        {aiLoading === 'EMAIL' ? 'AI đang xử lý...' : '✨ Soạn email'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Ket qua AI vua sinh */}
              {aiCurrentResult && (
                <div className="card border-primary mb-4 bg-light">
                  <div className="card-header bg-light d-flex justify-content-between align-items-center">
                    <span className="fw-semibold">
                      Kết quả vừa sinh: {aiTypeBadge(aiCurrentResult.type)}
                    </span>
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => handleCopy(aiCurrentResult.content)}
                    >
                      {copied ? '✓ Đã sao chép' : 'Sao chép'}
                    </button>
                  </div>
                  <div className="card-body">
                    <div className="p-3 bg-white rounded border" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                      {aiCurrentResult.content}
                    </div>
                  </div>
                </div>
              )}

              {/* Lich su ket qua AI gan day */}
              <div className="mt-2">
                <h6 className="fw-bold mb-3">Kết quả AI gần đây ({aiResults.length})</h6>
                {aiResults.length === 0 ? (
                  <p className="text-muted small mb-0">Chưa có kết quả AI nào được tạo cho hồ sơ này.</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th style={{ width: '60px' }}>#</th>
                          <th style={{ width: '180px' }}>Loại kết quả</th>
                          <th>Nội dung</th>
                          <th style={{ width: '160px' }}>Thời gian</th>
                          <th className="text-end" style={{ width: '100px' }}>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {aiResults.map((item) => (
                          <tr key={item.id}>
                            <td className="fw-semibold">#{item.id}</td>
                            <td>{aiTypeBadge(item.type)}</td>
                            <td>
                              <div className="small text-truncate" style={{ maxWidth: '450px' }}>
                                {item.content}
                              </div>
                            </td>
                            <td className="small text-muted">
                              {item.created_at ? new Date(item.created_at).toLocaleString('vi-VN') : '-'}
                            </td>
                            <td className="text-end">
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => {
                                  setAiCurrentResult(item)
                                  window.scrollTo({ top: 300, behavior: 'smooth' })
                                }}
                              >
                                Xem
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
