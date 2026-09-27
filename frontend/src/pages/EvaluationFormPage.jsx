import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import Loading from '../components/Loading'
import PageHeader from '../components/PageHeader'
import { applicationApi, evaluationApi } from '../services/api'

const SCORE_LABELS = {
  technical: {
    1: '1 - Kém (Chưa đáp ứng yêu cầu)',
    2: '2 - Yếu (Cần đào tạo nhiều)',
    3: '3 - Trung bình (Đáp ứng cơ bản)',
    4: '4 - Khá (Nắm vững chuyên môn)',
    5: '5 - Xuất sắc (Vượt mong đợi)',
  },
  communication: {
    1: '1 - Kém (Khó diễn đạt)',
    2: '2 - Yếu (Thiếu tự tin, lan man)',
    3: '3 - Trung bình (Giao tiếp ổn)',
    4: '4 - Khá (Trình bày rõ ràng, mạch lạc)',
    5: '5 - Xuất sắc (Thuyết phục, tương tác tốt)',
  },
  experience: {
    1: '1 - Rất ít / Chưa liên quan',
    2: '2 - Hạn chế trong lĩnh vực tương đương',
    3: '3 - Đủ kinh nghiệm theo yêu cầu',
    4: '4 - Kinh nghiệm thực tế phong phú',
    5: '5 - Chuyên gia / Dày dạn kinh nghiệm',
  },
}

export default function EvaluationFormPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  // Detect mode
  const isEdit =
    window.location.pathname.includes('/evaluations/') &&
    window.location.pathname.endsWith('/edit')

  const queryAppId = searchParams.get('application_id')
  const [applicationId, setApplicationId] = useState(isEdit ? null : queryAppId || id)
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
      evaluationApi
        .get(id)
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
      const targetId = queryAppId || id
      if (targetId) {
        applicationApi
          .get(targetId)
          .then((aRes) => {
            setAppInfo(aRes.data)
            setLoading(false)
          })
          .catch((err) => {
            setError(err.message || 'Lỗi khi tải dữ liệu.')
            setLoading(false)
          })
      } else {
        setLoading(false)
      }
    }
  }, [id, isEdit, queryAppId])

  const tech = Number(form.technical_score) || 0
  const comm = Number(form.communication_score) || 0
  const exp = Number(form.experience_score) || 0
  const averageScore = ((tech + comm + exp) / 3).toFixed(1)

  let scoreFeedback = 'Khá tốt'
  let scoreBadgeClass = 'soft-badge-success'
  if (averageScore >= 4.5) {
    scoreFeedback = 'Xuất sắc ⭐⭐⭐⭐⭐'
    scoreBadgeClass = 'soft-badge-success'
  } else if (averageScore >= 3.5) {
    scoreFeedback = 'Khá / Đạt yêu cầu ⭐⭐⭐⭐'
    scoreBadgeClass = 'soft-badge-primary'
  } else if (averageScore >= 2.5) {
    scoreFeedback = 'Trung bình / Cân nhắc ⭐⭐⭐'
    scoreBadgeClass = 'soft-badge-warning'
  } else {
    scoreFeedback = 'Chưa đạt yêu cầu ⭐⭐'
    scoreBadgeClass = 'soft-badge-danger'
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    const targetAppId = applicationId || queryAppId || id
    if (!targetAppId) {
      setError('Thiếu mã hồ sơ ứng tuyển.')
      setSubmitting(false)
      return
    }

    try {
      const payload = {
        technical_score: Number(form.technical_score),
        communication_score: Number(form.communication_score),
        experience_score: Number(form.experience_score),
        comment: form.comment,
      }

      if (isEdit) {
        await evaluationApi.update(id, payload)
        navigate(`/applications/${targetAppId}`)
      } else {
        await evaluationApi.create({
          application_id: Number(targetAppId),
          ...payload,
        })
        navigate(`/applications/${targetAppId}`)
      }
    } catch (err) {
      setError(err.message || 'Lỗi khi lưu đánh giá.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Loading message="Đang tải thông tin đánh giá..." />

  const targetAppId = applicationId || queryAppId || id

  return (
    <div className="form-page mx-auto" style={{ maxWidth: '850px' }}>
      <PageHeader
        title={isEdit ? `Chỉnh sửa Đánh giá #${id}` : 'Thêm Đánh giá Ứng viên'}
        description={
          appInfo
            ? `Hồ sơ #${appInfo.id} • Ứng viên: ${appInfo.candidate?.full_name || '—'} • Vị trí: ${appInfo.job?.title || '—'}`
            : 'Ghi nhận điểm số năng lực và nhận xét chi tiết sau buổi phỏng vấn.'
        }
        action={
          <Link
            to={`/applications/${targetAppId}`}
            className="btn btn-secondary-modern btn-sm text-decoration-none"
          >
            <i className="bi bi-arrow-left" />
            <span>Quay lại hồ sơ</span>
          </Link>
        }
      />

      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-2 rounded-3 mb-3">
          <i className="bi bi-exclamation-circle-fill" />
          <div>{error}</div>
        </div>
      )}

      <div className="card-modern mb-4">
        <div className="card-modern-header">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-award-fill text-warning" />
            <span>Bảng chấm điểm ứng viên</span>
          </div>
          <span className="text-muted small">Thang điểm từ 1 đến 5 sao</span>
        </div>

        <div className="card-modern-body">
          <form onSubmit={handleSubmit}>
            {/* Live Average Score Banner */}
            <div
              className="p-3 rounded-3 mb-4 d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3"
              style={{
                backgroundColor: 'var(--surface-subtle)',
                border: '1px solid var(--border)',
              }}
            >
              <div>
                <span className="fw-semibold text-secondary small d-block">
                  Điểm trung bình tự động:
                </span>
                <span className="small text-muted">
                  Công thức: (Chuyên môn + Giao tiếp + Kinh nghiệm) / 3
                </span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <span className="display-6 fw-bold text-dark">{averageScore}</span>
                <span className="text-muted fs-6">/ 5.0</span>
                <span className={`soft-badge ${scoreBadgeClass} ms-2`}>{scoreFeedback}</span>
              </div>
            </div>

            {/* Score Dimensions Grid */}
            <div className="row g-4 mb-4">
              {/* Technical Score */}
              <div className="col-12 col-md-4">
                <label className="form-label small fw-semibold text-secondary d-block">
                  1. Chuyên môn (1 - 5) <span className="text-danger">*</span>
                </label>
                <div className="star-rating-box mb-2">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      className={`star-btn ${form.technical_score >= val ? 'selected' : ''}`}
                      onClick={() => setForm({ ...form, technical_score: val })}
                      title={`Chọn ${val} sao`}
                    >
                      <i className="bi bi-star-fill" />
                    </button>
                  ))}
                </div>
                <div className="small text-muted" style={{ fontSize: '0.785rem' }}>
                  {SCORE_LABELS.technical[form.technical_score]}
                </div>
              </div>

              {/* Communication Score */}
              <div className="col-12 col-md-4">
                <label className="form-label small fw-semibold text-secondary d-block">
                  2. Giao tiếp (1 - 5) <span className="text-danger">*</span>
                </label>
                <div className="star-rating-box mb-2">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      className={`star-btn ${form.communication_score >= val ? 'selected' : ''}`}
                      onClick={() => setForm({ ...form, communication_score: val })}
                      title={`Chọn ${val} sao`}
                    >
                      <i className="bi bi-star-fill" />
                    </button>
                  ))}
                </div>
                <div className="small text-muted" style={{ fontSize: '0.785rem' }}>
                  {SCORE_LABELS.communication[form.communication_score]}
                </div>
              </div>

              {/* Experience Score */}
              <div className="col-12 col-md-4">
                <label className="form-label small fw-semibold text-secondary d-block">
                  3. Kinh nghiệm (1 - 5) <span className="text-danger">*</span>
                </label>
                <div className="star-rating-box mb-2">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      className={`star-btn ${form.experience_score >= val ? 'selected' : ''}`}
                      onClick={() => setForm({ ...form, experience_score: val })}
                      title={`Chọn ${val} sao`}
                    >
                      <i className="bi bi-star-fill" />
                    </button>
                  ))}
                </div>
                <div className="small text-muted" style={{ fontSize: '0.785rem' }}>
                  {SCORE_LABELS.experience[form.experience_score]}
                </div>
              </div>
            </div>

            {/* Detailed Comment Box */}
            <div className="mb-4">
              <label className="form-label small fw-semibold text-secondary">
                Nhận xét chi tiết của người đánh giá
              </label>
              <textarea
                className="form-control"
                rows={4}
                placeholder="Ghi nhận điểm mạnh chuyên môn, thái độ, mức độ phù hợp văn hóa hoặc những điểm cần đào tạo thêm..."
                value={form.comment}
                onChange={(e) => setForm({ ...form, comment: e.target.value })}
                style={{ height: 'auto' }}
              />
            </div>

            <div className="d-flex justify-content-end gap-2 border-top pt-3">
              <Link to={`/applications/${targetAppId}`} className="btn btn-secondary-modern">
                Hủy bỏ
              </Link>
              <button
                type="submit"
                className="btn btn-primary-modern"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1" role="status" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-lg" />
                    <span>Lưu đánh giá</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
