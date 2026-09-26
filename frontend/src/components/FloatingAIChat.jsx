import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { chatApi } from '../services/api'

const QUICK_CHIPS = [
  'Ứng viên có kỹ năng Python?',
  'Những vị trí nào đang tuyển?',
  'Lịch phỏng vấn sắp tới?',
  'Tóm tắt kinh nghiệm Phạm Gia Dũng',
]

const DEFAULT_WELCOME_MESSAGE = {
  id: 'welcome',
  role: 'assistant',
  content:
    'Xin chào! Tôi là **Trợ lý tuyển dụng AI**.\nTôi có thể hỗ trợ bạn tra cứu nhanh về **ứng viên, kỹ năng trong CV, tin tuyển dụng và lịch phỏng vấn** trong hệ thống.',
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

function formatMessageText(text) {
  if (!text) return null
  const lines = text.split('\n')
  return lines.map((line, lIdx) => {
    const trimmed = line.trim()
    const isBullet = trimmed.startsWith('•') || trimmed.startsWith('- ') || trimmed.startsWith('* ')
    const content = isBullet ? trimmed.replace(/^[•\-*]\s*/, '') : line

    // Parse **bold**
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
        <div key={lIdx} className="d-flex align-items-start gap-1.5 my-1">
          <i className="bi bi-dot text-primary fs-5 mt-n1 flex-shrink-0" />
          <div className="flex-grow-1" style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }}>
            {parts}
          </div>
        </div>
      )
    }

    if (trimmed === '') {
      return <div key={lIdx} className="my-1" />
    }

    return (
      <div key={lIdx} className="my-0.5" style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }}>
        {parts}
      </div>
    )
  })
}

function CompactSourcePill({ source, onNavigate }) {
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
        onClick={onNavigate}
        className="badge bg-light text-primary border border-primary-subtle text-decoration-none px-2 py-1 rounded-pill d-inline-flex align-items-center gap-1 small fw-normal"
        style={{ fontSize: '0.72rem' }}
      >
        <i className={`bi ${icon} text-primary`} />
        <span>{display_name}</span>
        <i className="bi bi-arrow-up-right text-muted" style={{ fontSize: '0.6rem' }} />
      </Link>
    )
  }

  return (
    <span
      className="badge bg-light text-secondary border px-2 py-1 rounded-pill d-inline-flex align-items-center gap-1 small fw-normal"
      style={{ fontSize: '0.72rem' }}
    >
      <i className={`bi ${icon}`} />
      <span>{display_name}</span>
    </span>
  )
}

let msgCounter = 0
function createMessageId(prefix) {
  msgCounter += 1
  return `${prefix}-${msgCounter}`
}

export default function FloatingAIChat({ user }) {
  const location = useLocation()
  const isChatPage = location.pathname === '/ai-chat'

  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState(() => getStoredMessages(user?.id))
  const [prevUserId, setPrevUserId] = useState(user?.id)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const storageKey = user?.id ? `recruitment_ai_chat_user_${user.id}` : 'recruitment_ai_chat_default'

  // Sync if user switches
  if (prevUserId !== user?.id) {
    setPrevUserId(user?.id)
    setMessages(getStoredMessages(user?.id))
  }

  // Scroll to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, loading, isOpen])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [isOpen])

  // Persist messages
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages))
    } catch {
      // ignore
    }
  }, [messages, storageKey])

  // Listen to cross-window or page updates in localStorage
  useEffect(() => {
    function handleStorage(e) {
      if (e.key === storageKey && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue)
          if (Array.isArray(parsed)) setMessages(parsed)
        } catch {
          // ignore
        }
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [storageKey])

  async function handleSend(textToSend) {
    const raw = textToSend !== undefined ? textToSend : input
    const trimmed = String(raw || '').trim()
    if (!trimmed || loading) return

    const nowStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    const userMsg = {
      id: createMessageId('u'),
      role: 'user',
      content: trimmed,
      sources: [],
      timestamp: nowStr,
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    const recentHistory = messages
      .filter((m) => m.id !== 'welcome' && !m.id.startsWith('welcome-'))
      .slice(-4)
      .map((m) => ({ role: m.role, content: m.content }))

    try {
      const res = await chatApi.ask(trimmed, recentHistory)
      const data = res.data || {}

      const aiMsg = {
        id: createMessageId('a'),
        role: 'assistant',
        content: data.answer || 'Xin lỗi, không có phản hồi từ hệ thống.',
        sources: Array.isArray(data.sources) ? data.sources : [],
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      }

      setMessages((prev) => [...prev, aiMsg])
    } catch (err) {
      const errMsg = {
        id: createMessageId('err'),
        role: 'assistant',
        content: `Không thể kết nối đến máy chủ: ${err.message || 'Lỗi không xác định'}.`,
        sources: [],
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages((prev) => [...prev, errMsg])
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleClear() {
    const resetMsg = {
      id: createMessageId('welcome'),
      role: 'assistant',
      content: 'Hội thoại đã được làm mới. Hãy nhập câu hỏi bạn cần tra cứu!',
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

  // If already on the dedicated /ai-chat page, hide the floating button
  if (isChatPage) return null

  return (
    <div className="floating-ai-container" style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1050 }}>
      {/* 1. Chat Window Popup */}
      {isOpen && (
        <div
          className="floating-ai-window card border-0 shadow-lg d-flex flex-column"
          style={{
            position: 'absolute',
            bottom: '76px',
            right: '0',
            width: '390px',
            maxWidth: 'calc(100vw - 32px)',
            height: '560px',
            maxHeight: 'calc(100vh - 110px)',
            borderRadius: '20px',
            overflow: 'hidden',
            backgroundColor: '#ffffff',
            boxShadow: '0 20px 45px -10px rgba(15, 23, 42, 0.28), 0 0 0 1px rgba(15, 23, 42, 0.08)',
            animation: 'fadeInUp 0.22s ease-out',
          }}
        >
          {/* Header */}
          <div
            className="p-3 text-white d-flex align-items-center justify-content-between flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <div className="d-flex align-items-center gap-2.5">
              <div className="position-relative">
                <img
                  src="/ai-avatar.png"
                  alt="AI Assistant"
                  className="rounded-circle border border-2 border-white shadow-sm"
                  style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                />
                <span
                  className="position-absolute bottom-0 end-0 bg-success border border-white rounded-circle"
                  style={{ width: '10px', height: '10px' }}
                />
              </div>
              <div>
                <h6 className="mb-0 fw-bold text-white fs-6 d-flex align-items-center gap-1.5">
                  Trợ lý Tuyển dụng AI
                </h6>
                <div className="text-white-50" style={{ fontSize: '0.72rem' }}>
                  <span className="text-emerald-400 fw-medium">● Trực tuyến</span> • Hỗ trợ tức thì
                </div>
              </div>
            </div>

            <div className="d-flex align-items-center gap-1">
              <button
                type="button"
                className="btn btn-sm btn-link text-white-50 p-1.5 hover-white text-decoration-none"
                onClick={handleClear}
                title="Làm mới cuộc trò chuyện"
              >
                <i className="bi bi-arrow-clockwise fs-6" />
              </button>
              <Link
                to="/ai-chat"
                className="btn btn-sm btn-link text-white-50 p-1.5 hover-white text-decoration-none"
                title="Mở toàn màn hình"
                onClick={() => setIsOpen(false)}
              >
                <i className="bi bi-arrows-angle-expand fs-6" />
              </Link>
              <button
                type="button"
                className="btn btn-sm btn-link text-white-50 p-1.5 hover-white text-decoration-none"
                onClick={() => setIsOpen(false)}
                title="Đóng"
              >
                <i className="bi bi-x-lg fs-6" />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div
            className="flex-grow-1 p-3 overflow-y-auto"
            style={{ backgroundColor: '#f8fafc', fontSize: '0.875rem' }}
          >
            {messages.map((m) => {
              const isUser = m.role === 'user'
              return (
                <div
                  key={m.id}
                  className={`d-flex mb-3 ${isUser ? 'justify-content-end' : 'justify-content-start'}`}
                >
                  {!isUser && (
                    <img
                      src="/ai-avatar.png"
                      alt="AI"
                      className="rounded-circle me-2 flex-shrink-0 align-self-start shadow-xs"
                      style={{ width: '28px', height: '28px', objectFit: 'cover' }}
                    />
                  )}
                  <div style={{ maxWidth: '82%' }}>
                    <div
                      className={`p-2.5 shadow-2xs ${
                        isUser
                          ? 'text-white'
                          : 'bg-white border text-dark'
                      }`}
                      style={{
                        borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        backgroundColor: isUser ? '#4f46e5' : '#ffffff',
                        borderColor: isUser ? 'transparent' : '#e2e8f0',
                        lineHeight: 1.45,
                      }}
                    >
                      {isUser ? (
                        <div style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }}>
                          {m.content}
                        </div>
                      ) : (
                        formatMessageText(m.content)
                      )}

                      {/* Clean Sources List - No technical clutter */}
                      {Array.isArray(m.sources) && m.sources.length > 0 && (
                        <div className="mt-2 pt-2 border-top border-slate-100 d-flex flex-wrap gap-1">
                          {m.sources.map((s, idx) => (
                            <CompactSourcePill
                              key={idx}
                              source={s}
                              onNavigate={() => setIsOpen(false)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    <div
                      className={`text-muted mt-1 px-1 ${isUser ? 'text-end' : 'text-start'}`}
                      style={{ fontSize: '0.68rem' }}
                    >
                      {m.timestamp}
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Quick Suggestion Chips if only welcome message exists */}
            {messages.length <= 1 && (
              <div className="mt-2 mb-3">
                <div className="text-muted small fw-medium mb-1.5" style={{ fontSize: '0.75rem' }}>
                  💡 Gợi ý câu hỏi nhanh:
                </div>
                <div className="d-flex flex-column gap-1.5">
                  {QUICK_CHIPS.map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="btn btn-sm btn-light border text-start py-1.5 px-2.5 rounded-3 text-secondary shadow-2xs hover-primary-subtle text-truncate"
                      style={{ fontSize: '0.785rem' }}
                      onClick={() => handleSend(chip)}
                    >
                      <i className="bi bi-chat-text text-primary me-1.5" />
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Loading Indicator */}
            {loading && (
              <div className="d-flex align-items-center gap-2 text-muted small py-2 px-1">
                <img
                  src="/ai-avatar.png"
                  alt="AI"
                  className="rounded-circle shadow-xs"
                  style={{ width: '24px', height: '24px', objectFit: 'cover' }}
                />
                <div className="bg-white border rounded-pill px-3 py-1.5 shadow-2xs d-inline-flex align-items-center gap-1.5">
                  <span className="spinner-grow spinner-grow-sm text-primary" style={{ width: '8px', height: '8px' }} />
                  <span style={{ fontSize: '0.75rem' }}>Đang tra cứu hệ thống...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input */}
          <div className="p-2.5 bg-white border-top flex-shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSend()
              }}
              className="d-flex align-items-center gap-1.5"
            >
              <input
                ref={inputRef}
                type="text"
                className="form-control form-control-sm rounded-pill border-slate-200 px-3 py-2"
                style={{ fontSize: '0.85rem' }}
                placeholder="Hỏi về ứng viên, kỹ năng, việc..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
              />
              <button
                type="submit"
                className="btn btn-primary rounded-circle d-grid place-items-center flex-shrink-0 shadow-sm"
                style={{ width: '36px', height: '36px', padding: 0 }}
                disabled={!input.trim() || loading}
                title="Gửi câu hỏi"
              >
                <i className="bi bi-send-fill" style={{ fontSize: '0.85rem' }} />
              </button>
            </form>
            <div className="text-center text-muted mt-1" style={{ fontSize: '0.65rem' }}>
              Tra cứu trực tiếp dữ liệu tuyển dụng hệ thống
            </div>
          </div>
        </div>
      )}

      {/* 2. Floating Launcher Button (Model AI Avatar at bottom-right) */}
      <button
        type="button"
        className="floating-ai-launcher btn p-0 rounded-circle position-relative border-0 shadow-lg d-flex align-items-center justify-content-center"
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          width: '58px',
          height: '58px',
          background: 'linear-gradient(135deg, #1e1b4b 0%, #4338ca 100%)',
          boxShadow: isOpen
            ? '0 10px 25px -5px rgba(79, 70, 229, 0.5)'
            : '0 12px 30px -5px rgba(79, 70, 229, 0.45)',
          transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          cursor: 'pointer',
        }}
        aria-label="Mở Trợ lý Tuyển dụng AI"
      >
        <div
          className="rounded-circle overflow-hidden d-flex align-items-center justify-content-center"
          style={{
            width: '52px',
            height: '52px',
            border: '2px solid rgba(255, 255, 255, 0.85)',
          }}
        >
          <img
            src="/ai-avatar.png"
            alt="AI Model CRM TNA"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </div>

        {/* Online Indicator Badge */}
        <span
          className="position-absolute bg-success border border-white rounded-circle shadow-xs"
          style={{
            width: '13px',
            height: '13px',
            top: '2px',
            right: '2px',
          }}
        />

        {/* Small Close Overlay when open */}
        {isOpen && (
          <div
            className="position-absolute d-flex align-items-center justify-content-center rounded-circle bg-dark bg-opacity-75 text-white"
            style={{ width: '22px', height: '22px', bottom: '-2px', right: '-2px' }}
          >
            <i className="bi bi-x-lg" style={{ fontSize: '0.65rem' }} />
          </div>
        )}
      </button>
    </div>
  )
}
