import { useEffect, useState } from 'react'
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom'
import Loading from '../components/Loading'
import { candidateApi, cvUrl } from '../services/api'

const emptyCandidate = {
  full_name: '',
  email: '',
  phone: '',
  skills: '',
  experience: '',
  education: '',
  source: 'OTHER',
  cv_file: '',
}

const SOURCES = [
  { value: 'LINKEDIN', label: 'LinkedIn' },
  { value: 'FACEBOOK', label: 'Facebook' },
  { value: 'WEBSITE', label: 'Website công ty' },
  { value: 'JOB_SITE', label: 'Trang tuyển dụng' },
  { value: 'REFERRAL', label: 'Giới thiệu nội bộ' },
  { value: 'OTHER', label: 'Khác' },
]

export default function CandidateFormPage() {
  const { user } = useOutletContext()
  const { id } = useParams()
  const navigate = useNavigate()
  const editing = Boolean(id)

  const [form, setForm] = useState(emptyCandidate)
  const [cv, setCv] = useState(null)
  const [state, setState] = useState({ loading: editing, saving: false, error: '' })

  useEffect(() => {
    if (!editing) return
    candidateApi
      .get(id)
      .then((r) => {
        setForm(r.data)
        setState({ loading: false, saving: false, error: '' })
      })
      .catch((e) => setState({ loading: false, saving: false, error: e.message }))
  }, [editing, id])

  if (!['ADMIN', 'HR'].includes(user?.role)) {
    return (
      <div className="alert alert-danger rounded-3 my-4">
        Bạn không có quyền thêm hoặc chỉnh sửa hồ sơ ứng viên.
      </div>
    )
  }

  if (state.loading) return <Loading message="Đang tải thông tin ứng viên..." />

  async function submit(event) {
    event.preventDefault()
    setState({ ...state, saving: true, error: '' })
    const data = new FormData()
    ;['full_name', 'email', 'phone', 'skills', 'experience', 'education', 'source'].forEach(
      (name) => data.append(name, form[name] || '')
    )
    if (cv) data.append('cv', cv)

    try {
      if (editing) await candidateApi.update(id, data)
      else await candidateApi.create(data)
      navigate('/candidates')
    } catch (error) {
      setState({ ...state, saving: false, error: error.message })
    }
  }

  const field = (name) => ({
    value: form[name] ?? '',
    onChange: (e) => setForm({ ...form, [name]: e.target.value }),
  })

  return (
    <div className="form-page mx-auto" style={{ maxWidth: '850px' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 fw-bold mb-1 text-dark">
            {editing ? 'Chỉnh sửa Hồ sơ Ứng viên' : 'Thêm Ứng viên Mới'}
          </h1>
          <p className="text-muted mb-0 small">
            Nhập thông tin cá nhân, kỹ năng chuyên môn và tải lên file CV đính kèm.
          </p>
        </div>
        <Link to="/candidates" className="btn btn-secondary-modern btn-sm text-decoration-none">
          <i className="bi bi-arrow-left"></i>
          <span>Quay lại</span>
        </Link>
      </div>

      {state.error && (
        <div className="alert alert-danger d-flex align-items-center gap-2 rounded-3 mb-3">
          <i className="bi bi-exclamation-circle-fill"></i>
          <div>{state.error}</div>
        </div>
      )}

      <div className="card-modern">
        <div className="card-modern-header">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-person-lines-fill text-primary"></i>
            <span>Thông tin ứng viên</span>
          </div>
          <span className="text-muted small">* Trường bắt buộc</span>
        </div>
        <div className="card-modern-body">
          <form onSubmit={submit}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label small fw-semibold text-secondary">
                  Họ và tên ứng viên <span className="text-danger">*</span>
                </label>
                <input
                  className="form-control"
                  placeholder="Ví dụ: Nguyễn Văn An"
                  required
                  {...field('full_name')}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-semibold text-secondary">Địa chỉ Email</label>
                <input
                  className="form-control"
                  type="email"
                  placeholder="nguyenvanan@example.com"
                  {...field('email')}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-semibold text-secondary">Số điện thoại</label>
                <input
                  className="form-control"
                  placeholder="0912 345 678"
                  {...field('phone')}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-semibold text-secondary">Nguồn tiếp cận</label>
                <select className="form-select" {...field('source')}>
                  {SOURCES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-12">
                <label className="form-label small fw-semibold text-secondary">
                  Kỹ năng chuyên môn (cách nhau bằng dấu phẩy)
                </label>
                <input
                  className="form-control"
                  placeholder="Ví dụ: React, JavaScript, Node.js, REST API"
                  {...field('skills')}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-semibold text-secondary">Kinh nghiệm làm việc</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Mô tả các dự án, công ty đã từng làm việc..."
                  {...field('experience')}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-semibold text-secondary">Trình độ học vấn</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Trường đại học, chuyên ngành, chứng chỉ..."
                  {...field('education')}
                />
              </div>

              {/* CV File Upload Box */}
              <div className="col-12">
                <label className="form-label small fw-semibold text-secondary">
                  Tải lên tệp CV (PDF, DOC, DOCX — Tối đa 10 MB)
                </label>
                <div
                  className="p-3 rounded-3"
                  style={{
                    border: '2px dashed #cbd5e1',
                    backgroundColor: '#f8fafc',
                    textAlign: 'center',
                  }}
                >
                  <i className="bi bi-cloud-arrow-up fs-2 text-primary d-block mb-1"></i>
                  <input
                    className="form-control form-control-sm mx-auto mb-1"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    style={{ maxWidth: '320px' }}
                    onChange={(e) => setCv(e.target.files[0] || null)}
                  />
                  <small className="text-muted d-block">
                    Hệ thống sẽ tự động trích xuất nội dung văn bản để hỗ trợ phân tích AI.
                  </small>
                </div>
                {editing && form.cv_file && (
                  <div className="small text-secondary mt-1.5">
                    <i className="bi bi-paperclip me-1 text-primary"></i>
                    Tệp hiện tại:{' '}
                    <a
                      href={cvUrl(form.cv_file)}
                      target="_blank"
                      rel="noreferrer"
                      className="fw-semibold text-primary"
                    >
                      Xem file CV đã lưu
                    </a>{' '}
                    (để trống nếu không muốn thay đổi).
                  </div>
                )}
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2 border-top pt-3 mt-4">
              <Link to="/candidates" className="btn btn-secondary-modern">
                Hủy bỏ
              </Link>
              <button
                type="submit"
                className="btn btn-primary-modern"
                disabled={state.saving}
              >
                {state.saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-lg"></i>
                    <span>{editing ? 'Cập nhật ứng viên' : 'Lưu ứng viên mới'}</span>
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
