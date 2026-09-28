import { useState } from 'react'
import { formatAiType } from '../utils/formatters'

/**
 * Preprocess raw text from AI to normalize headings and list items
 * so they are properly formatted into structured blocks even if Gemini
 * did not output double newlines.
 */
function normalizeAiMarkdown(text) {
  if (!text) return ''
  let cleaned = text

  // Normalize newlines
  cleaned = cleaned.replace(/\r\n/g, '\n')

  // Insert double newlines before bold numbered headings e.g. **1. Tiêu đề** or 1. **Tiêu đề**
  cleaned = cleaned.replace(/([^\n])\s*(\*\*\d+\.\s+[^*]+?\*\*)/g, '$1\n\n$2')
  cleaned = cleaned.replace(/([^\n])\s*(\d+\.\s+\*\*[^*]+?\*\*)/g, '$1\n\n$2')

  // Insert newline before bullet items like * Bullet or - Bullet
  cleaned = cleaned.replace(/([^\n])\s+([*•-]\s+[A-ZÀ-Ỹa-z0-9])/g, '$1\n$2')

  // Insert double newlines before markdown headings ###
  cleaned = cleaned.replace(/([^\n])\s*(#{1,6}\s+)/g, '$1\n\n$2')

  return cleaned
}

/**
 * Parse inline formatting: **bold**, `code/tag`, *italic*
 * and remove any leftover raw asterisks.
 */
function parseInlineMarkup(text) {
  if (!text) return null
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
      // Clean any stray asterisks or backticks in the remaining plain text
      const cleanRemaining = remaining.replace(/[*`]/g, '')
      parts.push(<span key={key++}>{cleanRemaining}</span>)
      break
    }

    const idx = nextMatch.index
    if (idx > 0) {
      const cleanBefore = remaining.slice(0, idx).replace(/[*`]/g, '')
      parts.push(<span key={key++}>{cleanBefore}</span>)
    }

    if (matchType === 'bold') {
      parts.push(
        <strong key={key++} className="fw-bold text-dark">
          {nextMatch[1]}
        </strong>
      )
    } else if (matchType === 'code') {
      parts.push(
        <span
          key={key++}
          className="badge bg-light text-primary border fw-semibold px-2 py-0.5 mx-1"
          style={{ fontSize: '0.82rem' }}
        >
          {nextMatch[1]}
        </span>
      )
    }

    remaining = remaining.slice(idx + nextMatch[0].length)
  }

  return parts
}

function renderInterviewQuestions(content) {
  const normalized = normalizeAiMarkdown(content)
  const lines = normalized.split('\n')
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
        rawText: `${qNum}. ${topic ? `(${topic}) ` : ''}${qBody.replace(/[*#]/g, '')}`,
      })
      continue
    }

    if (!currentCategory && currentQuestions.length === 0) {
      introLines.push(line)
    } else {
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
        <div className="ai-summary-intro-banner mb-3.5 d-flex align-items-start gap-2.5">
          <i className="bi bi-chat-quote-fill text-primary fs-5 mt-0.5 flex-shrink-0"></i>
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
                    <span
                      className="badge rounded-pill px-2.5 py-1 small fw-bold"
                      style={{ backgroundColor: '#e0e7ff', color: '#4338ca' }}
                    >
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
                    <span style={{ fontSize: '0.75rem' }}>Sao chép</span>
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

  const cleanBody = bodyLines.join('\n').trim().replace(/[*#]/g, '')

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

function renderCvSummary(content) {
  const normalized = normalizeAiMarkdown(content)
  const lines = normalized.split('\n')

  const introLines = []
  const sections = []
  let currentSec = null

  function flushSec() {
    if (currentSec) {
      sections.push({ ...currentSec })
      currentSec = null
    }
  }

  for (let rawLine of lines) {
    const line = rawLine.trim()
    if (!line) continue

    // Detect section header:
    // **1. Tóm tắt kinh nghiệm chính** or 1. **Tóm tắt...** or 1. Tóm tắt kinh nghiệm chính or ### 1. ...
    const boldSecMatch = line.match(/^(\*\*(?:(\d+)\.\s*)?([^*]+?)\*\*|\d+\.\s+\*\*([^*]+?)\*\*):?$/)
    const numSecMatch = !boldSecMatch && line.match(/^(\d+)\.\s+(Tóm tắt|Kỹ năng|Bằng chứng|Những nội dung|Nội dung|Đánh giá|Kinh nghiệm|Điểm mạnh|Điểm yếu|Khuyến nghị|Phù hợp|Phỏng vấn).*$/i)
    const headingMatch = !boldSecMatch && !numSecMatch && line.match(/^#{1,4}\s+(.+)$/)

    if (boldSecMatch || numSecMatch || headingMatch) {
      flushSec()
      let num = ''
      let title = ''

      if (boldSecMatch) {
        num = boldSecMatch[2] || ''
        title = (boldSecMatch[3] || boldSecMatch[4] || '').trim()
      } else if (numSecMatch) {
        num = numSecMatch[1]
        title = line.replace(/^\d+\.\s+/, '').trim()
      } else if (headingMatch) {
        title = headingMatch[1].replace(/[*#]/g, '').trim()
        const hNum = title.match(/^(\d+)\.\s*(.*)$/)
        if (hNum) {
          num = hNum[1]
          title = hNum[2].trim()
        }
      }

      currentSec = {
        num: num ? String(num).padStart(2, '0') : String(sections.length + 1).padStart(2, '0'),
        title: title,
        items: [],
      }
      continue
    }

    if (currentSec) {
      const bulletMatch = line.match(/^[-*•]\s+(.+)$/)
      if (bulletMatch) {
        currentSec.items.push(bulletMatch[1].trim())
      } else {
        currentSec.items.push(line)
      }
    } else {
      introLines.push(line)
    }
  }

  flushSec()

  function getSectionTheme(sec, idx) {
    const titleLower = (sec.title || '').toLowerCase()
    if (sec.num === '01' || titleLower.includes('kinh nghiệm') || titleLower.includes('tóm tắt')) {
      return {
        cardClass: 'ai-section-card ai-section-card-experience',
        icon: 'bi-briefcase-fill text-primary',
        badgeBg: '#2563EB',
        bulletIcon: 'bi-check2-circle text-primary',
      }
    }
    if (sec.num === '02' || titleLower.includes('kỹ năng') || titleLower.includes('chuyên môn')) {
      return {
        cardClass: 'ai-section-card ai-section-card-skills',
        icon: 'bi-lightning-charge-fill text-warning',
        badgeBg: '#D97706',
        bulletIcon: 'bi-lightning-fill text-warning',
      }
    }
    if (sec.num === '03' || titleLower.includes('bằng chứng') || titleLower.includes('phù hợp')) {
      return {
        cardClass: 'ai-section-card ai-section-card-evidence',
        icon: 'bi-shield-check text-success',
        badgeBg: '#059669',
        bulletIcon: 'bi-check-circle-fill text-success',
      }
    }
    if (sec.num === '04' || titleLower.includes('hỏi thêm') || titleLower.includes('phỏng vấn')) {
      return {
        cardClass: 'ai-section-card ai-section-card-questions',
        icon: 'bi-patch-question-fill text-purple',
        badgeBg: '#7C3AED',
        bulletIcon: 'bi-question-circle-fill text-purple',
        isQuestions: true,
      }
    }
    const colors = ['#2563EB', '#D97706', '#059669', '#7C3AED']
    const classes = ['ai-section-card-experience', 'ai-section-card-skills', 'ai-section-card-evidence', 'ai-section-card-questions']
    return {
      cardClass: `ai-section-card ${classes[idx % classes.length]}`,
      icon: 'bi-stars text-primary',
      badgeBg: colors[idx % colors.length],
      bulletIcon: 'bi-check-circle-fill text-primary',
    }
  }

  if (sections.length === 0) {
    return (
      <div className="ai-summary-layout">
        {lines.map((l, i) => (
          <p key={i} className="text-dark mb-2" style={{ lineHeight: 1.65 }}>
            {parseInlineMarkup(l)}
          </p>
        ))}
      </div>
    )
  }

  return (
    <div className="ai-summary-layout">
      {/* Intro Banner */}
      {introLines.length > 0 && (
        <div className="ai-summary-intro-banner mb-3.5 d-flex align-items-start gap-2.5">
          <i className="bi bi-chat-square-quote-fill fs-5 mt-0.5 text-primary flex-shrink-0"></i>
          <div>
            {introLines.map((l, i) => (
              <div key={i} className={i > 0 ? 'mt-1' : ''}>
                {parseInlineMarkup(l)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Prominent Section Cards */}
      <div className="d-flex flex-column">
        {sections.map((sec, sIdx) => {
          const theme = getSectionTheme(sec, sIdx)
          return (
            <div key={sIdx} className={theme.cardClass}>
              <div className="ai-section-card-header">
                <div className="d-flex align-items-center gap-2.5">
                  <span
                    className="badge rounded-pill fw-bold text-white shadow-xs px-2.5 py-1"
                    style={{ backgroundColor: theme.badgeBg, fontSize: '0.8rem', letterSpacing: '0.02em' }}
                  >
                    {sec.num}
                  </span>
                  <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: '0.98rem' }}>
                    {sec.title}
                  </h6>
                </div>
                <i className={`${theme.icon} fs-5`}></i>
              </div>

              <div className="ai-section-card-body">
                {sec.items.map((item, itIdx) => {
                  const itemLower = item.toLowerCase()
                  const isWarning =
                    itemLower.startsWith('lưu ý:') ||
                    itemLower.startsWith('chú ý:') ||
                    itemLower.startsWith('thiếu:') ||
                    itemLower.startsWith('cảnh báo:')
                  const isQuestion = theme.isQuestions

                  let rowClass = 'ai-item-row'
                  if (isWarning) rowClass += ' ai-item-warning'
                  else if (isQuestion) rowClass += ' ai-item-question'

                  return (
                    <div key={itIdx} className={rowClass}>
                      {isWarning ? (
                        <i className="bi bi-exclamation-triangle-fill text-warning mt-0.5 flex-shrink-0 fs-6"></i>
                      ) : isQuestion ? (
                        <span
                          className="d-inline-flex align-items-center justify-content-center rounded-circle flex-shrink-0 fw-bold mt-0.5"
                          style={{ width: '22px', height: '22px', backgroundColor: '#EDE9FE', color: '#7C3AED', fontSize: '0.72rem' }}
                        >
                          Q{itIdx + 1}
                        </span>
                      ) : (
                        <i className={`${theme.bulletIcon} mt-0.5 flex-shrink-0 fs-6`}></i>
                      )}

                      <div className="flex-grow-1" style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }}>
                        {parseInlineMarkup(item)}
                      </div>

                      {isQuestion && (
                        <button
                          type="button"
                          className="btn btn-sm btn-link text-muted p-0 text-decoration-none flex-shrink-0 ms-1"
                          onClick={() => {
                            if (navigator.clipboard) {
                              navigator.clipboard.writeText(item.replace(/[*#]/g, ''))
                            }
                          }}
                          title="Sao chép câu hỏi này"
                        >
                          <i className="bi bi-clipboard"></i>
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function FormattedAiContent({ content, type }) {
  const [copiedAll, setCopiedAll] = useState(false)

  if (!content) return null

  function handleCopyAll() {
    if (navigator.clipboard) {
      const cleanContent = content
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/^#{1,6}\s+/gm, '')
        .replace(/`([^`]+)`/g, '$1')
      navigator.clipboard.writeText(cleanContent)
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
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-sm btn-outline-primary rounded-pill px-3 py-1 small d-inline-flex align-items-center gap-1.5"
            onClick={handleCopyAll}
            title="Sao chép nội dung đã định dạng"
          >
            <i className={`bi ${copiedAll ? 'bi-check-lg text-success' : 'bi-clipboard'}`}></i>
            <span style={{ fontSize: '0.78rem' }}>{copiedAll ? 'Đã sao chép!' : 'Sao chép toàn bộ'}</span>
          </button>
        </div>
      </div>

      {/* Render structured content based on AI action type */}
      {type === 'INTERVIEW_QUESTION' ? (
        renderInterviewQuestions(content)
      ) : type === 'EMAIL' ? (
        renderEmailContent(content)
      ) : (
        renderCvSummary(content)
      )}
    </div>
  )
}
