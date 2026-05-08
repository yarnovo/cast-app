import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, ChatLayout, ChatBubble, ChatInput, TypingIndicator, ChevronLeft } from '@akong/core'
import { toast } from 'sonner'
import { api } from '@/api/client'
import { getOwner, setActiveRole } from '@/auth'

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
      const r = await api.metaChat(owner, history.filter((m) => m !== INTRO).slice(-20), text)
      setHistory([...newHistory, { role: 'assistant', content: r.reply }])
      if (r.created_agent_id) {
        setCreatedId(r.created_agent_id)
        try {
          const detail = await api.roleDetail(r.created_agent_id)
          setActiveRole(detail.id, detail.persona.id)
          toast.success('创建成功')
        } catch { /* ignore */ }
      }
    } catch (e) {
      toast.error('网络出错', { description: String(e) })
      setHistory([...newHistory, { role: 'assistant', content: '(出错了 · 再说一次?)' }])
    } finally {
      setSending(false)
    }
  }

  const header = (
    <header className="bg-[var(--ak-bg)]/85 backdrop-blur flex items-center px-2 py-2 safe-top border-b border-[var(--ak-border-subtle)]">
      <button onClick={() => navigate(-1)} aria-label="返回" className="w-11 h-11 flex items-center justify-center"><ChevronLeft size={24} /></button>
      <div className="flex-1">
        <div className="font-semibold leading-tight">角色助手</div>
        <div className="text-[11px] text-[var(--ak-fg-secondary)]">聊几句帮你造虚拟角色</div>
      </div>
    </header>
  )

  const footer = createdId ? (
    <div className="p-3 bg-[var(--ak-bg)] pb-[calc(0.75rem+env(safe-area-inset-bottom))] border-t border-[var(--ak-border-subtle)]">
      <Button variant="primary" size="lg" fullWidth onPress={() => navigate('/me')}>
        创建成功 · 去看我的角色
      </Button>
    </div>
  ) : (
    <ChatInput
      value={draft}
      onChange={setDraft}
      onSend={send}
      disabled={sending}
      placeholder="说说你想造什么角色..."
    />
  )

  return (
    <ChatLayout
      header={header}
      footer={footer}
      scrollKey={history.length + (sending ? 1 : 0)}
    >
      <div className="px-3 py-4 space-y-3">
        {history.map((m, i) => (
          <ChatBubble key={i} role={m.role} content={m.content} />
        ))}
        {sending && (
          <div className="flex justify-start">
            <TypingIndicator inBubble />
          </div>
        )}
      </div>
    </ChatLayout>
  )
}
