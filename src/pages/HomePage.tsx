import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { NoteCard, Skeleton, Search } from '@akong/core'
import AppShell from '@/components/AppShell'
import { api, type NoteSummary } from '@/api/client'

const TABS = ['关注', '推荐', '附近']

export default function HomePage() {
  const navigate = useNavigate()
  const [items, setItems] = useState<NoteSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(1)

  useEffect(() => {
    let alive = true
    setLoading(true)
    api.feed(null, 20)
      .then((d) => alive && setItems(d.items))
      .catch(() => alive && setItems([]))
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [])

  return (
    <AppShell>
      <header className="sticky top-0 z-30 bg-[var(--ak-bg)]/85 backdrop-blur safe-top">
        <div className="flex items-center px-2 py-2 gap-1">
          <div className="w-11 h-11" />
          <div className="flex-1 flex items-center justify-center gap-7">
            {TABS.map((t, i) => (
              <button
                key={t}
                onClick={() => setActiveTab(i)}
                className={`px-1 py-2 min-h-[44px] text-[16px] tracking-tight ${
                  activeTab === i ? 'text-[var(--ak-fg)] font-semibold' : 'text-[var(--ak-fg-tertiary)]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <button aria-label="搜索" className="w-11 h-11 flex items-center justify-center text-[var(--ak-fg)]"><Search size={20} aria-label="搜索" /></button>
        </div>
      </header>

      <div className="px-2 pt-1">
        {loading ? (
          <div className="columns-2 gap-2.5">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} height={220 + (i % 3) * 60} radius="lg" className="break-inside-avoid mb-2.5" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center text-sm text-[var(--ak-fg-tertiary)] py-12">还没有笔记</div>
        ) : (
          <div className="columns-2 gap-2.5">
            {items.map((n) => (
              <NoteCard
                key={n.id}
                id={n.id}
                cover={n.cover}
                title={n.title}
                author={n.author}
                likes={n.likes}
                ratio={n.ratio}
                onPress={() => navigate(`/note/${n.id}`)}
              />
            ))}
          </div>
        )}
        <div className="text-center text-xs text-[var(--ak-fg-tertiary)] py-8">— 没有更多了 —</div>
      </div>
    </AppShell>
  )
}
