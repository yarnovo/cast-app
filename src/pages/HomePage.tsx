import { useEffect, useState } from 'react'
import { Skeleton } from '@akong/core'
import AppShell from '@/components/AppShell'
import { PostCard } from '@/components/PostCard'
import { api, type FeedType, type PostPublic } from '@/api/client'
import { getMe } from '@/auth'

const TABS: { key: FeedType; label: string }[] = [
  { key: 'follow', label: '关注' },
  { key: 'recommend', label: '推荐' },
  { key: 'nearby', label: '同城' },
]

export default function HomePage() {
  const me = getMe()
  const [tab, setTab] = useState<FeedType>('recommend')
  const [posts, setPosts] = useState<PostPublic[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    setLoading(true)
    api
      .feed(tab, me, 30)
      .then((list) => alive && setPosts(list))
      .catch(() => alive && setPosts([]))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [tab, me])

  const toggleLike = async (p: PostPublic) => {
    // 乐观更新 · 失败回滚
    const prev = posts
    setPosts(
      posts.map((x) =>
        x.id === p.id
          ? { ...x, is_liked: !x.is_liked, likes: x.is_liked ? Math.max(0, x.likes - 1) : x.likes + 1 }
          : x,
      ),
    )
    try {
      const r = await api.likePost(p.id, me)
      setPosts((cur) =>
        cur.map((x) => (x.id === p.id ? { ...x, is_liked: r.liked, likes: r.likes } : x)),
      )
    } catch {
      setPosts(prev)
    }
  }

  return (
    <AppShell>
      <header className="sticky top-0 z-30 bg-[var(--ak-bg)]/85 backdrop-blur safe-top">
        <div className="flex items-center justify-center gap-7 py-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-1 py-2 min-h-[44px] text-[16px] tracking-tight ${
                tab === t.key ? 'text-[var(--ak-fg)] font-semibold' : 'text-[var(--ak-fg-tertiary)]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <div>
        {loading ? (
          <div className="px-4 py-3 space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <Skeleton height={32} width={32} radius="full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton height={12} width="40%" radius="sm" />
                    <Skeleton height={10} width="20%" radius="sm" />
                  </div>
                </div>
                <Skeleton height={14} radius="sm" />
                <Skeleton height={14} width="80%" radius="sm" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <EmptyHint tab={tab} />
        ) : (
          <div>
            {posts.map((p) => (
              <PostCard key={p.id} post={p} onToggleLike={toggleLike} />
            ))}
            <div className="text-center text-xs text-[var(--ak-fg-tertiary)] py-8">— 没有更多了 —</div>
          </div>
        )}
      </div>
    </AppShell>
  )
}

function EmptyHint({ tab }: { tab: FeedType }) {
  const text =
    tab === 'follow'
      ? '还没关注任何人 · 去推荐看看吧'
      : tab === 'nearby'
        ? '还没人在你城市发帖'
        : '还没有帖子'
  return <div className="text-center text-[13px] text-[var(--ak-fg-tertiary)] py-16">{text}</div>
}
