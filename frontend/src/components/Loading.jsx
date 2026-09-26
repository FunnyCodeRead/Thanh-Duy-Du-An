export default function Loading({ message = 'Đang tải dữ liệu...' }) {
  return (
    <div className="d-flex flex-column justify-content-center align-items-center py-5 my-4">
      <div
        className="spinner-border text-primary"
        role="status"
        style={{ width: '2.5rem', height: '2.5rem', borderWidth: '3px' }}
      >
        <span className="visually-hidden">Đang tải...</span>
      </div>
      <p className="mt-3 text-muted fw-medium small mb-0">{message}</p>
    </div>
  )
}
