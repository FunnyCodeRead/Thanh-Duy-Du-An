import { useEffect, useState } from 'react'
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom'
import Loading from '../components/Loading'
import PageHeader from '../components/PageHeader'
import { jobApi } from '../services/api'

const emptyJob = {
  title: '',
  department: '',
  description: '',
  requirements: '',
  skills: '',
  quantity: 1,
  status: 'OPEN',
}

const DEPARTMENTS = [
  'Công nghệ thông tin / IT',
  'Phát triển Phần mềm (Software Engineering)',
  'Sản phẩm & Thiết kế (Product & Design)',
  'Kinh doanh & Bán hàng (Sales / BD)',
  'Marketing & Truyền thông',
  'Nhân sự & Tuyển dụng (HR)',
  'Tài chính & Kế toán (Finance & Accounting)',
  'Vận hành & Chăm sóc khách hàng (Operations)',
  'Hành chính & Quản trị',
  'Chung / Khác',
]

export default function JobFormPage() {
  const { user } = useOutletContext()
  const { id } = useParams()
  const navigate = useNavigate()
  const editing = Boolean(id)

  const [form, setForm] = useState(emptyJob)
  const [state, setState] = useState({ loading: editing, saving: false, error: '' })

  useEffect(() => {
    if (!editing) return
    jobApi
      .get(id)
      .then((result) => {
        setForm(result.data)
        setState({ loading: false, saving: false, error: '' })
      })
      .catch((error) => setState({ loading: false, saving: false, error: error.message }))
  }, [editing, id])

  if (!['ADMIN', 'HR'].includes(user?.role)) {
    return (
      <div className="alert alert-danger rounded-3 my-4">
        Bạn không có quyền thêm hoặc chỉnh sửa vị trí tuyển dụng.
      </div>
    )
  }

  if (state.loading) return <Loading message="Đang tải thông tin vị trí..." />

  async function submit(event) {
    event.preventDefault()
    setState({ ...state, saving: true, error: '' })
    try {
      if (editing) await jobApi.update(id, form)
      else await jobApi.create(form)
      navigate('/jobs')
    } catch (error) {
      setState({ ...state, saving: false, error: error.message })
    }
  }

  const field = (name) => ({
    value: form[name] ?? '',
    onChange: (e) => setForm({ ...form, [name]: e.target.value }),
  })

  const currentSkillList = (form.skills || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  const departmentOptions = Array.from(
    new Set([
      ...(form.department ? [form.department] : []),
      ...DEPARTMENTS,
    ])
  )

  return (
    <div className="form-page mx-auto" style={{ maxWidth: '920px' }}>
      <PageHeader
        title={editing ? 'Chỉnh sửa Vị trí Tuyển dụng' : 'Thêm Vị trí Tuyển dụng Mới'}
        action={
          <Link to="/jobs" className="btn btn-secondary-modern btn-sm text-decoration-none">
            <i className="bi bi-arrow-left" />
            <span>Quay lại danh sách</span>
          </Link>
        }
      />

      {state.error && (
        <div className="alert alert-danger d-flex align-items-center gap-2 rounded-3 mb-4">
          <i className="bi bi-exclamation-octagon-fill text-danger fs-5" />
          <div className="fw-medium">{state.error}</div>
        </div>
      )}

      <div className="card-modern">
        <div className="card-modern-header d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-briefcase-fill text-primary" />
            <span className="fw-bold">Thông tin vị trí tuyển dụng</span>
          </div>
          <span className="text-muted small">
            <span className="text-danger fw-bold">*</span> Bắt buộc
          </span>
        </div>

        <div className="card-modern-body p-4 p-md-5">
          <form onSubmit={submit}>
            <div className="row g-3 g-md-4">
              {/* Tên vị trí */}
              <div className="col-12 col-md-8">
                <label className="form-label small fw-semibold text-secondary">
                  Tên vị trí tuyển dụng <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ví dụ: Backend Developer (Python / Flask)"
                  required
                  {...field('title')}
                />
              </div>

              {/* Phòng ban */}
              <div className="col-12 col-md-4">
                <label className="form-label small fw-semibold text-secondary">Phòng ban</label>
                <select className="form-select" {...field('department')}>
                  <option value="">-- Chọn phòng ban --</option>
                  {departmentOptions.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mô tả công việc */}
              <div className="col-12">
                <label className="form-label small fw-semibold text-secondary">
                  Mô tả công việc <span className="text-danger">*</span>
                </label>
                <textarea
                  className="form-control"
                  rows={5}
                  placeholder="Mô tả trách nhiệm công việc, nhiệm vụ hàng ngày..."
                  required
                  style={{ height: 'auto', resize: 'vertical', lineHeight: 1.55 }}
                  {...field('description')}
                />
              </div>

              {/* Yêu cầu ứng viên */}
              <div className="col-12">
                <label className="form-label small fw-semibold text-secondary">
                  Yêu cầu ứng viên
                </label>
                <textarea
                  className="form-control"
                  rows={4}
                  placeholder="Kinh nghiệm, kiến thức chuyên môn, học vấn..."
                  style={{ height: 'auto', resize: 'vertical', lineHeight: 1.55 }}
                  {...field('requirements')}
                />
              </div>

              {/* Kỹ năng yêu cầu */}
              <div className="col-12 col-md-6">
                <label className="form-label small fw-semibold text-secondary">
                  Kỹ năng yêu cầu (cách nhau bằng dấu phẩy)
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ví dụ: Python, Flask, MySQL, React"
                  {...field('skills')}
                />
                {currentSkillList.length > 0 && (
                  <div className="d-flex flex-wrap gap-1.5 mt-2.5">
                    {currentSkillList.map((sk, idx) => (
                      <span key={idx} className="skill-pill">
                        {sk}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Chỉ tiêu số lượng */}
              <div className="col-12 col-sm-6 col-md-3">
                <label className="form-label small fw-semibold text-secondary">
                  Chỉ tiêu số lượng
                </label>
                <input
                  type="number"
                  min="1"
                  className="form-control"
                  required
                  {...field('quantity')}
                />
              </div>

              {/* Trạng thái tuyển */}
              <div className="col-12 col-sm-6 col-md-3">
                <label className="form-label small fw-semibold text-secondary">
                  Trạng thái tuyển
                </label>
                <select className="form-select" {...field('status')}>
                  <option value="OPEN">Đang mở tuyển</option>
                  <option value="CLOSED">Đã đóng tuyển</option>
                </select>
              </div>
            </div>

            {/* Action buttons footer */}
            <div className="d-flex justify-content-end align-items-center gap-2.5 border-top pt-4 mt-4">
              <Link to="/jobs" className="btn btn-secondary-modern">
                <span>Hủy bỏ</span>
              </Link>
              <button
                type="submit"
                className="btn btn-primary-modern"
                disabled={state.saving}
              >
                {state.saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1" role="status" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-lg" />
                    <span>{editing ? 'Cập nhật thay đổi' : 'Lưu vị trí mới'}</span>
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
