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
]

function formatMessageText(text, isGreenBubble = false) {
  if (!text) return null
  const lines = text.split('\n')
  return lines.map((line, lIdx) => {
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

function SourcePill({ source }) {
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
        className="badge bg-white bg-opacity-25 text-white border border-white border-opacity-40 text-decoration-none px-2.5 py-1 rounded-pill d-inline-flex align-items-center gap-1.5 fw-normal"
        style={{
          fontSize: '0.75rem',
          transition: 'all 0.15s ease',
          whiteSpace: 'normal',
          textAlign: 'left',
          wordBreak: 'break-word',
          maxWidth: '100%',
        }}
      >
        <i className={`bi ${icon} flex-shrink-0`} />
        <span>{display_name}</span>
        <i className="bi bi-arrow-up-right flex-shrink-0" style={{ fontSize: '0.6rem' }} />
      </Link>
    )
  }

  return (
    <span
      className="badge bg-white bg-opacity-20 text-white border border-white border-opacity-25 px-2.5 py-1 rounded-pill d-inline-flex align-items-center gap-1.5 fw-normal"
      style={{ fontSize: '0.75rem', whiteSpace: 'normal', textAlign: 'left', wordBreak: 'break-word', maxWidth: '100%' }}
    >
      <i className={`bi ${icon} flex-shrink-0`} />
      <span>{display_name}</span>
    </span>
  )
}

const DEFAULT_WELCOME_MESSAGE = {
  id: 'welcome',
  role: 'assistant',
  content:
    'Xin chào! Tôi là trợ lý AI tuyển dụng. Bạn cần tra cứu thông tin ứng viên, kỹ năng, tin tuyển dụng hay lịch phỏng vấn nào?',
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

let msgSeq = 0
function nextId(prefix) {
  msgSeq += 1
  return `${prefix}-${msgSeq}`
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

  // Sync across tabs/windows
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

  // Load index info on mount
  useEffect(() => {
    chatApi
      .indexInfo()
      .then((res) => {
        if (res.data) setIndexInfo(res.data)
      })
      .catch(() => {})
  }, [])

  async function handleSend(customText) {
    const raw = customText !== undefined ? customText : input
    const trimmed = String(raw || '').trim()
    if (!trimmed || loading) return

    const nowStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    const userMsg = {
      id: nextId('u'),
      role: 'user',
      content: trimmed,
      timestamp: nowStr,
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
        id: nextId('a'),
        role: 'assistant',
        content: data.answer || 'Xin lỗi, không tìm thấy thông tin phù hợp trong dữ liệu tuyển dụng.',
        retrievalType: data.retrieval_type,
        sources: Array.isArray(data.sources) ? data.sources : [],
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages((prev) => [...prev, aiMsg])
    } catch (err) {
      const errorMsg = {
        id: nextId('err'),
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

  function handleClearChat() {
    const resetMsg = {
      id: nextId('welcome'),
      role: 'assistant',
      content:
        'Hội thoại đã được làm mới. Hãy nhập câu hỏi bạn cần tra cứu!',
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
    <div className="d-flex flex-column" style={{ maxWidth: '1060px', margin: '0 auto', height: 'calc(100vh - 140px)', minHeight: '620px' }}>
      {/* Outer Card Styled Like The Floating AI Chat Widget */}
      <div
        className="card d-flex flex-column flex-grow-1 border-0 shadow-sm"
        style={{
          borderRadius: '18px',
          overflow: 'hidden',
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
        }}
      >
        {/* 1. Header with Signature Emerald Green */}
        <div
          className="d-flex align-items-center justify-content-between px-3 px-md-4 py-3 text-white flex-shrink-0"
          style={{
            backgroundColor: '#009e4f',
          }}
        >
          <div className="d-flex align-items-center gap-3">
            <div
              className="rounded-circle overflow-hidden flex-shrink-0 shadow-sm"
              style={{
                width: '42px',
                height: '42px',
                border: '2px solid rgba(255,255,255,0.9)',
                backgroundColor: '#ffffff',
              }}
            >
              <img
                src="/ai-avatar.png"
                alt="AI Assistant"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div>
              <div className="d-flex align-items-center gap-2">
                <h1 className="h6 fw-bold mb-0 text-white" style={{ fontSize: '1.05rem', letterSpacing: '-0.01em' }}>
                  Trợ lý Tuyển dụng AI
                </h1>
                <span
                  className="badge rounded-pill fw-medium d-inline-flex align-items-center gap-1.5"
                  style={{ backgroundColor: 'rgba(255,255,255,0.22)', fontSize: '0.72rem', color: '#ffffff' }}
                >
                  <span className="rounded-circle" style={{ width: '6px', height: '6px', backgroundColor: '#4ade80' }} />
                  Trực tuyến
                </span>
              </div>
              <div className="text-white text-opacity-90 small mt-0.5" style={{ fontSize: '0.8rem' }}>
                Tra cứu nhanh hồ sơ ứng viên, kỹ năng CV, vị trí tuyển dụng và lịch phỏng vấn
                {indexInfo?.documents ? ` • Đã đồng bộ ${indexInfo.documents} mục dữ liệu` : ''}
              </div>
            </div>
          </div>

          {/* Action Buttons in Header */}
          <div className="d-flex align-items-center gap-2">
            {isAdmin && (
              <button
                type="button"
                className="btn btn-sm text-white rounded-pill px-3 py-1.5 d-inline-flex align-items-center gap-1.5 shadow-2xs"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.18)',
                  border: '1px solid rgba(255,255,255,0.35)',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  transition: 'all 0.15s ease',
                }}
                onClick={handleReindex}
                disabled={reindexing}
                title="Đồng bộ lại dữ liệu hệ thống vào chỉ mục tìm kiếm"
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.3)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.18)'
                }}
              >
                <i className={`bi ${reindexing ? 'spinner-border spinner-border-sm' : 'bi-arrow-repeat'}`} />
                <span>{reindexing ? 'Đang cập nhật...' : 'Cập nhật dữ liệu'}</span>
              </button>
            )}

            <button
              type="button"
              className="btn btn-sm text-white rounded-pill px-3 py-1.5 d-inline-flex align-items-center gap-1.5 shadow-2xs"
              style={{
                backgroundColor: 'rgba(255,255,255,0.18)',
                border: '1px solid rgba(255,255,255,0.35)',
                fontSize: '0.8rem',
                fontWeight: 500,
                transition: 'all 0.15s ease',
              }}
              onClick={handleClearChat}
              title="Làm mới toàn bộ cuộc trò chuyện"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.18)'
              }}
            >
              <i className="bi bi-arrow-clockwise" />
              <span>Làm mới đoạn chat</span>
            </button>
          </div>
        </div>

        {reindexMsg && (
          <div className="alert alert-info py-2 px-3 small rounded-0 mb-0 border-0 border-bottom d-flex align-items-center gap-2">
            <i className="bi bi-check-circle-fill text-info" />
            <span>{reindexMsg}</span>
          </div>
        )}

        {/* 2. Messages Body */}
        <div
          className="flex-grow-1 p-3 p-md-4 overflow-y-auto d-flex flex-column gap-3"
          style={{
            backgroundColor: '#ffffff',
            scrollPaddingTop: '12px',
          }}
        >
          {messages.map((m) => {
            const isUser = m.role === 'user'

            if (isUser) {
              return (
                <div key={m.id} className="d-flex flex-column align-items-end mb-1">
                  <div
                    className="text-white shadow-2xs"
                    style={{
                      maxWidth: '78%',
                      backgroundColor: '#1e293b',
                      borderRadius: '16px 16px 4px 16px',
                      padding: '11px 16px',
                      lineHeight: 1.55,
                      fontSize: '0.915rem',
                      overflowWrap: 'break-word',
                      wordBreak: 'break-word',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {m.content}
                  </div>
                  {m.timestamp && (
                    <span className="text-muted mt-1 px-1" style={{ fontSize: '0.72rem' }}>
                      {m.timestamp}
                    </span>
                  )}
                </div>
              )
            }

            // Assistant message: Green bubble styled like Floating AI Chat
            return (
              <div key={m.id} className="d-flex flex-column align-items-start mb-1 w-100">
                {/* Sender Name */}
                <div
                  className="text-secondary fw-medium mb-1"
                  style={{ fontSize: '0.75rem', color: '#64748B', marginLeft: '44px' }}
                >
                  Trợ lý Tuyển dụng AI
                </div>

                <div className="d-flex align-items-start gap-2.5 w-100">
                  {/* Model AI Avatar */}
                  <div
                    className="rounded-circle overflow-hidden flex-shrink-0 shadow-2xs mt-0.5"
                    style={{
                      width: '34px',
                      height: '34px',
                      border: '1.5px solid #009e4f',
                      backgroundColor: '#ffffff',
                    }}
                  >
                    <img
                      src="/ai-avatar.png"
                      alt="AI"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>

                  {/* Green Message Bubble */}
                  <div className="d-flex flex-column" style={{ maxWidth: '82%' }}>
                    <div
                      className="text-white shadow-2xs"
                      style={{
                        backgroundColor: '#009e4f',
                        borderRadius: '4px 18px 18px 18px',
                        padding: '13px 17px',
                        lineHeight: 1.6,
                        fontSize: '0.915rem',
                        overflowWrap: 'break-word',
                        wordBreak: 'break-word',
                      }}
                    >
                      {formatMessageText(m.content, true)}

                      {/* Source attribution pills */}
                      {Array.isArray(m.sources) && m.sources.length > 0 && (
                        <div className="mt-2.5 pt-2 border-top border-white border-opacity-25 d-flex flex-wrap gap-1.5">
                          {m.sources.map((s, idx) => (
                            <SourcePill key={idx} source={s} />
                          ))}
                        </div>
                      )}
                    </div>

                    {m.timestamp && (
                      <span className="text-muted mt-1 px-1" style={{ fontSize: '0.72rem' }}>
                        {m.timestamp}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          {/* Loading Indicator */}
          {loading && (
            <div className="d-flex align-items-start gap-2.5">
              <div
                className="rounded-circle overflow-hidden flex-shrink-0 mt-0.5"
                style={{ width: '34px', height: '34px', border: '1.5px solid #009e4f' }}
              >
                <img src="/ai-avatar.png" alt="AI" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div
                className="px-3.5 py-2 rounded-pill shadow-2xs d-inline-flex align-items-center gap-2"
                style={{ backgroundColor: '#f1f5f9', color: '#009e4f', fontSize: '0.82rem', fontWeight: 500 }}
              >
                <span className="spinner-border spinner-border-sm" style={{ width: '12px', height: '12px' }} />
                <span>Trợ lý AI đang tra cứu dữ liệu tuyển dụng...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 3. Bottom Area: Quick Suggestions & Input Bar */}
        <div className="border-top px-3 px-md-4 py-3 bg-white flex-shrink-0">
          {/* Quick Suggestions (Green Outlined Pills) */}
          <div className="d-flex align-items-center gap-1.5 mb-2.5 overflow-x-auto pb-1">
            <span className="small text-muted flex-shrink-0 me-1" style={{ fontSize: '0.785rem' }}>
              <i className="bi bi-lightbulb-fill text-warning me-1" />
              Gợi ý:
            </span>
            {QUICK_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                type="button"
                className="btn btn-sm shadow-2xs rounded-pill px-3 py-1 text-nowrap"
                style={{
                  backgroundColor: '#ffffff',
                  color: '#009e4f',
                  border: '1.5px solid #009e4f',
                  fontSize: '0.8rem',
                  fontWeight: 500,
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
                onClick={() => handleSend(q)}
                disabled={loading}
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
            className="d-flex align-items-center gap-2"
          >
            <input
              type="text"
              className="form-control"
              placeholder="Gõ câu hỏi tuyển dụng vào đây và nhấn Enter... (VD: Ứng viên nào có kinh nghiệm Flask?)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              maxLength={1000}
              style={{
                borderRadius: '24px',
                padding: '10px 18px',
                fontSize: '0.92rem',
                borderColor: '#cbd5e1',
                backgroundColor: '#f8fafc',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#009e4f'
                e.target.style.boxShadow = '0 0 0 3px rgba(0, 158, 79, 0.15)'
                e.target.style.backgroundColor = '#ffffff'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#cbd5e1'
                e.target.style.boxShadow = 'none'
                e.target.style.backgroundColor = '#f8fafc'
              }}
            />

            <button
              type="submit"
              className="btn d-inline-flex align-items-center gap-1.5 flex-shrink-0 shadow-2xs"
              style={{
                backgroundColor: '#009e4f',
                color: '#ffffff',
                borderRadius: '24px',
                padding: '10px 22px',
                fontWeight: 500,
                fontSize: '0.92rem',
                transition: 'all 0.15s ease',
              }}
              disabled={loading || !input.trim()}
              onMouseEnter={(e) => {
                if (!loading && input.trim()) e.currentTarget.style.backgroundColor = '#008542'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#009e4f'
              }}
            >
              {loading ? (
                <span className="spinner-border spinner-border-sm" role="status" />
              ) : (
                <>
                  <span>Gửi</span>
                  <i className="bi bi-send-fill" style={{ fontSize: '0.85rem' }} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
