import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Loading from '../components/Loading'
import { applicationApi, evaluationApi } from '../services/api'

export default function EvaluationFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  // Detect mode: if current pathname has '/evaluations/:id/edit', isEdit = true
  const isEdit = window.location.pathname.includes('/evaluations/') && window.location.pathname.endsWith('/edit')

  const [applicationId, setApplicationId] = useState(isEdit ? null : id)
  const [appInfo, setAppInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    technical_score: 3,
    communication_score: 3,
    experience_score: 3,
    comment: '',
  })

  useEffect(() => {
    if (isEdit) {
      evaluationApi.get(id)
        .then((evalRes) => {
          const ev = evalRes.data
          setApplicationId(ev.application_id)
          setForm({
            technical_score: ev.technical_score,
            communication_score: ev.communication_score,
            experience_score: ev.experience_score,
            comment: ev.comment || '',
          })
          if (ev.application_id) {
            return applicationApi.get(ev.application_id)
          }
          return null
        })
        .then((aRes) => {
          if (aRes?.data) setAppInfo(aRes.data)
          setLoading(false)
        })
        .catch((err) => {
          setError(err.message || 'Lỗi khi tải dữ liệu.')
          setLoading(false)
        })
    } else {
      applicationApi.get(id)
        .then((aRes) => {
          setAppInfo(aRes.data)
          setLoading(false)
        })
        .catch((err) => {
          setError(err.message || 'Lỗi khi tải dữ liệu.')
          setLoading(false)
        })
    }
  }, [id, isEdit])

  const tech = Number(form.technical_score) || 0
  const comm = Number(form.communication_score) || 0
  const exp = Number(form.experience_score) || 0
  const averageScore = ((tech + comm + exp) / 3).toFixed(2)

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const payload = {
        technical_score: Number(form.technical_score),
        communication_score: Number(form.communication_score),
        experience_score: Number(form.experience_score),
        comment: form.comment,
      }

      if (isEdit) {
        await evaluationApi.update(id, payload)
        navigate(`/applications/${applicationId}`)
      } else {
        await evaluationApi.create({
          application_id: Number(applicationId),
          ...payload,
        })
        navigate(`/applications/${applicationId}`)
      }
    } catch (err) {
      setError(err.message || 'Lỗi khi lưu đánh giá.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Loading />

  const targetAppId = applicationId || id

  return (
    <div className="container-fluid px-0">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h1 className="h3 mb-1">{isEdit ? `Sửa đánh giá #${id}` : 'Thêm đánh giá ứng viên'}</h1>
          {appInfo && (
            <p className="text-muted mb-0">
              Hồ sơ #{appInfo.id} &mdash; Ứng viên: <strong>{appInfo.candidate?.full_name}</strong> &mdash; Vị trí: <strong>{appInfo.job?.title}</strong>
            </p>
          )}
        </div>
        <Link className="btn btn-outline-secondary" to={`/applications/${targetAppId}`}>
          Quay lại hồ sơ
        </Link>
      </div>

      {error && <div className="alert alert-danger mb-3">{error}</div>}

      <div className="card shadow-sm border-0">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row g-4">
              {/* Điểm chuyên môn */}
              <div className="col-md-4">
                <label className="form-label fw-semibold">
                  Điểm chuyên môn (1 - 5) <span className="text-danger">*</span>
                </label>
                <select
                  className="form-select"
                  value={form.technical_score}
                  onChange={(e) => setForm({ ...form, technical_score: Number(e.target.value) })}
                  required
                >
                  <option value={1}>1 - Kém (Chưa đáp ứng)</option>
                  <option value={2}>2 - Yếu (Cần đào tạo nhiều)</option>
                  <option value={3}>3 - Trung bình (Đáp ứng cơ bản)</option>
                  <option value={4}>4 - Khá (Nắm vững chuyên môn)</option>
                  <option value={5}>5 - Xuất sắc (Vượt mong đợi)</option>
                </select>
                <div className="form-text">Đánh giá kiến thức nền tảng và kỹ năng kỹ thuật.</div>
              </div>

              {/* Điểm giao tiếp */}
              <div className="col-md-4">
                <label className="form-label fw-semibold">
                  Điểm giao tiếp (1 - 5) <span className="text-danger">*</span>
                </label>
                <select
                  className="form-select"
                  value={form.communication_score}
                  onChange={(e) => setForm({ ...form, communication_score: Number(e.target.value) })}
                  required
                >
                  <option value={1}>1 - Kém (Khó diễn đạt)</option>
                  <option value={2}>2 - Yếu (Thiếu tự tin, lan man)</option>
                  <option value={3}>3 - Trung bình (Giao tiếp ổn)</option>
                  <option value={4}>4 - Khá (Trình bày rõ ràng, mạch lạc)</option>
                  <option value={5}>5 - Xuất sắc (Thuyết phục, tương tác xuất sắc)</option>
                </select>
                <div className="form-text">Đánh giá khả năng lắng nghe và truyền đạt.</div>
              </div>

              {/* Điểm kinh nghiệm */}
              <div className="col-md-4">
                <label className="form-label fw-semibold">
                  Điểm kinh nghiệm (1 - 5) <span className="text-danger">*</span>
                </label>
                <select
                  className="form-select"
                  value={form.experience_score}
                  onChange={(e) => setForm({ ...form, experience_score: Number(e.target.value) })}
                  required
                >
                  <option value={1}>1 - Rất ít / Chưa liên quan</option>
                  <option value={2}>2 - Hạn chế trong lĩnh vực tương đương</option>
                  <option value={3}>3 - Đủ kinh nghiệm theo yêu cầu vị trí</option>
                  <option value={4}>4 - Kinh nghiệm thực tế phong phú</option>
                  <option value={5}>5 - Chuyên gia / Dày dạn kinh nghiệm</option>
                </select>
                <div className="form-text">Đánh giá mức độ phù hợp của các dự án trước đây.</div>
              </div>

              {/* Tinh toan diem trung binh */}
              <div className="col-12">
                <div className="p-3 bg-light rounded border d-flex justify-content-between align-items-center">
                  <div>
                    <span className="fw-semibold">Điểm trung bình tạm tính:</span>
                    <span className="text-muted ms-2">(Chuyên môn + Giao tiếp + Kinh nghiệm) / 3</span>
                  </div>
                  <div>
                    <span className="badge bg-success fs-5 px-3 py-2">{averageScore} / 5.00</span>
                  </div>
                </div>
              </div>

              {/* Nhan xet chi tiet */}
              <div className="col-12">
                <label className="form-label fw-semibold">Nhận xét chi tiết</label>
                <textarea
                  className="form-control"
                  rows={4}
                  placeholder="Ghi nhận điểm mạnh, điểm cần cải thiện, mức độ phù hợp văn hóa công ty..."
                  value={form.comment}
                  onChange={(e) => setForm({ ...form, comment: e.target.value })}
                />
              </div>

              <div className="col-12 d-flex justify-content-end gap-2 pt-2">
                <Link className="btn btn-secondary" to={`/applications/${targetAppId}`}>
                  Hủy bỏ
                </Link>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Đang lưu...' : isEdit ? 'Lưu cập nhật' : 'Gửi đánh giá'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
