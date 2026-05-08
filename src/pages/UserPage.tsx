import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Avatar, Button, ChevronLeft, MessageSquare, Skeleton } from '@akong/core'
import { toast } from 'sonner'
import AppShell from '@/components/AppShell'
import { PostCard } from '@/components/PostCard'
import { api, type PostPublic, type User, type UserStats } from '@/api/client'
import { getMe } from '@/auth'

export default function UserPage() {
  const { userId = '' } = useParams()
  const navigate = useNavigate()
  const me = getMe()
  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [posts, setPosts] = useState<PostPublic[]>([])
  const [loading, setLoading] = useState(true)
  const [following, setFollowing] = useState(false)
  const [followBusy, setFollowBusy] = useState(false)

  const isMe = userId === me

  useEffect(() => {
    let alive = true
    setLoading(true)
    Promise.all([
      api.user(userId).catch(() => null),
      api.userStats(userId).catch(() => null),
      api.userPosts(userId, me, 30).catch(() => [] as PostPublic[]),
    ]).then(([u, s, ps]) => {
      if (!alive) return
      setUser(u)
      setStats(s)
      setPosts(ps)
      // is_following_author 在 post 里 · 取第一个推断 · 没 post 就保守 false
      setFollowing(ps[0]?.is_following_author ?? false)
      setLoading(false)
    })
    return () => {
      alive = false
    }
  }, [userId, me])

  const onFollow = async () => {
    if (followBusy || isMe) return
    setFollowBusy(true)
    try {
      const r = await api.follow(me, userId)
      setFollowing(r.following)
      toast.success(r.following ? '已关注' : '已取消关注')
    } catch (e) {
      toast.error('操作失败', { description: String(e) })
    } finally {
      setFollowBusy(false)
    }
  }

  const toggleLike = async (p: PostPublic) => {
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
      setPosts((cur) => cur.map((x) => (x.id === p.id ? { ...x, is_liked: r.liked, likes: r.likes } : x)))
    } catch {
      setPosts(prev)
    }
  }

  return (
    <AppShell>
      <header className="sticky top-0 z-30 bg-[var(--ak-bg)]/85 backdrop-blur flex items-center px-2 py-2 safe-top">
        <button onClick={() => navigate(-1)} aria-label="返回" className="w-11 h-11 flex items-center justify-center">
          <ChevronLeft size={24} />
        </button>
        <span className="flex-1 font-medium text-[15px] truncate">{user?.name || '个人主页'}</span>
      </header>

      {loading ? (
        <div className="px-5 py-6 space-y-3">
          <Skeleton height={64} width={64} radius="full" />
          <Skeleton height={20} width="40%" radius="sm" />
          <Skeleton height={14} width="80%" radius="sm" />
        </div>
      ) : !user ? (
        <div className="text-center text-[var(--ak-fg-tertiary)] py-24 text-sm">用户不存在</div>
      ) : (
        <>
          <section className="px-5 pt-3 pb-5">
            <div className="flex gap-4 items-start">
              <Avatar src={user.avatar} name={user.name} size="xl" />
              <div className="flex-1 pt-1 min-w-0">
                <h1 className="text-[20px] font-semibold tracking-tight leading-tight truncate">{user.name}</h1>
                {user.bio && (
                  <p className="text-[13px] text-[var(--ak-fg-secondary)] mt-1.5 line-clamp-2">{user.bio}</p>
                )}
                {user.location && (
                  <p className="text-[12px] text-[var(--ak-fg-tertiary)] mt-1.5">{user.location}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-7 mt-5">
              <Stat label="帖子" value={stats?.posts_count ?? 0} />
              <Stat label="粉丝" value={stats?.followers_count ?? 0} />
              <Stat label="关注" value={stats?.following_count ?? 0} />
            </div>

            {!isMe && (
              <div className="flex gap-2 mt-5">
                <Button
                  variant={following ? 'secondary' : 'primary'}
                  size="md"
                  fullWidth
                  disabled={followBusy}
                  onPress={onFollow}
                >
                  {following ? '已关注' : '关注'}
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  fullWidth
                  onPress={() => navigate(`/dm/${userId}`)}
                >
                  <span className="inline-flex items-center gap-1">
                    <MessageSquare size={16} />
                    私信
                  </span>
                </Button>
              </div>
            )}
          </section>

          <div className="border-t border-[var(--ak-border-subtle)]">
            {posts.length === 0 ? (
              <div className="text-center text-[13px] text-[var(--ak-fg-tertiary)] py-16">还没有帖子</div>
            ) : (
              posts.map((p) => <PostCard key={p.id} post={p} onToggleLike={toggleLike} />)
            )}
          </div>
        </>
      )}
    </AppShell>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col">
      <span className="text-[18px] font-semibold tracking-tight leading-tight">{value}</span>
      <span className="text-[12px] text-[var(--ak-fg-secondary)] mt-0.5">{label}</span>
    </div>
  )
}
