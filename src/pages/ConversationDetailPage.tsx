import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Avatar, Button, ChatLayout, ChatBubble, ChatInput, TypingIndicator, ChevronLeft } from '@akong/core'
import { toast } from 'sonner'
import { api } from '@/api/client'
import { getOwner } from '@/auth'

const META_AGENT_ID = 'ag_builtin_meta-xiaozao'
const SESSION_KEY_PREFIX = 'cast_session:' // sessionStorage key 前缀 · 后接 `${agentId}:${userId}`
const MAX_TURNS = 10

type Msg = { role: 'user' | 'assistant'; content: string }

/** 阿空小造 INTRO · 跟之前 CreateRolePage 一致 */
const META_INTRO: Msg = {
  role: 'assistant',
  content: '你好 · 我是阿空小造。\n你想造一个啥样的虚拟角色？她 / 他擅长什么 · 想接什么样的活？',
}

const GENERIC_INTRO: Msg = {
  role: 'assistant',
  content: '你好 · 跟我聊聊吧。',
}

/** session_id 自生 · `s_` + 12 位 [a-z0-9] · 不引 nanoid 依赖 */
function newSessionId(): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let s = 's_'
  const rnd = new Uint8Array(12)
  crypto.getRandomValues(rnd)
  for (let i = 0; i < 12; i++) s += alphabet[rnd[i] % alphabet.length]
  return s
}

/**
 * 取 / 建该 (agent, user) 的 session_id。
 * 用户跟同一个 agent 的对话跨页 / 跨刷新持久化:
 *   - sessionStorage key = `cast_session:${agentId}:${userId}`
 *   - 没有就生新 + 写回
 */
function ensureSessionId(agentId: string, userId: string): string {
  const key = `${SESSION_KEY_PREFIX}${agentId}:${userId}`
  let sid: string | null = null
  try {
    sid = sessionStorage.getItem(key)
  } catch {
    // ignore
  }
  if (!sid) {
    sid = newSessionId()
    try {
      sessionStorage.setItem(key, sid)
    } catch {
      // ignore
    }
  }
  return sid
}

function clearSessionId(agentId: string, userId: string, next: string) {
  const key = `${SESSION_KEY_PREFIX}${agentId}:${userId}`
  try {
    sessionStorage.setItem(key, next)
  } catch {
    // ignore
  }
}

/**
 * 单聊天页 · 路由 /messages/:agentId
 *
 * 当前 MVP: 任意 agent_id 都走 cast-agents `/api/agent/run` 多轮 session 持久化逻辑。
 * 阿空小造 (ag_builtin_meta-xiaozao) 跟其他 agent 走同一套机制 · 后端无差别。
 *
 * UX:
 *   - 进页加载 (agent 信息 + INTRO 气泡)
 *   - 输入 → POST /api/agent/run (同 session_id) → 渲 final_text 单条气泡
 *   - 阿空小造 显示"重开"按钮 (清 session · 跟之前 CreateRolePage 一致)
 *   - 真造出 agent (action=cast.create_agent) → 弹"去看我的角色"按钮
 */
export default function ConversationDetailPage() {
  const navigate = useNavigate()
  const { agentId = '' } = useParams<{ agentId: string }>()
  const userId = getOwner()
  const isMeta = agentId === META_AGENT_ID

  const [sessionId, setSessionId] = useState<string>(() => ensureSessionId(agentId, userId))
  const [history, setHistory] = useState<Msg[]>([isMeta ? META_INTRO : GENERIC_INTRO])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [createdId, setCreatedId] = useState<string | null>(null)

  // agent 显示信息: 阿空小造 hardcoded · 其他从 cast-api 拉
  const [agentName, setAgentName] = useState<string>(isMeta ? '阿空小造' : '')
  const [agentAvatar, setAgentAvatar] = useState<string>('')

  useEffect(() => {
    document.body.classList.add('no-body-scroll')
    return () => document.body.classList.remove('no-body-scroll')
  }, [])

  useEffect(() => {
    if (isMeta || !agentId) return
    let alive = true
    api.roleDetail(agentId)
      .then((d) => {
        if (!alive) return
        setAgentName(d.name || agentId)
        setAgentAvatar(d.persona?.avatar || '')
      })
      .catch(() => {
        if (alive) setAgentName(agentId)
      })
    return () => { alive = false }
  }, [agentId, isMeta])

  const send = async (text: string) => {
    if (!text.trim() || sending) return
    setSending(true)
    const newHistory: Msg[] = [...history, { role: 'user', content: text }]
    setHistory(newHistory)
    setDraft('')
    try {
      const r = await api.agentRun({
        agentId,
        sessionId,
        userMessage: text,
        maxTurns: MAX_TURNS,
      })
      // 跟 Claude Code 风一样: 只渲 final_text
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

  /** 重新开始 · 只阿空小造可见 · 清 session + 重生 session_id + 清 UI history */
  const restart = () => {
    if (sending) return
    const sid = newSessionId()
    clearSessionId(agentId, userId, sid)
    setSessionId(sid)
    setHistory([isMeta ? META_INTRO : GENERIC_INTRO])
    setCreatedId(null)
    setDraft('')
    toast.success('已重新开始')
  }

  const sessionShort = useMemo(() => sessionId.slice(0, 8), [sessionId])

  const header = (
    <header
      data-testid="conversation-header"
      className="bg-[var(--ak-bg)]/85 backdrop-blur flex items-center px-2 py-2 safe-top border-b border-[var(--ak-border-subtle)]"
    >
      <button onClick={() => navigate(-1)} aria-label="返回" className="w-11 h-11 flex items-center justify-center"><ChevronLeft size={24} /></button>
      <Avatar src={agentAvatar} name={agentName || agentId} size="sm" />
      <div className="flex-1 min-w-0 ml-2">
        <div className="font-semibold leading-tight truncate" data-testid="conversation-agent-name">
          {agentName || agentId}
        </div>
        <div className="text-[11px] text-[var(--ak-fg-secondary)]" data-testid="session-indicator">
          会话 {sessionShort}
        </div>
      </div>
      {isMeta && (
        <button
          data-testid="restart-btn"
          onClick={restart}
          aria-label="重新开始"
          disabled={sending}
          className="px-3 h-9 mr-1 text-[13px] font-medium text-[var(--ak-fg-secondary)] hover:text-[var(--ak-fg)] disabled:opacity-50 rounded-md"
        >
          重开
        </button>
      )}
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
        placeholder={isMeta ? '说说你想造什么角色...' : '说点什么...'}
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
