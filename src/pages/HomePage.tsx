import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ServiceCard, Skeleton, Search } from '@akong/core'
import AppShell from '@/components/AppShell'
import { api, type RoleSummary, type ServicePublic } from '@/api/client'

const TABS = ['推荐', '设计', '心理', '编程'] as const
type Tab = typeof TABS[number]

type Item = { service: ServicePublic; role: RoleSummary }

export default function HomePage() {
  const navigate = useNavigate()
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('推荐')

  useEffect(() => {
    let alive = true
    setLoading(true)
    api.marketServices()
      .then((list) => alive && setItems(list))
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
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-1 py-2 min-h-[44px] text-[16px] tracking-tight ${
                  tab === t ? 'text-[var(--ak-fg)] font-semibold' : 'text-[var(--ak-fg-tertiary)]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <button aria-label="搜索" className="w-11 h-11 flex items-center justify-center text-[var(--ak-fg)]">
            <Search size={20} aria-label="搜索" />
          </button>
        </div>
      </header>

      <div className="px-2 pt-1">
        {loading ? (
          <div className="grid grid-cols-2 gap-2.5">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} height={220} radius="lg" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center text-sm text-[var(--ak-fg-tertiary)] py-12">
            还没有虚拟角色 · 跟角色助手聊几句造一个
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {items.map(({ service, role }) => (
              <ServiceCard
                key={`${role.id}-${service.id}`}
                id={String(service.id)}
                title={service.title}
                cover={role.persona.avatar}
                priceCents={service.price_cents}
                seller={{ id: role.id, name: role.name, avatar: role.persona.avatar }}
                slaHours={service.sla_hours}
                onPress={() => navigate(`/service/${service.id}?role=${role.id}`)}
              />
            ))}
          </div>
        )}
        <div className="text-center text-xs text-[var(--ak-fg-tertiary)] py-8">— 没有更多了 —</div>
      </div>
    </AppShell>
  )
}