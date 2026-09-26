import { useEffect, useRef, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { chatApi } from '../services/api'

const QUICK_QUESTIONS = [
  'Có bao nhiêu ứng viên đang phỏng vấn?',
  'Những vị trí nào đang tuyển?',
  'Lịch phỏng vấn sắp tới gồm những ai?',
  'Ứng viên nào có kỹ năng Python và Flask?',
  'Tóm tắt kinh nghiệm của Phạm Gia Dũng',
  'Ai là ứng viên tốt nhất?',
  'Thời tiết hôm nay thế nào?',
]

function formatRetrievalBadge(type) {
  switch (type) {
    case 'STRUCTURED':
      return { label: 'Dữ liệu cấu trúc (SQL)', className: 'soft-badge-primary', icon: 'bi-database-fill' }
    case 'SEMANTIC':
      return { label: 'Tìm kiếm ngữ nghĩa (Vector)', className: 'soft-badge-purple', icon: 'bi-cpu-fill' }
    case 'HYBRID':
      return { label: 'Tìm kiếm kết hợp (Hybrid)', className: 'soft-badge-success', icon: 'bi-lightning-charge-fill' }
    case 'DECISION_REFUSAL':
      return { label: 'Quyền quyết định thuộc về nhân sự', className: 'soft-badge-warning', icon: 'bi-shield-check' }
    case 'OUT_OF_SCOPE':
      return { label: 'Ngoài phạm vi tuyển dụng', className: 'soft-badge-secondary', icon: 'bi-info-circle-fill' }
    default:
      return { label: type || 'AI Assistant', className: 'soft-badge-secondary', icon: 'bi-robot' }
  }
}

function parseFormattedText(text) {
  if (!text) return null
  const lines = text.split('\n')
  return lines.map((line, lIdx) => {
    // Check bullet points
    const trimmed = line.trim()
    const isBullet = trimmed.startsWith('•') || trimmed.startsWith('- ') || trimmed.startsWith('* ')
    const content = isBullet ? trimmed.replace(/^[•\-*]\s*/, '') : line

    // Parse bold text (**bold**)
    const parts = []
    let remaining = content
    let key = 0

    while (remaining.length > 0) {
      const boldMatch = remaining.match(/\*\*(.*?)\*\*/)
      if (!boldMatch) {
        parts.push(<span key={key++}>{remaining}</span>)
        break
      }
      const idx = boldMatch.index
      if (idx > 0) {
        parts.push(<span key={key++}>{remaining.slice(0, idx)}</span>)
      }
      parts.push(
        <strong key={key++} className="fw-semibold text-dark">
          {boldMatch[1]}
        </strong>
      )
      remaining = remaining.slice(idx + boldMatch[0].length)
    }

    if (isBullet) {
      return (
        <div key={lIdx} className="d-flex align-items-start gap-2 my-1">
          <i className="bi bi-dot text-primary fs-5 mt-n1 flex-shrink-0"></i>
          <div className="flex-grow-1" style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }}>
            {parts}
          </div>
        </div>
      )
    }

    if (trimmed === '') {
      return <div key={lIdx} className="my-1.5" />
    }

    return (
      <div key={lIdx} className="my-0.5" style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }}>
        {parts}
      </div>
    )
  })
}

function SourceBadge({ source }) {
  const { entity_type, entity_id, display_name } = source
  let targetPath = null
  let icon = 'bi-file-earmark'

  if (entity_type === 'candidate' && entity_id > 0) {
    targetPath = `/candidates/${entity_id}`
    icon = 'bi-person-fill'
  } else if (entity_type === 'job' && entity_id > 0) {
    targetPath = `/jobs/${entity_id}`
    icon = 'bi-briefcase-fill'
  } else if (entity_type === 'application' && entity_id > 0) {
    targetPath = `/applications/${entity_id}`
    icon = 'bi-file-earmark-person-fill'
  } else if (entity_type === 'interview' && entity_id > 0) {
    targetPath = `/interviews/${entity_id}`
    icon = 'bi-calendar-event-fill'
  }

  if (targetPath) {
    return (
      <Link
        to={targetPath}
        className="badge bg-light text-primary border border-primary-subtle text-decoration-none px-2.5 py-1.5 rounded-pill d-inline-flex align-items-center gap-1.5 small fw-normal shadow-2xs"
        style={{ fontSize: '0.785rem', transition: 'all 0.15s ease' }}
      >
        <i className={`bi ${icon} text-primary`}></i>
        <span>{display_name}</span>
        <i className="bi bi-box-arrow-up-right text-muted" style={{ fontSize: '0.65rem' }}></i>
      </Link>
    )
  }

  return (
    <span
      className="badge bg-light text-secondary border px-2.5 py-1.5 rounded-pill d-inline-flex align-items-center gap-1.5 small fw-normal"
      style={{ fontSize: '0.785rem' }}
    >
      <i className={`bi ${icon}`}></i>
      <span>{display_name}</span>
    </span>
  )
}

export default function AIChatPage() {
  const { user } = useOutletContext()
  const isAdmin = user?.role === 'ADMIN'

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Xin chào! Tôi là **Trợ lý tuyển dụng AI**.\nTôi có thể hỗ trợ bạn tra cứu các thông tin về **ứng viên, kỹ năng, kinh nghiệm trong CV, vị trí tuyển dụng, lịch phỏng vấn và đánh giá** dựa trên dữ liệu hiện có trong hệ thống.',
      retrievalType: null,
      sources: [],
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    },
  ])

  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [reindexing, setReindexing] = useState(false)
  const [reindexMsg, setReindexMsg] = useState('')
  const [indexInfo, setIndexInfo] = useState(null)

  const messagesEndRef = useRef(null)

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading])

  // Load index info on mount
  useEffect(() => {
    chatApi
      .indexInfo()
      .then((res) => {
        if (res.data) setIndexInfo(res.data)
      })
      .catch(() => {})
  }, [])

  async function handleSend(e) {
    if (e) e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || loading) return

    const userMsg = {
      id: String(Date.now()),
      role: 'user',
      content: trimmed,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await chatApi.ask(trimmed)
      const data = res.data || {}

      const aiMsg = {
        id: String(Date.now() + 1),
        role: 'assistant',
        content: data.answer || 'Không nhận được câu trả lời từ hệ thống.',
        retrievalType: data.retrieval_type,
        sources: data.sources || [],
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages((prev) => [...prev, aiMsg])
    } catch (err) {
      const errorMsg = {
        id: String(Date.now() + 1),
        role: 'assistant',
        content: `Đã xảy ra lỗi khi tra cứu: ${err.message || 'Không thể kết nối đến máy chủ.'}`,
        retrievalType: 'OUT_OF_SCOPE',
        sources: [],
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setLoading(false)
    }
  }

  async function handleReindex() {
    if (reindexing) return
    setReindexing(true)
    setReindexMsg('')
    try {
      const res = await chatApi.reindex()
      const data = res.data || {}
      setIndexInfo(data)
      setReindexMsg(`Đã cập nhật thành công ${data.documents || ''} tài liệu vào chỉ mục AI.`)
      setTimeout(() => setReindexMsg(''), 4000)
    } catch (err) {
      setReindexMsg(`Lỗi khi cập nhật chỉ mục: ${err.message}`)
    } finally {
      setReindexing(false)
    }
  }

  function handleQuickQuestion(q) {
    setInput(q)
  }

  function handleClearChat() {
    setMessages([
      {
        id: 'welcome-reset',
        role: 'assistant',
        content:
          'Hội thoại đã được làm mới. Hãy nhập câu hỏi tuyển dụng bạn cần tra cứu!',
        retrievalType: null,
        sources: [],
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      },
    ])
  }

  return (
    <div className="d-flex flex-column h-100" style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* 1. Header & Reindex Banner */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-3">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <h1 className="h3 fw-bold mb-0 text-dark d-flex align-items-center gap-2">
              <span className="brand-icon" style={{ width: '36px', height: '36px', fontSize: '1.1rem' }}>
                <i className="bi bi-robot"></i>
              </span>
              <span>Trợ lý Tuyển dụng AI</span>
            </h1>
            <span className="soft-badge soft-badge-primary">RAG + Database</span>
          </div>
          <p className="text-muted small mb-0">
            Hỏi đáp thông minh dựa trên dữ liệu tuyển dụng thực tế lưu trong hệ thống.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2 flex-wrap">
          {isAdmin && (
            <button
              type="button"
              className="btn btn-sm btn-outline-primary rounded-pill px-3 py-1.5 d-inline-flex align-items-center gap-1.5"
              onClick={handleReindex}
              disabled={reindexing}
              title="Đồng bộ lại cơ sở dữ liệu MySQL vào chỉ mục tìm kiếm ngữ nghĩa FAISS"
            >
              <i className={`bi ${reindexing ? 'spinner-border spinner-border-sm' : 'bi-arrow-repeat'}`}></i>
              <span>{reindexing ? 'Đang cập nhật chỉ mục...' : 'Cập nhật dữ liệu AI'}</span>
            </button>
          )}

          <button
            type="button"
            className="btn btn-sm btn-outline-secondary rounded-pill px-3 py-1.5 d-inline-flex align-items-center gap-1.5"
            onClick={handleClearChat}
            title="Xóa toàn bộ lịch sử trò chuyện hiện tại"
          >
            <i className="bi bi-trash3"></i>
            <span>Làm mới đoạn chat</span>
          </button>
        </div>
      </div>

      {reindexMsg && (
        <div className="alert alert-info py-2 px-3 small rounded-3 mb-3 d-flex align-items-center gap-2">
          <i className="bi bi-check-circle-fill text-info"></i>
          <span>{reindexMsg}</span>
        </div>
      )}

      {/* 2. Disclaimer Notice */}
      <div className="p-2.5 px-3 rounded-3 bg-light border small text-secondary d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
        <div className="d-flex align-items-center gap-2">
          <i className="bi bi-shield-check text-success"></i>
          <span>
            <strong>Nguyên tắc hệ thống:</strong> AI chỉ cung cấp thông tin tham khảo từ dữ liệu hiện có; quyết định tuyển dụng thuộc về người phụ trách.
          </span>
        </div>
        {indexInfo?.built_at && (
          <span className="text-muted" style={{ fontSize: '0.75rem' }}>
            Dữ liệu cập nhật: {new Date(indexInfo.built_at).toLocaleString('vi-VN')}
          </span>
        )}
      </div>

      {/* 3. Chat Messages Container */}
      <div
        className="card-modern flex-grow-1 d-flex flex-column mb-3"
        style={{ height: 'calc(100vh - 380px)', minHeight: '380px', overflow: 'hidden' }}
      >
        <div className="p-3.5 flex-grow-1 overflow-y-auto d-flex flex-column gap-3.5" style={{ background: '#fcfcfd' }}>
          {messages.map((msg) => {
            const isUser = msg.role === 'user'
            const badge = msg.retrievalType ? formatRetrievalBadge(msg.retrievalType) : null

            return (
              <div
                key={msg.id}
                className={`d-flex gap-2.5 ${isUser ? 'justify-content-end' : 'justify-content-start'}`}
              >
                {!isUser && (
                  <div
                    className="brand-icon flex-shrink-0"
                    style={{
                      width: '34px',
                      height: '34px',
                      fontSize: '0.95rem',
                      background: 'linear-gradient(135deg, #4f46e5, #06b6d4)',
                    }}
                  >
                    <i className="bi bi-stars"></i>
                  </div>
                )}

                <div
                  className="d-flex flex-column"
                  style={{ maxWidth: isUser ? '75%' : '85%' }}
                >
                  <div
                    className={`p-3 rounded-3 shadow-2xs ${
                      isUser
                        ? 'bg-primary text-white rounded-bottom-end-0'
                        : 'bg-white border text-dark rounded-bottom-start-0'
                    }`}
                    style={{ fontSize: '0.925rem', lineHeight: 1.6 }}
                  >
                    {isUser ? (
                      <div style={{ whiteSpace: 'pre-wrap', overflowWrap: 'break-word', wordBreak: 'break-word' }}>
                        {msg.content}
                      </div>
                    ) : (
                      parseFormattedText(msg.content)
                    )}

                    {/* Sources Attribution */}
                    {!isUser && msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3 pt-2.5 border-top border-light-subtle">
                        <div className="small text-muted fw-semibold mb-1.5 d-flex align-items-center gap-1.5" style={{ fontSize: '0.785rem' }}>
                          <i className="bi bi-link-45deg text-primary"></i>
                          <span>Nguồn dữ liệu tham khảo ({msg.sources.length}):</span>
                        </div>
                        <div className="d-flex flex-wrap gap-1.5">
                          {msg.sources.map((s, idx) => (
                            <SourceBadge key={idx} source={s} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div
                    className={`d-flex align-items-center gap-2 mt-1 px-1 small ${
                      isUser ? 'justify-content-end text-muted' : 'justify-content-between text-muted'
                    }`}
                    style={{ fontSize: '0.75rem' }}
                  >
                    {!isUser && badge && (
                      <span className={`soft-badge ${badge.className} d-inline-flex align-items-center gap-1`} style={{ fontSize: '0.7rem', padding: '0.1rem 0.5rem' }}>
                        <i className={`bi ${badge.icon}`}></i>
                        {badge.label}
                      </span>
                    )}
                    <span>{msg.timestamp}</span>
                  </div>
                </div>

                {isUser && (
                  <div
                    className="user-avatar-circle flex-shrink-0"
                    style={{ width: '34px', height: '34px', fontSize: '0.8rem' }}
                  >
                    {(user?.full_name || 'U').split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                  </div>
                )}
              </div>
            )
          })}

          {loading && (
            <div className="d-flex gap-2.5 align-items-center">
              <div
                className="brand-icon flex-shrink-0"
                style={{ width: '34px', height: '34px', fontSize: '0.95rem' }}
              >
                <i className="bi bi-stars"></i>
              </div>
              <div className="p-3 rounded-3 bg-white border d-inline-flex align-items-center gap-2 text-secondary small">
                <span className="spinner-border spinner-border-sm text-primary" role="status"></span>
                <span>Trợ lý AI đang truy xuất dữ liệu tuyển dụng và tổng hợp câu trả lời...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 4. Quick Suggestion Pills */}
      <div className="d-flex align-items-center gap-1.5 mb-2.5 overflow-x-auto pb-1">
        <span className="small text-muted flex-shrink-0 me-1" style={{ fontSize: '0.785rem' }}>
          <i className="bi bi-lightbulb-fill text-warning me-1"></i>Gợi ý câu hỏi:
        </span>
        {QUICK_QUESTIONS.map((q, idx) => (
          <button
            key={idx}
            type="button"
            className="btn btn-sm btn-light border rounded-pill px-2.5 py-1 text-nowrap text-secondary small"
            style={{ fontSize: '0.785rem' }}
            onClick={() => handleQuickQuestion(q)}
            disabled={loading}
          >
            {q}
          </button>
        ))}
      </div>

      {/* 5. Input Bar */}
      <form onSubmit={handleSend} className="card-modern p-2">
        <div className="d-flex align-items-center gap-2">
          <input
            type="text"
            className="form-control border-0 shadow-none"
            placeholder="Nhập câu hỏi tuyển dụng (VD: Ứng viên nào có kinh nghiệm Flask?)..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            maxLength={1000}
            style={{ fontSize: '0.925rem' }}
          />

          <button
            type="submit"
            className="btn btn-primary-modern px-3.5 py-2 d-inline-flex align-items-center gap-1.5 flex-shrink-0 rounded-pill"
            disabled={loading || !input.trim()}
          >
            {loading ? (
              <span className="spinner-border spinner-border-sm" role="status"></span>
            ) : (
              <>
                <span>Gửi</span>
                <i className="bi bi-send-fill"></i>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
