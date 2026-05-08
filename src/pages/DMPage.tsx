import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { Avatar, ChatBubble, ChatInput, ChatLayout, ChevronLeft } from '@akong/core'
import { toast } from 'sonner'
import { api, type DMessage, type User } from '@/api/client'
import { getMe } from '@/auth'

export default function DMPage() {
  const { otherUserId = '' } = useParams()
  const navigate = useNavigate()
  const me = getMe()
  const [other, setOther] = useState<User | null>(null)
  const [messages, setMessages] = useState<DMessage[]>([])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    document.body.classList.add('no-body-scroll')
    return () => document.body.classList.remove('no-body-scroll')
  }, [])

  useEffect(() => {
    let alive = true
    api
      .user(otherUserId)
      .then((u) => alive && setOther(u))
      .catch(() => alive && setOther(null))
    api
      .dmHistory(me, otherUserId)
      .then((list) => alive && setMessages(list))
      .catch(() => alive && setMessages([]))
    return () => {
      alive = false
    }
  }, [otherUserId, me])

  const send = async (text: string) => {
    if (!text.trim() || sending) return
    setSending(true)
    try {
      const m = await api.sendDM(me, otherUserId, text)
      setMessages((cur) => [...cur, m])
      setDraft('')
    } catch (e) {
      toast.error('发送失败', { description: String(e) })
    } finally {
      setSending(false)
    }
  }

  const header = (
    <header className="bg-[var(--ak-bg)]/85 backdrop-blur flex items-center px-2 py-2 safe-top border-b border-[var(--ak-border-subtle)]">
      <button onClick={() => navigate(-1)} aria-label="返回" className="w-11 h-11 flex items-center justify-center">
        <ChevronLeft size={24} />
      </button>
      {other ? (
        <Link to={`/u/${other.id}`} className="flex items-center gap-2 flex-1 min-w-0">
          <Avatar src={other.avatar} name={other.name} size="sm" />
          <div className="font-semibold text-[15px] truncate">{other.name}</div>
        </Link>
      ) : (
        <div className="flex-1 font-semibold text-[15px]">私信</div>
      )}
    </header>
  )

  const footer = (
    <ChatInput
      value={draft}
      onChange={setDraft}
      onSend={send}
      disabled={sending}
      placeholder="说点什么..."
    />
  )

  return (
    <div className="fixed inset-0 z-40 mx-auto max-w-[480px]">
      <ChatLayout header={header} footer={footer} scrollKey={messages.length + (sending ? 1 : 0)}>
        <div className="px-3 py-4 space-y-3">
          {messages.length === 0 ? (
            <div className="text-center text-[13px] text-[var(--ak-fg-tertiary)] py-8">还没有消息 · 说一句吧</div>
          ) : (
            messages.map((m) => (
              <ChatBubble
                key={m.id}
                role={m.sender_id === me ? 'user' : 'assistant'}
                content={m.content}
                avatar={m.sender_id === me ? undefined : other?.avatar}
              />
            ))
          )}
        </div>
      </ChatLayout>
    </div>
  )
}
