import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { ConversationItem } from '@akong/core'
import AppShell from '@/components/AppShell'
import { api, type NoteSummary } from '@/api/client'

export default function MessagesPage() {
  const navigate = useNavigate()
  const [list, setList] = useState<NoteSummary[]>([])
  useEffect(() => { api.feed(null, 8).then((d) => setList(d.items)).catch(() => {}) }, [])

  return (
    <AppShell>
      <header className="sticky top-0 z-30 bg-[var(--ak-bg)]/85 backdrop-blur safe-top">
        <div className="px-5 pt-3 pb-3 text-[20px] font-semibold tracking-tight">消息</div>
      </header>
      {list.length === 0 ? (
        <div className="text-center py-16 text-[var(--ak-fg-tertiary)] text-[13px]">还没有消息</div>
      ) : (
        <ul>
          {list.map((n, i) => (
            <li key={n.id}>
              <ConversationItem
                avatar={n.author.avatar}
                name={n.author.name}
                lastMessage={`点赞了你的笔记 · ${n.title}`}
                time={i === 0 ? '刚刚' : i < 3 ? '12:34' : '昨天'}
                unread={i % 3 === 0 ? i + 1 : 0}
                online={i < 2}
                onPress={() => navigate(`/dm/${n.author.id}`)}
              />
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  )
}
