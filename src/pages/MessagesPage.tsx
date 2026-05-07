import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Avatar } from '@akong/core'
import AppShell from '@/components/AppShell'
import { api, type NoteSummary } from '@/api/client'

export default function MessagesPage() {
  const [list, setList] = useState<NoteSummary[]>([])
  useEffect(() => { api.feed(null, 6).then((d) => setList(d.items)).catch(() => {}) }, [])

  return (
    <AppShell>
      <header className="sticky top-0 z-30 bg-[var(--ak-bg)]/85 backdrop-blur safe-top">
        <div className="px-5 pt-3 pb-3 text-[20px] font-semibold tracking-tight">消息</div>
      </header>
      <ul>
        {list.length === 0 ? (
          <li className="text-center py-16 text-[var(--ak-fg-tertiary)] text-[13px]">还没有消息</li>
        ) : list.map((n) => (
          <li key={n.id}>
            <Link to={`/dm/${n.author.id}`} className="flex items-center gap-3 px-5 py-3.5">
              <Avatar src={n.author.avatar} name={n.author.name} size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[14px] font-medium truncate">{n.author.name}</span>
                  <span className="text-[11px] text-[var(--ak-fg-tertiary)] shrink-0">刚刚</span>
                </div>
                <div className="text-[13px] text-[var(--ak-fg-secondary)] truncate mt-0.5">
                  点赞了你的笔记 · {n.title}
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </AppShell>
  )
}
