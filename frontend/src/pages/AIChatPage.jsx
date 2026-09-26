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

const DEFAULT_WELCOME_MESSAGE = {
  id: 'welcome',
  role: 'assistant',
  content:
    'Xin chào! Tôi là **Trợ lý tuyển dụng AI**.\nTôi có thể hỗ trợ bạn tra cứu các thông tin về **ứng viên, kỹ năng, kinh nghiệm trong CV, vị trí tuyển dụng, lịch phỏng vấn và đánh giá** dựa trên dữ liệu hiện có trong hệ thống.',
  retrievalType: null,
  sources: [],
  timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
}

function getStoredMessages(userId) {
  const key = userId ? `recruitment_ai_chat_user_${userId}` : 'recruitment_ai_chat_default'
  try {
    const raw = localStorage.getItem(key)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
  } catch {
    // fallback
  }
  return [DEFAULT_WELCOME_MESSAGE]
}

export default function AIChatPage() {
  const { user } = useOutletContext()
  const isAdmin = user?.role === 'ADMIN'
  const storageKey = user?.id ? `recruitment_ai_chat_user_${user.id}` : 'recruitment_ai_chat_default'

  const [messages, setMessages] = useState(() => getStoredMessages(user?.id))
  const [prevUserId, setPrevUserId] = useState(user?.id)

  // Sync state if authenticated user switches
  if (prevUserId !== user?.id) {
    setPrevUserId(user?.id)
    setMessages(getStoredMessages(user?.id))
  }

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

  // Persist messages to localStorage on updates
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages))
    } catch {
      // ignore storage quota issues
    }
  }, [messages, storageKey])

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

    // Send recent conversation turns for contextual multi-turn dialog
    const recentHistory = messages
      .filter((m) => m.id !== 'welcome' && !m.id.startsWith('welcome-'))
      .slice(-4)
      .map((m) => ({ role: m.role, content: m.content }))

    try {
      const res = await chatApi.ask(trimmed, recentHistory)
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
    const resetMsg = {
      id: `welcome-${Date.now()}`,
      role: 'assistant',
      content:
        'Hội thoại đã được làm mới. Hãy nhập câu hỏi tuyển dụng bạn cần tra cứu!',
      retrievalType: null,
      sources: [],
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    }
    setMessages([resetMsg])
    try {
      localStorage.setItem(storageKey, JSON.stringify([resetMsg]))
    } catch {
      // ignore
    }
  }


  return (
    <div className="d-flex flex-column h-100" style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* 1. Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-3">
        <div className="d-flex align-items-center gap-3">
          <img
            src="/ai-avatar.png"
            alt="AI Assistant"
            className="rounded-circle border border-2 border-primary-subtle shadow-sm"
            style={{ width: '46px', height: '46px', objectFit: 'cover' }}
          />
          <div>
            <h1 className="h4 fw-bold mb-0.5 text-dark d-flex align-items-center gap-2">
              <span>Trợ lý Tuyển dụng AI</span>
              <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill small fw-medium" style={{ fontSize: '0.72rem' }}>
                ● Trực tuyến
              </span>
            </h1>
            <p className="text-muted small mb-0">
              Tra cứu nhanh hồ sơ ứng viên, kỹ năng CV, vị trí tuyển dụng và lịch phỏng vấn.
              {indexInfo?.documents ? ` (Đã đồng bộ ${indexInfo.documents} mục dữ liệu)` : ''}
            </p>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2 flex-wrap">
          {isAdmin && (
            <button
              type="button"
              className="btn btn-sm btn-outline-primary rounded-pill px-3 py-1.5 d-inline-flex align-items-center gap-1.5"
              onClick={handleReindex}
              disabled={reindexing}
              title="Đồng bộ lại dữ liệu hệ thống vào chỉ mục tìm kiếm"
            >
              <i className={`bi ${reindexing ? 'spinner-border spinner-border-sm' : 'bi-arrow-repeat'}`}></i>
              <span>{reindexing ? 'Đang cập nhật...' : 'Cập nhật dữ liệu'}</span>
            </button>
          )}

          <button
            type="button"
            className="btn btn-sm btn-outline-secondary rounded-pill px-3 py-1.5 d-inline-flex align-items-center gap-1.5"
            onClick={handleClearChat}
            title="Làm mới toàn bộ cuộc trò chuyện"
          >
            <i className="bi bi-arrow-clockwise"></i>
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

      {/* 2. Chat Messages Container */}
      <div
        className="card-modern flex-grow-1 d-flex flex-column mb-3"
        style={{ height: 'calc(100vh - 360px)', minHeight: '380px', overflow: 'hidden' }}
      >
        <div className="p-3.5 flex-grow-1 overflow-y-auto d-flex flex-column gap-3.5" style={{ background: '#f8fafc' }}>
          {messages.map((msg) => {
            const isUser = msg.role === 'user'

            return (
              <div
                key={msg.id}
                className={`d-flex gap-2.5 ${isUser ? 'justify-content-end' : 'justify-content-start'}`}
              >
                {!isUser && (
                  <img
                    src="/ai-avatar.png"
                    alt="AI"
                    className="rounded-circle flex-shrink-0 shadow-xs mt-0.5"
                    style={{
                      width: '34px',
                      height: '34px',
                      objectFit: 'cover',
                      border: '1px solid #cbd5e1',
                    }}
                  />
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
                      <div className="mt-2.5 pt-2 border-top border-light-subtle">
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
                      isUser ? 'justify-content-end text-muted' : 'justify-content-start text-muted'
                    }`}
                    style={{ fontSize: '0.72rem' }}
                  >
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
