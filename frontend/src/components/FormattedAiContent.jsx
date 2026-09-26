import { useState } from 'react'
import { formatAiType } from '../utils/formatters'

function parseInlineMarkup(text) {
  if (!text) return null
  // Split by bold (**bold**) and backtick (`code`)
  const parts = []
  let remaining = text
  let key = 0

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*(.*?)\*\*/)
    const codeMatch = remaining.match(/`([^`]+)`/)

    let nextMatch = null
    let matchType = null

    if (boldMatch && codeMatch) {
      if (boldMatch.index < codeMatch.index) {
        nextMatch = boldMatch
        matchType = 'bold'
      } else {
        nextMatch = codeMatch
        matchType = 'code'
      }
    } else if (boldMatch) {
      nextMatch = boldMatch
      matchType = 'bold'
    } else if (codeMatch) {
      nextMatch = codeMatch
      matchType = 'code'
    }

    if (!nextMatch) {
      parts.push(<span key={key++}>{remaining}</span>)
      break
    }

    const idx = nextMatch.index
    if (idx > 0) {
      parts.push(<span key={key++}>{remaining.slice(0, idx)}</span>)
    }

    if (matchType === 'bold') {
      parts.push(
        <strong key={key++} className="fw-bold text-dark">
          {nextMatch[1]}
        </strong>
      )
    } else if (matchType === 'code') {
      parts.push(
        <code key={key++} className="ai-inline-code">
          {nextMatch[1]}
        </code>
      )
    }

    remaining = remaining.slice(idx + nextMatch[0].length)
  }

  return parts
}

function renderInterviewQuestions(content) {
  const lines = content.split('\n')
  const blocks = []
  let introLines = []
  let currentCategory = null
  let currentQuestions = []

  function flushCategory() {
    if (currentCategory || currentQuestions.length > 0) {
      blocks.push({
        category: currentCategory,
        questions: [...currentQuestions],
      })
      currentCategory = null
      currentQuestions = []
    }
  }

  for (let rawLine of lines) {
    const line = rawLine.trim()
    if (!line) continue

    // Detect Category header: ### Header or ## Header
    const headingMatch = line.match(/^#{2,4}\s+(.+)$/)
    if (headingMatch) {
      flushCategory()
      currentCategory = headingMatch[1].replace(/[*#]/g, '').trim()
      continue
    }

    // Detect numbered question: 1. **(Topic):** Question or 1. Question
    const questionMatch = line.match(/^(\d+)\.\s+(.*)$/)
    if (questionMatch) {
      const qNum = questionMatch[1]
      let qBody = questionMatch[2]

      // Extract topic tag like **(Topic):** or (Topic): or [Topic]:
      let topic = null
      const topicMatch = qBody.match(/^(\*\*(?:\((.*?)\)|\[(.*?)\]|(.*?))\*\*:?|\((.*?)\):?|\[(.*?)\]:?)\s*(.*)$/)
      if (topicMatch) {
        topic = (topicMatch[2] || topicMatch[3] || topicMatch[4] || topicMatch[5] || topicMatch[6] || '').trim()
        qBody = topicMatch[7] || ''
      }

      currentQuestions.push({
        num: qNum,
        topic: topic,
        body: qBody,
        rawText: `${qNum}. ${topic ? `(${topic}) ` : ''}${qBody}`,
      })
      continue
    }

    // Otherwise, if no category yet, treat as intro
    if (!currentCategory && currentQuestions.length === 0) {
      introLines.push(line)
    } else {
      // General paragraph within category or question continuation
      if (currentQuestions.length > 0) {
        currentQuestions[currentQuestions.length - 1].body += ' ' + line
      } else {
        introLines.push(line)
      }
    }
  }

  flushCategory()

  return (
    <div className="ai-interview-layout">
      {introLines.length > 0 && (
        <div className="ai-intro-banner mb-3 p-3 rounded-3 bg-light border d-flex align-items-start gap-2.5">
          <i className="bi bi-chat-quote-fill text-primary fs-5 mt-0.5"></i>
          <div className="text-secondary small" style={{ lineHeight: 1.6 }}>
            {introLines.map((l, i) => (
              <p key={i} className="mb-1 last:mb-0">
                {parseInlineMarkup(l)}
              </p>
            ))}
          </div>
        </div>
      )}

      {blocks.map((block, bIdx) => (
        <div key={bIdx} className="mb-4">
          {block.category && (
            <div className="ai-section-title mb-2.5 d-flex align-items-center gap-2">
              <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2.5 py-1 rounded-pill small fw-semibold">
                <i className="bi bi-tag-fill me-1"></i>
                {block.category}
              </span>
              <div className="flex-grow-1 border-bottom border-light-subtle"></div>
            </div>
          )}

          <div className="d-flex flex-column gap-2.5">
            {block.questions.map((q, qIdx) => (
              <div key={qIdx} className="ai-question-card p-3 rounded-3 bg-white border">
                <div className="d-flex justify-content-between align-items-center mb-1.5 flex-wrap gap-2">
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-indigo-subtle text-indigo rounded-pill px-2.5 py-1 small fw-bold" style={{ backgroundColor: '#e0e7ff', color: '#4338ca' }}>
                      Câu {String(q.num).padStart(2, '0')}
                    </span>
                    {q.topic && (
                      <span className="badge bg-light text-secondary border rounded-pill px-2.5 py-1 small fw-medium">
                        {q.topic}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-link text-muted p-0 text-decoration-none d-inline-flex align-items-center gap-1 small"
                    onClick={() => {
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(q.rawText)
                      }
                    }}
                    title="Sao chép riêng câu hỏi này"
                  >
                    <i className="bi bi-clipboard"></i>
                    <span style={{ fontSize: '0.75rem' }}>Sao chép câu hỏi</span>
                  </button>
                </div>
                <div className="text-dark" style={{ fontSize: '0.925rem', lineHeight: 1.65, overflowWrap: 'break-word', wordBreak: 'break-word' }}>
                  {parseInlineMarkup(q.body)}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function renderEmailContent(content) {
  const lines = content.split('\n')
  let subject = ''
  const bodyLines = []

  for (let rawLine of lines) {
    const line = rawLine.trim()
    const subjMatch = line.match(/^(?:Tiêu\s+đề|Subject|Chủ\s+đề):\s*(.+)$/i)
    if (subjMatch && !subject) {
      subject = subjMatch[1].replace(/[*#]/g, '').trim()
    } else {
      bodyLines.push(rawLine)
    }
  }

  const cleanBody = bodyLines.join('\n').trim()

  return (
    <div className="ai-email-layout">
      {subject && (
        <div className="ai-email-subject-box mb-3 p-3 rounded-3 bg-light border d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2">
          <div className="d-flex align-items-center gap-2 min-w-0">
            <span className="badge bg-success-subtle text-success border border-success-subtle px-2.5 py-1 rounded-pill small fw-semibold flex-shrink-0">
              <i className="bi bi-envelope-check-fill me-1"></i>
              Tiêu đề email
            </span>
            <span className="fw-bold text-dark text-truncate" style={{ fontSize: '0.925rem' }}>
              {subject}
            </span>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-outline-success rounded-pill px-3 py-1 flex-shrink-0 d-inline-flex align-items-center gap-1.5"
            onClick={() => {
              if (navigator.clipboard) {
                navigator.clipboard.writeText(subject)
              }
            }}
          >
            <i className="bi bi-clipboard"></i>
            <span style={{ fontSize: '0.785rem' }}>Sao chép tiêu đề</span>
          </button>
        </div>
      )}

      <div className="ai-email-body-box p-3.5 p-md-4 rounded-3 bg-white border">
        <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
          <div className="small text-muted fw-semibold d-flex align-items-center gap-1.5">
            <i className="bi bi-file-earmark-text"></i>
            <span>Nội dung bức thư</span>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary rounded-pill px-2.5 py-0.5 small"
            onClick={() => {
              if (navigator.clipboard) {
                navigator.clipboard.writeText(cleanBody)
              }
            }}
          >
            <i className="bi bi-clipboard me-1"></i>
            Sao chép nội dung
          </button>
        </div>

        <div
          className="text-dark"
          style={{
            whiteSpace: 'pre-wrap',
            lineHeight: 1.7,
            fontSize: '0.925rem',
            overflowWrap: 'break-word',
            wordBreak: 'break-word',
          }}
        >
          {bodyLines.map((line, idx) => (
            <div key={idx} className={line.trim() === '' ? 'my-2' : ''}>
              {parseInlineMarkup(line)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function renderGenericOrSummary(content) {
  const lines = content.split('\n')
  const elements = []
  let currentList = []

  function flushList() {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="list-unstyled d-flex flex-column gap-2 mb-3">
          {currentList.map((item, idx) => (
            <li key={idx} className="d-flex align-items-start gap-2 text-dark small" style={{ lineHeight: 1.6 }}>
              <i className="bi bi-check2-circle text-primary mt-1 flex-shrink-0"></i>
              <div style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }}>
                {parseInlineMarkup(item)}
              </div>
            </li>
          ))}
        </ul>
      )
      currentList = []
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i]
    const line = rawLine.trim()
    if (!line) {
      flushList()
      continue
    }

    // Headings: ### Title or ## Title
    const headingMatch = line.match(/^#{1,4}\s+(.+)$/)
    if (headingMatch) {
      flushList()
      elements.push(
        <div key={`h-${i}`} className="mt-3 mb-2 pb-1 border-bottom border-light-subtle d-flex align-items-center gap-2">
          <i className="bi bi-stars text-primary"></i>
          <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: '0.95rem' }}>
            {headingMatch[1].replace(/[*#]/g, '').trim()}
          </h6>
        </div>
      )
      continue
    }

    // Bullet items: * item, - item
    const bulletMatch = line.match(/^[-*•]\s+(.+)$/)
    if (bulletMatch) {
      currentList.push(bulletMatch[1])
      continue
    }

    // Numbered items
    const numMatch = line.match(/^(\d+)\.\s+(.+)$/)
    if (numMatch) {
      flushList()
      elements.push(
        <div key={`num-${i}`} className="d-flex align-items-start gap-2 mb-2 p-2.5 rounded bg-light border-0 text-dark small">
          <span className="badge bg-secondary-subtle text-secondary rounded-pill fw-bold">
            {numMatch[1]}
          </span>
          <div className="flex-grow-1" style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }}>
            {parseInlineMarkup(numMatch[2])}
          </div>
        </div>
      )
      continue
    }

    // Regular paragraph
    flushList()
    elements.push(
      <p key={`p-${i}`} className="text-secondary small mb-2" style={{ lineHeight: 1.65, overflowWrap: 'break-word', wordBreak: 'break-word' }}>
        {parseInlineMarkup(line)}
      </p>
    )
  }

  flushList()

  return <div className="ai-summary-layout">{elements}</div>
}

export default function FormattedAiContent({ content, type }) {
  const [showRaw, setShowRaw] = useState(false)
  const [copiedAll, setCopiedAll] = useState(false)

  if (!content) return null

  function handleCopyAll() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(content)
      setCopiedAll(true)
      setTimeout(() => setCopiedAll(false), 2000)
    }
  }

  return (
    <div className="ai-formatted-container">
      {/* Top action toolbar */}
      <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom flex-wrap gap-2">
        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2.5 py-1 rounded-pill small fw-semibold">
            {formatAiType(type)}
          </span>
          <span className="text-muted small">
            {showRaw ? 'Chế độ văn bản thô' : 'Chế độ hiển thị trực quan'}
          </span>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary rounded-pill px-2.5 py-0.5 small d-inline-flex align-items-center gap-1"
            onClick={() => setShowRaw(!showRaw)}
            title="Chuyển đổi giữa định dạng thẻ và văn bản thô"
          >
            <i className={`bi ${showRaw ? 'bi-layout-text-window' : 'bi-code-slash'}`}></i>
            <span style={{ fontSize: '0.75rem' }}>{showRaw ? 'Xem dạng thẻ' : 'Xem dạng thô'}</span>
          </button>

          <button
            type="button"
            className="btn btn-sm btn-outline-primary rounded-pill px-2.5 py-0.5 small d-inline-flex align-items-center gap-1"
            onClick={handleCopyAll}
          >
            <i className={`bi ${copiedAll ? 'bi-check-lg text-success' : 'bi-clipboard'}`}></i>
            <span style={{ fontSize: '0.75rem' }}>{copiedAll ? 'Đã sao chép!' : 'Sao chép toàn bộ'}</span>
          </button>
        </div>
      </div>

      {/* Content Rendering */}
      {showRaw ? (
        <div
          className="p-3 rounded-3 bg-light border small text-dark"
          style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, overflowWrap: 'break-word', wordBreak: 'break-word' }}
        >
          {content}
        </div>
      ) : type === 'INTERVIEW_QUESTION' ? (
        renderInterviewQuestions(content)
      ) : type === 'EMAIL' ? (
        renderEmailContent(content)
      ) : (
        renderGenericOrSummary(content)
      )}
    </div>
  )
}
