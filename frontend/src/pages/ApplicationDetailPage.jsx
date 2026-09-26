import { useCallback, useEffect, useState } from 'react'
import { Link, useOutletContext, useParams } from 'react-router-dom'
import Loading from '../components/Loading'
import { applicationApi, cvUrl } from '../services/api'

const nextStatusMap = {
  NEW: ['SCREENING', 'REJECTED'],
  SCREENING: ['INTERVIEW', 'REJECTED'],
  INTERVIEW: ['PASSED', 'REJECTED'],
  PASSED: [],
  REJECTED: [],
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

export default function ApplicationDetailPage() {
  const { user } = useOutletContext()
  const { id } = useParams()
  const canUpdate = ['ADMIN', 'HR'].includes(user.role)

  const [state, setState] = useState({ loading: true, data: null, error: '' })
  const [selectedStatus, setSelectedStatus] = useState('')
  const [updating, setUpdating] = useState(false)
  const [actionMessage, setActionMessage] = useState({ text: '', type: '' })

  const loadDetail = useCallback(() => {
    applicationApi
      .get(id)
      .then((res) => {
        setState({ loading: false, data: res.data, error: '' })
        const current = res.data?.status
        const availableNext = nextStatusMap[current] || []
        setSelectedStatus(availableNext[0] || '')
      })
      .catch((err) => {
        setState({ loading: false, data: null, error: err.message })
      })
  }, [id])

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

        {/* Milestone thong bao sau */}
        <div className="col-12">
          <div className="alert alert-info mb-0">
            Phỏng vấn và đánh giá sẽ được bổ sung ở milestone sau.
          </div>
        </div>
      </div>
    </>
  )
}
