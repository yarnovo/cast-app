import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ServiceCard, Skeleton, Search } from '@akong/core'
import AppShell from '@/components/AppShell'
import { api, type RoleSummary, type ServicePublic } from '@/api/client'

const TABS = ['关注', '推荐', '同城'] as const
type Tab = (typeof TABS)[number]

type Item = { service: ServicePublic; role: RoleSummary }

// 推荐排序 v1: 简单 score (服务包数 + 随机噪声) · 后端没 score 字段时前端兜底
const recommendScore = (it: Item) => it.role.services_count * 2 + Math.random() * 5

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

  // 按 tab 选不同子集 / 排序
  const visible = useMemo(() => {
    if (tab === '推荐') {
      return [...items].sort((a, b) => recommendScore(b) - recommendScore(a))
    }
    if (tab === '关注') return [] // 后端没 follow filter · 暂留空
    if (tab === '同城') return [] // 后端没 location filter · 暂留空
    return items
  }, [items, tab])

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
        ) : visible.length === 0 ? (
          <div className="text-center text-sm text-[var(--ak-fg-tertiary)] py-12">
            {tab === '关注' && '还没关注任何人 · 去推荐看看'}
            {tab === '同城' && '还没有同城内容'}
            {tab === '推荐' && '还没有虚拟角色 · 去消息里找阿空小造聊几句造一个'}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {visible.map(({ service, role }) => (
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
