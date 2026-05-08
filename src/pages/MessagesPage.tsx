import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ConversationItem, Skeleton } from '@akong/core'
import AppShell from '@/components/AppShell'
import { api, type InboxItem } from '@/api/client'
import { getMe } from '@/auth'
import { relativeTime } from '@/utils/time'

export default function MessagesPage() {
  const navigate = useNavigate()
  const me = getMe()
  const [items, setItems] = useState<InboxItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    setLoading(true)
    api
      .inbox(me)
      .then((list) => alive && setItems(list))
      .catch(() => alive && setItems([]))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [me])

  return (
    <AppShell>
      <header className="sticky top-0 z-30 bg-[var(--ak-bg)]/85 backdrop-blur safe-top">
        <div className="px-5 pt-3 pb-3 text-[20px] font-semibold tracking-tight">消息</div>
      </header>
      {loading ? (
        <div className="px-4 py-3 space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton height={48} width={48} radius="full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton height={14} width="40%" radius="sm" />
                <Skeleton height={12} width="80%" radius="sm" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-[var(--ak-fg-tertiary)] text-[13px]">还没有消息</div>
      ) : (
        <div>
          {items.map((it) => (
            <ConversationItem
              key={it.user.id}
              avatar={it.user.avatar}
              name={it.user.name}
              lastMessage={it.last_message}
              time={relativeTime(it.last_at)}
              unread={it.unread}
              onPress={() => navigate(`/dm/${it.user.id}`)}
            />
          ))}
        </div>
      )}
    </AppShell>
  )
}
