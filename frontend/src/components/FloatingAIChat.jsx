import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { chatApi } from '../services/api'

const QUICK_ACTIONS = [
  'Ứng viên kỹ năng Python',
  'Vị trí đang mở tuyển',
  'Lịch phỏng vấn sắp tới',
  'Tóm tắt ứng viên Phạm Gia Dũng',
]

const DEFAULT_WELCOME = {
  id: 'welcome',
  role: 'assistant',
  content:
    'Xin chào! Tôi là trợ lý AI tuyển dụng. Bạn cần tra cứu thông tin ứng viên, kỹ năng, tin tuyển dụng hay lịch phỏng vấn nào?',
  sources: [],
  timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
}

function getStoredMessages(userId) {
  const key = userId ? `recruitment_ai_chat_user_${userId}` : 'recruitment_ai_chat_default'
  try {
    const raw = localStorage.getItem(key)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {
    // fallback
  }
  return [DEFAULT_WELCOME]
}

function formatMessageText(text, isGreenBubble = false) {
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
        <strong key={key++} className={isGreenBubble ? 'fw-bold text-white' : 'fw-bold text-dark'}>
          {boldMatch[1]}
        </strong>
      )
      remaining = remaining.slice(idx + boldMatch[0].length)
    }

    if (isBullet) {
      return (
        <div key={lIdx} className="d-flex align-items-start gap-1.5 my-1" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
          <span className="flex-shrink-0" style={{ lineHeight: 1.4 }}>•</span>
          <div className="flex-grow-1" style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }}>
            {parts}
          </div>
        </div>
      )
    }

    if (trimmed === '') {
      return <div key={lIdx} style={{ height: '6px' }} />
    }

    return (
      <div key={lIdx} className="my-0.5" style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }}>
        {parts}
      </div>
    )
  })
}

function SourcePill({ source, onNavigate }) {
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
        className="badge bg-white bg-opacity-25 text-white border border-white border-opacity-40 text-decoration-none px-2.5 py-1 rounded-pill d-inline-flex align-items-center gap-1.5 fw-normal"
        style={{
          fontSize: '0.72rem',
          transition: 'all 0.15s ease',
          whiteSpace: 'normal',
          textAlign: 'left',
          wordBreak: 'break-word',
          maxWidth: '100%',
        }}
      >
        <i className={`bi ${icon} flex-shrink-0`} />
        <span>{display_name}</span>
        <i className="bi bi-arrow-up-right flex-shrink-0" style={{ fontSize: '0.55rem' }} />
      </Link>
    )
  }

  return (
    <span
      className="badge bg-white bg-opacity-20 text-white border border-white border-opacity-25 px-2.5 py-1 rounded-pill d-inline-flex align-items-center gap-1.5 fw-normal"
      style={{ fontSize: '0.72rem', whiteSpace: 'normal', textAlign: 'left', wordBreak: 'break-word', maxWidth: '100%' }}
    >
      <i className={`bi ${icon} flex-shrink-0`} />
      <span>{display_name}</span>
    </span>
  )
}

let msgSeq = 0
function nextId(prefix) {
  msgSeq += 1
  return `${prefix}-${msgSeq}`
}

export default function FloatingAIChat({ user }) {
  const location = useLocation()
  const isChatPage = location.pathname === '/ai-chat'

  const [isOpen, setIsOpen] = useState(false)
  const [showSticker, setShowSticker] = useState(true)
  const [showMenu, setShowMenu] = useState(false)
  const [messages, setMessages] = useState(() => getStoredMessages(user?.id))
  const [prevUserId, setPrevUserId] = useState(user?.id)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const storageKey = user?.id ? `recruitment_ai_chat_user_${user.id}` : 'recruitment_ai_chat_default'

  // Sync state if user changes
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

  // Cross-tab / cross-window sync
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
      id: nextId('u'),
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
        id: nextId('a'),
        role: 'assistant',
        content: data.answer || 'Xin lỗi, không tìm thấy thông tin phù hợp trong dữ liệu tuyển dụng.',
        sources: Array.isArray(data.sources) ? data.sources : [],
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      }

      setMessages((prev) => [...prev, aiMsg])
    } catch (err) {
      const errMsg = {
        id: nextId('err'),
        role: 'assistant',
        content: `Không thể kết nối máy chủ: ${err.message || 'Lỗi không xác định'}.`,
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

  function handleClearChat() {
    const resetMsg = {
      id: nextId('welcome'),
      role: 'assistant',
      content: 'Hội thoại đã được làm mới. Hãy nhập câu hỏi bạn cần tra cứu!',
      sources: [],
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    }
    setMessages([resetMsg])
    setShowMenu(false)
    try {
      localStorage.setItem(storageKey, JSON.stringify([resetMsg]))
    } catch {
      // ignore
    }
  }

  // Do not render floating widget on the full /ai-chat page
  if (isChatPage) return null

  return (
    <div
      className="floating-ai-support-container"
      style={{
        position: 'fixed',
        bottom: '18px',
        right: '18px',
        zIndex: 1050,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      }}
    >
      {/* ================= OPEN STATE: CHAT WINDOW ================= */}
      {isOpen && (
        <div
          className="shadow-lg d-flex flex-column"
          style={{
            position: 'absolute',
            bottom: '72px',
            right: '0',
            width: '380px',
            maxWidth: 'calc(100vw - 28px)',
            height: '535px',
            maxHeight: 'calc(100vh - 100px)',
            borderRadius: '16px',
            overflow: 'hidden',
            backgroundColor: '#ffffff',
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.22), 0 0 0 1px rgba(0, 0, 0, 0.06)',
            animation: 'fadeInUp 0.18s ease-out',
          }}
        >
          {/* 1. Header (Emerald Green styled like reference screenshot) */}
          <div
            className="d-flex align-items-center justify-content-between px-3 py-2.5 text-white position-relative flex-shrink-0"
            style={{ backgroundColor: '#009e4f', borderTopLeftRadius: '16px', borderTopRightRadius: '16px' }}
          >
            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-sm btn-link text-white p-0 text-decoration-none d-flex align-items-center"
                onClick={() => setIsOpen(false)}
                title="Thu nhỏ"
                style={{ fontSize: '1.25rem', lineHeight: 1 }}
              >
                ‹
              </button>
              <span className="fw-semibold" style={{ fontSize: '0.98rem' }}>
                Trợ lý Tuyển dụng AI
              </span>
            </div>

            <div className="position-relative">
              <button
                type="button"
                className="btn btn-sm btn-link text-white p-1 text-decoration-none d-flex align-items-center"
                onClick={() => setShowMenu((prev) => !prev)}
                title="Tùy chọn"
                style={{ fontSize: '1.2rem', lineHeight: 1 }}
              >
                ≡
              </button>

              {/* Dropdown Menu */}
              {showMenu && (
                <div
                  className="bg-white text-dark shadow-sm rounded-3 py-1 position-absolute end-0 border"
                  style={{ top: '34px', width: '170px', zIndex: 1060, fontSize: '0.82rem' }}
                >
                  <button
                    type="button"
                    className="dropdown-item px-3 py-1.5 d-flex align-items-center gap-2 text-dark"
                    onClick={handleClearChat}
                  >
                    <i className="bi bi-arrow-clockwise text-muted" />
                    <span>Làm mới hội thoại</span>
                  </button>
                  <Link
                    to="/ai-chat"
                    className="dropdown-item px-3 py-1.5 d-flex align-items-center gap-2 text-dark text-decoration-none"
                    onClick={() => setIsOpen(false)}
                  >
                    <i className="bi bi-arrows-angle-expand text-muted" />
                    <span>Toàn màn hình</span>
                  </Link>
                  <div className="dropdown-divider my-1" />
                  <button
                    type="button"
                    className="dropdown-item px-3 py-1.5 d-flex align-items-center gap-2 text-secondary"
                    onClick={() => setIsOpen(false)}
                  >
                    <i className="bi bi-dash-lg" />
                    <span>Thu nhỏ</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 2. Messages Body */}
          <div
            className="flex-grow-1 overflow-y-auto d-flex flex-column gap-2.5"
            style={{
              backgroundColor: '#ffffff',
              fontSize: '0.86rem',
              padding: '14px 14px 10px',
              scrollPaddingTop: '8px',
            }}
          >
            <div style={{ height: '2px', flexShrink: 0 }} />
            {messages.map((m) => {
              const isUser = m.role === 'user'

              if (isUser) {
                return (
                  <div key={m.id} className="d-flex justify-content-end mb-1">
                    <div
                      className="text-white shadow-2xs"
                      style={{
                        maxWidth: '82%',
                        backgroundColor: '#1e293b',
                        borderRadius: '14px 14px 2px 14px',
                        padding: '10px 14px',
                        lineHeight: 1.5,
                        fontSize: '0.86rem',
                        overflowWrap: 'break-word',
                        wordBreak: 'break-word',
                      }}
                    >
                      {m.content}
                    </div>
                  </div>
                )
              }

              // Assistant message (Green bubble with sender name above & avatar on the left, matching screenshot)
              return (
                <div key={m.id} className="d-flex flex-column align-items-start mb-1 w-100">
                  {/* Sender Name */}
                  <div
                    className="text-secondary fw-medium mb-1"
                    style={{ fontSize: '0.74rem', color: '#64748B', marginLeft: '40px' }}
                  >
                    Trợ lý Tuyển dụng AI
                  </div>

                  <div className="d-flex align-items-start gap-2 w-100">
                    {/* Model AI Avatar */}
                    <div
                      className="rounded-circle overflow-hidden flex-shrink-0 shadow-2xs mt-0.5"
                      style={{
                        width: '32px',
                        height: '32px',
                        border: '1.5px solid #009e4f',
                        backgroundColor: '#f1f5f9',
                      }}
                    >
                      <img
                        src="/ai-avatar.png"
                        alt="AI Avatar"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>

                    {/* Green Message Bubble */}
                    <div
                      className="text-white shadow-2xs"
                      style={{
                        maxWidth: '85%',
                        backgroundColor: '#009e4f',
                        borderRadius: '4px 16px 16px 16px',
                        padding: '11px 14px',
                        lineHeight: 1.55,
                        fontSize: '0.865rem',
                        overflowWrap: 'break-word',
                        wordBreak: 'break-word',
                      }}
                    >
                      {formatMessageText(m.content, true)}

                      {/* Source attribution pills */}
                      {Array.isArray(m.sources) && m.sources.length > 0 && (
                        <div className="mt-2.5 pt-2 border-top border-white border-opacity-25 d-flex flex-wrap gap-1.5">
                          {m.sources.map((s, idx) => (
                            <SourcePill key={idx} source={s} onNavigate={() => setIsOpen(false)} />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Quick Actions (Right-aligned outlined green pills, as in screenshot) */}
            <div className="d-flex flex-column align-items-end gap-1.5 mt-1 mb-2">
              {QUICK_ACTIONS.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(item)}
                  className="btn btn-sm text-end shadow-2xs"
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#009e4f',
                    border: '1.5px solid #009e4f',
                    borderRadius: '8px',
                    padding: '6px 14px',
                    fontSize: '0.81rem',
                    fontWeight: 500,
                    maxWidth: '90%',
                    overflowWrap: 'break-word',
                    wordBreak: 'break-word',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#009e4f'
                    e.currentTarget.style.color = '#ffffff'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#ffffff'
                    e.currentTarget.style.color = '#009e4f'
                  }}
                >
                  {item}
                </button>
              ))}
            </div>

            {/* Loading Indicator */}
            {loading && (
              <div className="d-flex align-items-center gap-2 ps-5 py-1">
                <div
                  className="px-2.5 py-1.5 rounded-pill shadow-2xs d-inline-flex align-items-center gap-1.5"
                  style={{ backgroundColor: '#f1f5f9', color: '#009e4f', fontSize: '0.75rem' }}
                >
                  <span className="spinner-border spinner-border-sm" style={{ width: '10px', height: '10px' }} />
                  <span>Đang tra cứu dữ liệu...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* 3. Input Bar (Matches screenshot: "Gõ vào đây và nhấn enter...") */}
          <div className="border-top px-3 py-2 bg-white flex-shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSend()
              }}
              className="d-flex align-items-center justify-content-between gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                className="form-control form-control-sm border-0 px-0 shadow-none"
                style={{ fontSize: '0.84rem', color: '#1e293b' }}
                placeholder="Gõ vào đây và nhấn enter..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
              />
              <div className="d-flex align-items-center gap-1.5 text-muted flex-shrink-0">
                <button
                  type="submit"
                  className="btn btn-sm btn-link p-0 text-decoration-none"
                  style={{ color: input.trim() ? '#009e4f' : '#94a3b8' }}
                  disabled={!input.trim() || loading}
                  title="Gửi"
                >
                  <i className="bi bi-send-fill fs-6" />
                </button>
              </div>
            </form>
          </div>

          {/* 4. Sub-footer "Powered by..." banner */}
          <div
            className="text-center py-1 bg-light border-top text-muted"
            style={{ fontSize: '0.67rem', color: '#64748b' }}
          >
            ⚡ Trợ lý Tuyển dụng AI • Dữ liệu nội bộ
          </div>
        </div>
      )}

      {/* ================= BOTTOM LAUNCHER / COLLAPSE BUTTON ================= */}
      {isOpen ? (
        /* Down Arrow Button when open (Matches screenshot 1) */
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="btn rounded-circle shadow-lg d-flex align-items-center justify-content-center text-white p-0 border-0"
          style={{
            width: '52px',
            height: '52px',
            backgroundColor: '#009e4f',
            cursor: 'pointer',
            transition: 'transform 0.15s ease',
          }}
          title="Thu nhỏ cửa sổ"
          aria-label="Thu nhỏ"
        >
          <i className="bi bi-chevron-down fw-bold" style={{ fontSize: '1.3rem' }} />
        </button>
      ) : (
        /* Closed Launcher with "We Are Here! 👋" Callout (Matches screenshot 2) */
        <div className="position-relative d-flex align-items-center justify-content-end">
          {/* Curved Callout Sticker "Hỏi AI ngay! 👋" */}
          {showSticker && (
            <div
              className="position-absolute d-flex align-items-center gap-1 shadow-sm px-2 py-1 bg-white rounded-pill border"
              style={{
                top: '-34px',
                right: '4px',
                whiteSpace: 'nowrap',
                fontSize: '0.78rem',
                color: '#009e4f',
                fontWeight: 600,
                transform: 'rotate(-4deg)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
                animation: 'bounce 2s infinite',
                cursor: 'pointer',
              }}
              onClick={() => setIsOpen(true)}
            >
              <span>Hỏi AI ngay! 👋</span>
              <button
                type="button"
                className="btn btn-sm btn-link p-0 text-muted text-decoration-none ms-0.5"
                style={{ fontSize: '0.65rem', lineHeight: 1 }}
                onClick={(e) => {
                  e.stopPropagation()
                  setShowSticker(false)
                }}
                title="Đóng thông báo"
              >
                ✕
              </button>
            </div>
          )}

          {/* Circular Button with Model AI Avatar */}
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="btn rounded-circle shadow-lg p-0 border-0 position-relative d-flex align-items-center justify-content-center"
            style={{
              width: '56px',
              height: '56px',
              backgroundColor: '#009e4f',
              cursor: 'pointer',
              transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            title="Mở Trợ lý Tuyển dụng AI"
            aria-label="Mở Trợ lý Tuyển dụng AI"
          >
            <div
              className="rounded-circle overflow-hidden d-flex align-items-center justify-content-center"
              style={{
                width: '48px',
                height: '48px',
                border: '2px solid #ffffff',
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

            {/* Online Green Indicator Dot */}
            <span
              className="position-absolute bg-white rounded-circle d-flex align-items-center justify-content-center"
              style={{
                width: '14px',
                height: '14px',
                top: '0',
                right: '0',
              }}
            >
              <span
                className="bg-success rounded-circle"
                style={{ width: '10px', height: '10px' }}
              />
            </span>
          </button>
        </div>
      )}
    </div>
  )
}
