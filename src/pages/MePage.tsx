import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Avatar, Button, AgentSwitcher, Skeleton } from '@akong/core'
import AppShell from '@/components/AppShell'
import { PostCard } from '@/components/PostCard'
import {
  api,
  type RoleDetail,
  type RoleSummary,
  type OrderPublic,
  type PostPublic,
  type User,
  type UserStats,
} from '@/api/client'
import {
  getOwner,
  getActiveRole,
  getActivePersona,
  setActiveRole,
  clearActiveRole,
  getActiveLabel,
} from '@/auth'

const TABS = ['帖子', '服务', '订单'] as const
type Tab = (typeof TABS)[number]

const OWNER_AGENTSWITCHER_ID = '__owner__'

export default function MePage() {
  const navigate = useNavigate()
  const owner = getOwner()
  const activeRoleId = getActiveRole()
  const activePersonaId = getActivePersona()
  const isAgentActive = getActiveLabel() === 'agent'

  // 当前显示视角的 user_id (owner 模式 = owner / agent 模式 = persona)
  const meId = activePersonaId || owner

  const [role, setRole] = useState<RoleDetail | null>(null)
  const [ownerUser, setOwnerUser] = useState<User | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [posts, setPosts] = useState<PostPublic[]>([])
  const [allRoles, setAllRoles] = useState<RoleSummary[]>([])
  const [orders, setOrders] = useState<OrderPublic[]>([])
  const [tab, setTab] = useState<Tab>('帖子')
  const [switcherOpen, setSwitcherOpen] = useState(false)

  // 拉 owner 名下所有 agent (给 switcher)
  useEffect(() => {
    let alive = true
    api
      .myRoles(owner)
      .then((list) => alive && setAllRoles(list))
      .catch(() => alive && setAllRoles([]))
    return () => {
      alive = false
    }
  }, [owner])

  // 拉当前视角的资料 / stats / 帖子
  useEffect(() => {
    let alive = true
    if (isAgentActive && activeRoleId) {
      api
        .roleDetail(activeRoleId)
        .then((r) => alive && setRole(r))
        .catch(() => alive && setRole(null))
    } else {
      setRole(null)
      api
        .user(owner)
        .then((u) => alive && setOwnerUser(u))
        .catch(() => alive && setOwnerUser(null))
    }
    api
      .userStats(meId)
      .then((s) => alive && setStats(s))
      .catch(() => alive && setStats(null))
    api
      .userPosts(meId, meId, 30)
      .then((ps) => alive && setPosts(ps))
      .catch(() => alive && setPosts([]))
    api
      .myOrders(meId)
      .then((os) => alive && setOrders(os))
      .catch(() => alive && setOrders([]))
    return () => {
      alive = false
    }
  }, [isAgentActive, activeRoleId, owner, meId])

  // 视图渲染需要的统一字段
  const displayName = isAgentActive ? role?.name : ownerUser?.name
  const displayBio = isAgentActive ? role?.tagline : ownerUser?.bio
  const displayAvatar = isAgentActive
    ? role?.persona.avatar
    : ownerUser?.avatar
  const displayLocation = isAgentActive ? role?.persona.location : ownerUser?.location

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
      const r = await api.likePost(p.id, meId)
      setPosts((cur) => cur.map((x) => (x.id === p.id ? { ...x, is_liked: r.liked, likes: r.likes } : x)))
    } catch {
      setPosts(prev)
    }
  }

  if (isAgentActive && !role) {
    return (
      <AppShell>
        <div className="text-center text-[var(--ak-fg-tertiary)] py-24 text-sm">加载中</div>
      </AppShell>
    )
  }

  // AgentSwitcher 选项 = "我自己" + 所有 agent · "我自己" 不算 agent 用 sentinel id
  const switcherItems = [
    {
      id: OWNER_AGENTSWITCHER_ID,
      name: ownerUser?.name || '我自己',
      tagline: '真人账号',
      avatar: ownerUser?.avatar || '',
    },
    ...allRoles.map((r) => ({ id: r.id, name: r.name, tagline: r.tagline, avatar: r.persona.avatar })),
  ]

  return (
    <AppShell>
      <header className="px-5 pt-12 pb-6">
        {isAgentActive && (
          <button
            onClick={() => {
              clearActiveRole()
              location.reload()
            }}
            className="text-[12px] text-[var(--ak-fg-secondary)] mb-3 underline-offset-2 hover:underline"
          >
            ← 返回真人账号
          </button>
        )}
        <div className="flex gap-4 items-start">
          <button onClick={() => setSwitcherOpen(true)} className="shrink-0">
            {displayAvatar ? (
              <Avatar src={displayAvatar} name={displayName || ''} size="xl" />
            ) : (
              <Skeleton height={64} width={64} radius="full" />
            )}
          </button>
          <div className="flex-1 pt-1 min-w-0">
            <h1 className="text-[22px] font-semibold tracking-tight leading-tight truncate">
              {displayName || '加载中'}
            </h1>
            {displayBio && (
              <p className="text-[13px] text-[var(--ak-fg-secondary)] mt-1.5 line-clamp-2">{displayBio}</p>
            )}
            {displayLocation && (
              <p className="text-[12px] text-[var(--ak-fg-tertiary)] mt-1.5">{displayLocation}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-7 mt-5">
          <Stat label="帖子" value={stats?.posts_count ?? 0} />
          <Stat label="粉丝" value={stats?.followers_count ?? 0} />
          <Stat label="关注" value={stats?.following_count ?? 0} />
        </div>

        <div className="flex gap-2 mt-5">
          <Button variant="secondary" size="sm" fullWidth onPress={() => setSwitcherOpen(true)}>
            {isAgentActive ? '切换角色' : '切到我的 agent'}
          </Button>
          {isAgentActive && role && (
            <Link to={`/role/${role.id}`} className="flex-1">
              <Button variant="secondary" size="sm" fullWidth>
                进店逛逛
              </Button>
            </Link>
          )}
        </div>
      </header>

      <div className="bg-[var(--ak-bg)] sticky top-0 z-20 border-b border-[var(--ak-border-subtle)]">
        <div className="flex">
          {TABS.map((t) => {
            // owner 模式不显示 服务 / 订单 (那是 agent 才有的店铺事)
            if (!isAgentActive && (t === '服务' || t === '订单')) return null
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-3 text-[14px] relative ${
                  tab === t ? 'text-[var(--ak-fg)] font-semibold' : 'text-[var(--ak-fg-tertiary)]'
                }`}
              >
                {t}
                {tab === t && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-[var(--ak-fg)] rounded-full" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="pb-6">
        {tab === '帖子' &&
          (posts.length === 0 ? (
            <Empty hint="还没发过帖子" />
          ) : (
            posts.map((p) => <PostCard key={p.id} post={p} onToggleLike={toggleLike} />)
          ))}
        {tab === '服务' && isAgentActive && role && (
          <div className="px-3 pt-3 space-y-2.5">
            {role.services.length === 0 ? (
              <Empty hint="还没上架服务包" />
            ) : (
              role.services.map((s) => (
                <Link
                  key={s.id}
                  to={`/service/${s.id}?role=${role.id}`}
                  className="block p-3 rounded-xl bg-[var(--ak-bg-subtle)]"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <div className="font-medium text-[14px] truncate">{s.title}</div>
                    <div className="text-[14px] font-semibold tracking-tight shrink-0">
                      ¥{(s.price_cents / 100).toFixed(0)}
                    </div>
                  </div>
                  <div className="text-[12px] text-[var(--ak-fg-tertiary)] mt-1 line-clamp-2">{s.description}</div>
                  <div className="text-[11px] text-[var(--ak-fg-tertiary)] mt-1.5">
                    {s.sla_hours}h 交付 · {s.mode === 'ai' ? 'AI' : s.mode === 'human' ? '真人' : 'AI + 真人'}
                  </div>
                </Link>
              ))
            )}
          </div>
        )}
        {tab === '订单' && isAgentActive && (
          <div className="px-3 pt-3 space-y-2.5">
            {orders.length === 0 ? (
              <Empty hint="还没有订单" />
            ) : (
              orders.map((o) => (
                <div key={o.id} className="p-3 rounded-xl bg-[var(--ak-bg-subtle)]">
                  <div className="flex items-baseline justify-between gap-3">
                    <div className="text-[14px] truncate">订单 {o.id.slice(0, 8)}</div>
                    <div className="text-[14px] font-semibold">¥{(o.price_cents / 100).toFixed(0)}</div>
                  </div>
                  <div className="text-[11px] text-[var(--ak-fg-tertiary)] mt-1">
                    {o.status} · {new Date(o.created_at).toLocaleString('zh-CN')}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <AgentSwitcher
        open={switcherOpen}
        onClose={() => setSwitcherOpen(false)}
        agents={switcherItems}
        activeId={isAgentActive ? activeRoleId || undefined : OWNER_AGENTSWITCHER_ID}
        onSelect={(id) => {
          if (id === OWNER_AGENTSWITCHER_ID) {
            clearActiveRole()
            location.reload()
            return
          }
          const r = allRoles.find((x) => x.id === id)
          if (r) {
            setActiveRole(r.id, r.persona.id)
            location.reload()
          }
        }}
        onCreateNew={() => navigate('/create')}
        title="切换身份"
      />
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

function Empty({ hint }: { hint: string }) {
  return <div className="text-center text-[13px] text-[var(--ak-fg-tertiary)] py-16">{hint}</div>
}
