import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button, ChatLayout, ChatBubble, ChatInput, TypingIndicator, ChevronLeft } from '@akong/core'
import { toast } from 'sonner'
import { api } from '@/api/client'

const META_AGENT_ID = 'ag_builtin_meta-xiaozao'
const SESSION_KEY = 'cast_create_session'
const SESSION_QS = 's'
const MAX_TURNS = 10

type Msg = { role: 'user' | 'assistant'; content: string }
const INTRO: Msg = {
  role: 'assistant',
  content: '你好 · 我是角色助手。\n你想造一个啥样的虚拟角色？她 / 他擅长什么 · 想接什么样的活？',
}

/** session_id 前端自生 · `s_` + 12 位 [a-z0-9] · 不引 nanoid 依赖 */
function newSessionId(): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let s = 's_'
  const rnd = new Uint8Array(12)
  crypto.getRandomValues(rnd)
  for (let i = 0; i < 12; i++) s += alphabet[rnd[i] % alphabet.length]
  return s
}

/**
 * 取 / 建 session_id · 优先级:
 *   url query `?s=...` > sessionStorage > 新生
 * 持久化策略: 取到 / 新生后立刻同步到 sessionStorage + url (replaceState · 不污染 history)
 * sessionStorage = 同 tab 刷新不丢 · url query = 复制粘贴 / 跳转保留
 */
function ensureSessionId(searchParams: URLSearchParams): string {
  const fromUrl = searchParams.get(SESSION_QS)
  const fromStorage = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(SESSION_KEY) : null
  const sid = fromUrl || fromStorage || newSessionId()
  try {
    sessionStorage.setItem(SESSION_KEY, sid)
  } catch {
    // storage 可能被禁 · 忽略
  }
  if (fromUrl !== sid && typeof window !== 'undefined') {
    const url = new URL(window.location.href)
    url.searchParams.set(SESSION_QS, sid)
    window.history.replaceState({}, '', url.toString())
  }
  return sid
}

export default function CreateRolePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [sessionId, setSessionId] = useState<string>(() => ensureSessionId(searchParams))
  const [history, setHistory] = useState<Msg[]>([INTRO])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [createdId, setCreatedId] = useState<string | null>(null)

  useEffect(() => {
    document.body.classList.add('no-body-scroll')
    return () => document.body.classList.remove('no-body-scroll')
  }, [])

  const send = async (text: string) => {
    if (!text.trim() || sending) return
    setSending(true)
    const newHistory: Msg[] = [...history, { role: 'user', content: text }]
    setHistory(newHistory)
    setDraft('')
    try {
      const r = await api.agentRun({
        agentId: META_AGENT_ID,
        sessionId,
        userMessage: text,
        maxTurns: MAX_TURNS,
      })
      // 跟 Claude Code 风一样: 只渲染 final_text · 不展示中间 system / tool_use turns
      const reply = (r.final_text || '').trim() || '...'
      setHistory([...newHistory, { role: 'assistant', content: reply }])
      const createAction = r.actions.find((a) => a.tool_id === 'cast.create_agent')
      const createdAgentId =
        (createAction?.result as { agent_id?: string } | null)?.agent_id || null
      if (createdAgentId) {
        setCreatedId(createdAgentId)
        toast.success('艺人创建成功')
      }
    } catch (e) {
      toast.error('网络出错', { description: String(e) })
      setHistory([...newHistory, { role: 'assistant', content: '(出错了 · 再说一次?)' }])
    } finally {
      setSending(false)
    }
  }

  /**
   * 重新开始 · 清 session + 重生 session_id + 清 UI history。
   * 不调上游 DELETE chat_messages — 老 session 留在 cast-api DB 做审计 · 用新 session_id 起新对话即可。
   */
  const restart = () => {
    if (sending) return
    const sid = newSessionId()
    try {
      sessionStorage.setItem(SESSION_KEY, sid)
    } catch {
      // ignore
    }
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.set(SESSION_QS, sid)
      window.history.replaceState({}, '', url.toString())
    }
    setSessionId(sid)
    setHistory([INTRO])
    setCreatedId(null)
    setDraft('')
    toast.success('已重新开始')
  }

  const sessionShort = useMemo(() => sessionId.slice(0, 8), [sessionId])

  const header = (
    <header
      data-testid="create-role-header"
      className="bg-[var(--ak-bg)]/85 backdrop-blur flex items-center px-2 py-2 safe-top border-b border-[var(--ak-border-subtle)]"
    >
      <button onClick={() => navigate(-1)} aria-label="返回" className="w-11 h-11 flex items-center justify-center"><ChevronLeft size={24} /></button>
      <div className="flex-1">
        <div className="font-semibold leading-tight">角色助手</div>
        <div className="text-[11px] text-[var(--ak-fg-secondary)]" data-testid="session-indicator">
          会话 {sessionShort}
        </div>
      </div>
      <button
        data-testid="restart-btn"
        onClick={restart}
        aria-label="重新开始"
        disabled={sending}
        className="px-3 h-9 mr-1 text-[13px] font-medium text-[var(--ak-fg-secondary)] hover:text-[var(--ak-fg)] disabled:opacity-50 rounded-md"
      >
        重开
      </button>
    </header>
  )

  const footer = createdId ? (
    <div className="p-3 bg-[var(--ak-bg)] pb-[calc(0.75rem+env(safe-area-inset-bottom))] border-t border-[var(--ak-border-subtle)]">
      <div data-testid="go-to-me-btn">
        <Button variant="primary" size="lg" fullWidth onPress={() => navigate('/me')}>
          创建成功 · 去看我的角色
        </Button>
      </div>
    </div>
  ) : (
    <div data-testid="chat-input">
      <ChatInput
        value={draft}
        onChange={setDraft}
        onSend={send}
        disabled={sending}
        placeholder="说说你想造什么角色..."
      />
    </div>
  )

  return (
    <div className="fixed inset-0 z-40 mx-auto max-w-[480px]">
      <ChatLayout
        header={header}
        footer={footer}
        scrollKey={history.length + (sending ? 1 : 0)}
      >
        <div className="px-3 py-4 space-y-3">
          {history.map((m, i) => (
            <div key={i} data-testid={`bubble-${i}`}>
              <ChatBubble role={m.role} content={m.content} />
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <TypingIndicator inBubble />
            </div>
          )}
        </div>
      </ChatLayout>
    </div>
  )
}
