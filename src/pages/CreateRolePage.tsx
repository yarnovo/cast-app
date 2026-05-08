import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, ChatLayout, ChatBubble, ChatInput, TypingIndicator, ChevronLeft } from '@akong/core'
import { toast } from 'sonner'
import { api, type Trigger } from '@/api/client'
import { getOwner } from '@/auth'

const META_AGENT_ID = 'ag_builtin_meta-xiaozao'

type Msg = { role: 'user' | 'assistant'; content: string }
const INTRO: Msg = {
  role: 'assistant',
  content: '你好 · 我是角色助手。\n你想造一个啥样的虚拟角色？她 / 他擅长什么 · 想接什么样的活？',
}

export default function CreateRolePage() {
  const navigate = useNavigate()
  const owner = getOwner()
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
      const trigger: Trigger = {
        kind: 'human-dm',
        payload: {
          from: owner,
          history: history.filter((m) => m !== INTRO).slice(-20),
          message: text,
        },
      }
      const r = await api.agentTick(META_AGENT_ID, trigger)
      const reply =
        r.messages.filter((m) => m.role === 'assistant').slice(-1)[0]?.content || '...'
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

  const header = (
    <header
      data-testid="create-role-header"
      className="bg-[var(--ak-bg)]/85 backdrop-blur flex items-center px-2 py-2 safe-top border-b border-[var(--ak-border-subtle)]"
    >
      <button onClick={() => navigate(-1)} aria-label="返回" className="w-11 h-11 flex items-center justify-center"><ChevronLeft size={24} /></button>
      <div className="flex-1">
        <div className="font-semibold leading-tight">角色助手</div>
        <div className="text-[11px] text-[var(--ak-fg-secondary)]">聊几句帮你造虚拟角色</div>
      </div>
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
