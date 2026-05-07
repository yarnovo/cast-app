import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, ChevronLeft, Send } from '@akong/core'
import { toast } from 'sonner'
import { api } from '@/api/client'
import { getOwner, setActiveRole } from '@/auth'

type Msg = { role: 'user' | 'assistant'; content: string }
const INTRO: Msg = {
  role: 'assistant',
  content: '你好 · 我是开店小助手。\n你想造一个啥样的数字角色？她 / 他擅长什么 · 想接什么样的活？',
}

export default function CreateRolePage() {
  const navigate = useNavigate()
  const owner = getOwner()
  const [history, setHistory] = useState<Msg[]>([INTRO])
  const [draft, setDraft] = useState('')
  const [composing, setComposing] = useState(false)
  const [sending, setSending] = useState(false)
  const [createdId, setCreatedId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [history.length])

  const send = async () => {
    const text = draft.trim()
    if (!text || sending) return
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

  return (
    <div className="flex flex-col bg-[var(--ak-bg)]" style={{ height: '100dvh' }}>
      <header className="shrink-0 z-30 bg-[var(--ak-bg)]/85 backdrop-blur flex items-center px-2 py-2 safe-top border-b border-[var(--ak-border-subtle)]">
        <button onClick={() => navigate(-1)} aria-label="返回" className="w-11 h-11 flex items-center justify-center"><ChevronLeft size={24} /></button>
        <div className="flex-1">
          <div className="font-semibold leading-tight">开店小助手</div>
          <div className="text-[11px] text-[var(--ak-fg-secondary)]">聊几句帮你造数字角色</div>
        </div>
      </header>

      <main ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-3 py-4 space-y-3">
        {history.map((m, i) => <Bubble key={i} msg={m} />)}
        {sending && <Typing />}
      </main>

      {createdId ? (
        <div className="shrink-0 border-t border-[var(--ak-border-subtle)] p-3 bg-[var(--ak-bg)] pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <Button variant="primary" size="lg" fullWidth onPress={() => navigate('/me')}>
            创建成功 · 去看我的角色
          </Button>
        </div>
      ) : (
        <div className="shrink-0 border-t border-[var(--ak-border-subtle)] p-3 bg-[var(--ak-bg)] pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <div className="flex items-center gap-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onCompositionStart={() => setComposing(true)}
              onCompositionEnd={() => setComposing(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !composing) {
                  e.preventDefault()
                  send()
                }
              }}
              placeholder="说说你想造什么角色..."
              enterKeyHint="send"
              autoCapitalize="none"
              rows={1}
              className="flex-1 max-h-32 min-h-[44px] px-3 py-2 bg-[var(--ak-bg-subtle)] rounded-2xl text-[14px] outline-none resize-none"
            />
            <Button variant="primary" size="md" disabled={sending || !draft.trim()} onPress={send} iconLeft={<Send size={16} />}>
              发送
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function Bubble({ msg }: { msg: Msg }) {
  const me = msg.role === 'user'
  return (
    <div className={`flex ${me ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] px-3 py-2 text-[14px] whitespace-pre-line leading-relaxed ${
          me
            ? 'bg-[var(--ak-fg)] text-[var(--ak-fg-inverse)] rounded-2xl rounded-tr-sm'
            : 'bg-[var(--ak-bg-subtle)] text-[var(--ak-fg)] rounded-2xl rounded-tl-sm'
        }`}
      >
        {msg.content}
      </div>
    </div>
  )
}

function Typing() {
  return (
    <div className="flex justify-start">
      <div className="px-4 py-3 bg-[var(--ak-bg-subtle)] rounded-2xl rounded-tl-sm">
        <div className="flex gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--ak-fg-tertiary)] animate-bounce" />
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--ak-fg-tertiary)] animate-bounce [animation-delay:120ms]" />
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--ak-fg-tertiary)] animate-bounce [animation-delay:240ms]" />
        </div>
      </div>
    </div>
  )
}
