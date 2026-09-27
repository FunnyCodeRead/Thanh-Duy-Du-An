export default function Pagination({
  currentPage = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 50],
}) {
  if (totalItems <= 0) return null

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages)

  const startItem = (safeCurrentPage - 1) * pageSize + 1
  const endItem = Math.min(safeCurrentPage * pageSize, totalItems)

  function getPageNumbers() {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    if (safeCurrentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages]
    }

    if (safeCurrentPage >= totalPages - 3) {
      return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
    }

    return [1, '...', safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1, '...', totalPages]
  }

  const pages = getPageNumbers()

  return (
    <div className="pagination-wrapper px-4 py-3 border-top d-flex flex-column flex-sm-row justify-content-between align-items-center gap-3">
      {/* Left side: Information and page size */}
      <div className="d-flex align-items-center flex-wrap gap-2 text-muted small">
        <span>
          Hiển thị <strong className="text-dark">{startItem} - {endItem}</strong> trong tổng số <strong className="text-dark">{totalItems}</strong> bản ghi
        </span>

        {onPageSizeChange && (
          <div className="d-inline-flex align-items-center ms-sm-2 gap-1.5">
            <span className="text-secondary small">|</span>
            <select
              className="form-select form-select-sm py-0.5 px-2 text-secondary"
              style={{ width: 'auto', fontSize: '0.8rem', height: '28px' }}
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt} / trang
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right side: Page navigation */}
      <nav aria-label="Phân trang danh sách">
        <ul className="pagination pagination-sm mb-0 align-items-center gap-1">
          {/* First page */}
          <li className={`page-item ${safeCurrentPage === 1 ? 'disabled' : ''}`}>
            <button
              type="button"
              className="page-link pagination-btn"
              onClick={() => onPageChange(1)}
              disabled={safeCurrentPage === 1}
              title="Trang đầu"
              aria-label="Trang đầu"
            >
              <i className="bi bi-chevron-double-left" />
            </button>
          </li>

          {/* Previous page */}
          <li className={`page-item ${safeCurrentPage === 1 ? 'disabled' : ''}`}>
            <button
              type="button"
              className="page-link pagination-btn"
              onClick={() => onPageChange(safeCurrentPage - 1)}
              disabled={safeCurrentPage === 1}
              title="Trang trước"
              aria-label="Trang trước"
            >
              <i className="bi bi-chevron-left" />
            </button>
          </li>

          {/* Page numbers */}
          {pages.map((p, idx) => {
            if (p === '...') {
              return (
                <li key={`ellipsis-${idx}`} className="page-item disabled">
                  <span className="page-link pagination-ellipsis">...</span>
                </li>
              )
            }

            const isActive = p === safeCurrentPage
            return (
              <li key={p} className={`page-item ${isActive ? 'active' : ''}`}>
                <button
                  type="button"
                  className={`page-link pagination-num-btn ${isActive ? 'active' : ''}`}
                  onClick={() => onPageChange(p)}
                >
                  {p}
                </button>
              </li>
            )
          })}

          {/* Next page */}
          <li className={`page-item ${safeCurrentPage === totalPages ? 'disabled' : ''}`}>
            <button
              type="button"
              className="page-link pagination-btn"
              onClick={() => onPageChange(safeCurrentPage + 1)}
              disabled={safeCurrentPage === totalPages}
              title="Trang sau"
              aria-label="Trang sau"
            >
              <i className="bi bi-chevron-right" />
            </button>
          </li>

          {/* Last page */}
          <li className={`page-item ${safeCurrentPage === totalPages ? 'disabled' : ''}`}>
            <button
              type="button"
              className="page-link pagination-btn"
              onClick={() => onPageChange(totalPages)}
              disabled={safeCurrentPage === totalPages}
              title="Trang cuối"
              aria-label="Trang cuối"
            >
              <i className="bi bi-chevron-double-right" />
            </button>
          </li>
        </ul>
      </nav>
    </div>
  )
}
