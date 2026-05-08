import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Avatar, ChatLayout, ChatBubble, ChatInput, TypingIndicator } from '@akong/core'
import { toast } from 'sonner'
import AppShell from '@/components/AppShell'
import { api } from '@/api/client'
import { getOwner } from '@/auth'

/**
 * cast-app · 默认入口 ChatPage (REQ-004 · 5-9 老板拍 v3)
 *
 * `/` 路由直接跳跟阿空小造的对话页 (开 app 即对话 · 不再看 feed)。
 * 但**保留** BottomNav + 其他页 (HomePage feed / MarketPage / MessagesPage / MePage) ·
 * 用户可以通过 BottomNav 切到其他 tab。
 *
 * 跟之前砍版的 CreateRolePage 同 multi-turn session 持久化逻辑:
 *   - sessionStorage(`cast_session`) + url query (?s=) 双持久化
 *   - 同 sid 反复 POST /api/agent/run · cast-agents 内部 RdsSession 续上下文
 *   - 头部"重开"按钮: 清 session + 生新 sid + 清 history
 */

const META_AGENT_ID = 'ag_builtin_meta-xiaozao'
const META_NAME = '阿空小造'
const SESSION_KEY = 'cast_session'
const SESSION_QS = 's'
const MAX_TURNS = 10

type Msg = { role: 'user' | 'assistant'; content: string }
const INTRO: Msg = {
  role: 'assistant',
  content: '你好 · 我是阿空小造。\n你想造一个啥样的虚拟角色？她 / 他擅长什么 · 想接什么样的活？',
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
 * 取 / 建 session_id · 优先级: url query `?s=` > sessionStorage > 新生
 * 取到 / 新生后立刻同步 sessionStorage + url (replaceState 不污染 history)
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

export default function ChatPage() {
  const [searchParams] = useSearchParams()
  const userId = getOwner()
  const [sessionId, setSessionId] = useState<string>(() => ensureSessionId(searchParams))
  const [history, setHistory] = useState<Msg[]>([INTRO])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)

  // 防 body 双滚动条 (chat 区自管 scroll)
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
      // 跟 Claude Code 风一样: 只渲 final_text · 不展示中间 system / tool_use turns
      const reply = (r.final_text || '').trim() || '...'
      setHistory([...newHistory, { role: 'assistant', content: reply }])
      const createAction = r.actions.find((a) => a.tool_id === 'cast.create_agent')
      const createdAgentId =
        (createAction?.result as { agent_id?: string } | null)?.agent_id || null
      if (createdAgentId) {
        toast.success(`艺人 ${createdAgentId} 创建成功`)
      }
    } catch (e) {
      toast.error('网络出错', { description: String(e) })
      setHistory([...newHistory, { role: 'assistant', content: '(出错了 · 再说一次?)' }])
    } finally {
      setSending(false)
    }
  }

  /** 重新开始 · 清 session + 重生 session_id + 清 UI history。老 session 留 cast-api DB 做审计。 */
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
    setDraft('')
    toast.success('已重新开始')
  }

  const sessionShort = useMemo(() => sessionId.slice(0, 8), [sessionId])

  const header = (
    <header
      data-testid="chat-header"
      className="bg-[var(--ak-bg)]/85 backdrop-blur flex items-center px-3 py-2 gap-2 safe-top border-b border-[var(--ak-border-subtle)]"
    >
      <Avatar name={META_NAME} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="font-semibold leading-tight truncate" data-testid="chat-agent-name">
          {META_NAME}
        </div>
        <div className="text-[11px] text-[var(--ak-fg-secondary)]" data-testid="session-indicator">
          会话 {sessionShort}
        </div>
      </div>
      <button
        data-testid="restart-btn"
        onClick={restart}
        aria-label="重新开始"
        disabled={sending}
        className="px-3 h-9 text-[13px] font-medium text-[var(--ak-fg-secondary)] hover:text-[var(--ak-fg)] disabled:opacity-50 rounded-md"
      >
        重开
      </button>
      <div data-testid="user-avatar">
        <Avatar name={userId} size="sm" />
      </div>
    </header>
  )

  const footer = (
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

  // 注: ChatLayout 自身是 flex-col 100% 高度 · 外层固定到视口减去 BottomNav (h-14 = 56px)。
  // 用 fixed 而非 inset-0 直接铺 · 避免覆盖 BottomNav。
  return (
    <AppShell>
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] h-[calc(100vh-3.5rem)] z-30">
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
    </AppShell>
  )
}
