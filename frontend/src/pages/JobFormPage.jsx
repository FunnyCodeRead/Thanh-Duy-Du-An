import { useEffect, useState } from 'react'
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom'
import Loading from '../components/Loading'
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

  return (
    <div className="form-page mx-auto" style={{ maxWidth: '850px' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 fw-bold mb-1 text-dark">
            {editing ? 'Chỉnh sửa Vị trí Tuyển dụng' : 'Tạo Vị trí Tuyển dụng Mới'}
          </h1>
          <p className="text-muted mb-0 small">
            Điền thông tin chi tiết về vị trí, mô tả công việc và yêu cầu tuyển dụng.
          </p>
        </div>
        <Link to="/jobs" className="btn btn-secondary-modern btn-sm text-decoration-none">
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
            <i className="bi bi-briefcase-fill text-primary"></i>
            <span>Thông tin vị trí</span>
          </div>
          <span className="text-muted small">* Trường bắt buộc</span>
        </div>
        <div className="card-modern-body">
          <form onSubmit={submit}>
            <div className="row g-3">
              <div className="col-md-8">
                <label className="form-label small fw-semibold text-secondary">
                  Tên vị trí tuyển dụng <span className="text-danger">*</span>
                </label>
                <input
                  className="form-control"
                  placeholder="Ví dụ: Backend Developer (Python / Flask)"
                  required
                  {...field('title')}
                />
              </div>

              <div className="col-md-4">
                <label className="form-label small fw-semibold text-secondary">Phòng ban</label>
                <input
                  className="form-control"
                  placeholder="Ví dụ: Kỹ thuật / Công nghệ"
                  {...field('department')}
                />
              </div>

              <div className="col-12">
                <label className="form-label small fw-semibold text-secondary">
                  Mô tả công việc <span className="text-danger">*</span>
                </label>
                <textarea
                  className="form-control"
                  rows="4"
                  placeholder="Mô tả trách nhiệm công việc, nhiệm vụ hàng ngày..."
                  required
                  {...field('description')}
                />
              </div>

              <div className="col-12">
                <label className="form-label small fw-semibold text-secondary">
                  Yêu cầu ứng viên
                </label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Kinh nghiệm, kiến thức chuyên môn, học vấn..."
                  {...field('requirements')}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-semibold text-secondary">
                  Kỹ năng (cách nhau bằng dấu phẩy)
                </label>
                <input
                  className="form-control"
                  placeholder="Ví dụ: Python, Flask, MySQL, React"
                  {...field('skills')}
                />
              </div>

              <div className="col-md-3">
                <label className="form-label small fw-semibold text-secondary">
                  Chỉ tiêu số lượng
                </label>
                <input
                  className="form-control"
                  type="number"
                  min="1"
                  {...field('quantity')}
                />
              </div>

              <div className="col-md-3">
                <label className="form-label small fw-semibold text-secondary">Trạng thái</label>
                <select className="form-select" {...field('status')}>
                  <option value="OPEN">Đang mở tuyển</option>
                  <option value="CLOSED">Đã đóng tuyển</option>
                </select>
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2 border-top pt-3 mt-4">
              <Link to="/jobs" className="btn btn-secondary-modern">
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
                    <span>{editing ? 'Cập nhật vị trí' : 'Lưu vị trí mới'}</span>
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
